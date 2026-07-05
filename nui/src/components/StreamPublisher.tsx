/**
 * StreamPublisher — hidden WebGL canvas + PeerJS publisher (target side).
 *
 * Runs on the player being streamed. Creates a raw WebGL canvas that renders
 * the game frame (CfxTexture), captures it via canvas.captureStream(), and
 * initiates PeerJS media connections to each viewer.
 *
 * The target (publisher) initiates the WebRTC calls because the caller's
 * SDP offer must contain the media tracks. If the viewer called first with
 * no tracks, the target's video answer would be silently dropped by the
 * WebRTC spec — answers can only include media types that were offered.
 *
 * Messages handled (Lua -> NUI):
 *   streamPublisher:start          — init renderer + PeerJS (first viewer)
 *   streamPublisher:stop           — teardown everything (last viewer left)
 *   streamPublisher:callViewer     — initiate a WebRTC call to a viewer
 *   streamPublisher:removeViewer   — close a viewer's connection
 */

import { useEffect, useRef } from 'react'
import Peer, { type MediaConnection } from 'peerjs'
import { callLua } from '../fivem'
import { buildPeerConfig, type IceConfigPayload } from '../lib/stream_ice'
import { createFrameRenderer, type FrameRenderer } from '../lib/game_frame_renderer'

interface StreamStartData {
  stunUrls: string[]
  turnUrls: string[]
  turnUsername: string
  turnCredential: string
  targetFps: number
}

interface CallViewerData {
  viewerSrc: number
  viewerPeerId: string
}

const LOG = '[EA-StreamPublisher]'

export function StreamPublisher() {
  const peerRef = useRef<Peer | null>(null)
  const callsRef = useRef<Map<number, MediaConnection>>(new Map())
  const rendererRef = useRef<FrameRenderer | null>(null)
  const iceConfigRef = useRef<IceConfigPayload | null>(null)
  const targetFpsRef = useRef(8)
  const isActiveRef = useRef(false)

  const teardown = () => {
    console.log(LOG, 'teardown()')
    isActiveRef.current = false

    // Close all viewer connections
    for (const call of callsRef.current.values()) {
      call.close()
    }
    callsRef.current.clear()

    // Destroy PeerJS instance
    if (peerRef.current) {
      try {
        peerRef.current.destroy()
      } catch {
        // Already destroyed
      }
      peerRef.current = null
    }

    // Destroy the frame renderer
    if (rendererRef.current) {
      rendererRef.current.destroy()
      rendererRef.current = null
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return teardown
  }, [])

  // Listen for control + signaling messages from Lua
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data
      if (!payload || !payload.action) return

      console.log(LOG, 'message received:', payload.action, payload.data)
      switch (payload.action) {
        case 'streamPublisher:start': {
          console.log(LOG, 'start: tearing down any existing publisher')
          // If a publisher already exists, tear it down first
          teardown()

          const data = payload.data as StreamStartData
          iceConfigRef.current = {
            stunUrls: data.stunUrls ?? [],
            turnUrls: data.turnUrls ?? [],
            turnUsername: data.turnUsername ?? '',
            turnCredential: data.turnCredential ?? '',
          }
          targetFpsRef.current = data.targetFps ?? 8

          // Create the WebGL frame renderer
          console.log(LOG, 'start: creating frame renderer at', targetFpsRef.current, 'fps')
          const renderer = createFrameRenderer(targetFpsRef.current)
          if (!renderer) {
            // WebGL / CfxTexture / captureStream unavailable
            console.error(LOG, 'start: createFrameRenderer returned null — cannot publish')
            return
          }
          console.log(LOG, 'start: frame renderer created, canvas:', renderer.canvas.width, 'x', renderer.canvas.height)
          rendererRef.current = renderer
          isActiveRef.current = true

          // Create PeerJS instance
          const peerConfig = buildPeerConfig(iceConfigRef.current)
          const peerId = `ea-streamer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          console.log(LOG, 'start: creating PeerJS with id', peerId, 'config:', JSON.stringify(peerConfig))
          const peer = new Peer(peerId, peerConfig)
          peerRef.current = peer

          // On open: report our peerId to the server
          peer.on('open', () => {
            console.log(LOG, 'PeerJS open, id:', peer.id)
            void callLua('streamPublisher:peerReady', { peerId: peer.id, role: 'target' })
          })

          peer.on('error', (err) => {
            console.error(LOG, 'PeerJS error:', err.type, err.message)
          })

          // Handle disconnection — attempt reconnect once
          peer.on('disconnected', () => {
            try {
              peer.reconnect()
            } catch {
              // Reconnect failed
            }
          })

          break
        }

        case 'streamPublisher:stop': {
          console.log(LOG, 'stop: tearing down publisher')
          teardown()
          break
        }

        case 'streamPublisher:callViewer': {
          const data = payload.data as CallViewerData
          const { viewerSrc, viewerPeerId } = data
          const peer = peerRef.current
          const renderer = rendererRef.current

          console.log(LOG, 'callViewer: viewerSrc=', viewerSrc, 'viewerPeerId=', viewerPeerId)
          if (!peer) { console.error(LOG, 'callViewer: no PeerJS instance'); return }
          if (!renderer) { console.error(LOG, 'callViewer: no renderer'); return }
          if (!viewerPeerId) { console.error(LOG, 'callViewer: no viewerPeerId'); return }
          if (callsRef.current.has(viewerSrc)) { console.log(LOG, 'callViewer: already connected to viewer', viewerSrc); return }

          console.log(LOG, 'callViewer: calling', viewerPeerId, 'with stream tracks:', renderer.stream.getTracks().length)
          // Initiate a WebRTC call to the viewer, sending the video stream.
          // The caller's SDP offer contains the video track, so the viewer's
          // empty-stream answer is valid and the media path is established.
          const call = peer.call(viewerPeerId, renderer.stream)
          callsRef.current.set(viewerSrc, call)

          call.on('stream', (remoteStream) => {
            console.log(LOG, 'callViewer: received remote stream from viewer', viewerSrc, 'tracks:', remoteStream.getTracks().length)
          })

          call.on('close', () => {
            console.log(LOG, 'callViewer: call closed for viewer', viewerSrc)
            callsRef.current.delete(viewerSrc)
          })

          call.on('error', (err) => {
            console.error(LOG, 'callViewer: call error for viewer', viewerSrc, err)
            callsRef.current.delete(viewerSrc)
          })

          break
        }

        case 'streamPublisher:removeViewer': {
          const viewerSrc = (payload.data as { viewerSrc: number })?.viewerSrc
          if (typeof viewerSrc === 'number') {
            const call = callsRef.current.get(viewerSrc)
            if (call) {
              call.close()
              callsRef.current.delete(viewerSrc)
            }
          }
          break
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // No visible UI — the canvas is appended to body by the frame renderer
  return null
}
