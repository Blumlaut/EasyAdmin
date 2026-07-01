/**
 * StreamPublisher — hidden WebGL canvas + PeerJS publisher (target side).
 *
 * Runs on the player being streamed. Creates a raw WebGL canvas that renders
 * the game frame (CfxTexture), captures it via canvas.captureStream(), and
 * publishes the video track to each viewer over PeerJS media connections.
 *
 * Messages handled (Lua -> NUI):
 *   streamPublisher:start          — init renderer + PeerJS (first viewer)
 *   streamPublisher:stop           — teardown everything (last viewer left)
 *   streamPublisher:addViewer      — expect an incoming call from a viewer
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

export function StreamPublisher() {
  const peerRef = useRef<Peer | null>(null)
  const callsRef = useRef<Map<number, MediaConnection>>(new Map())
  const rendererRef = useRef<FrameRenderer | null>(null)
  const iceConfigRef = useRef<IceConfigPayload | null>(null)
  const targetFpsRef = useRef(8)
  const isActiveRef = useRef(false)

  const teardown = () => {
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

      switch (payload.action) {
        case 'streamPublisher:start': {
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
          const renderer = createFrameRenderer(targetFpsRef.current)
          if (!renderer) {
            // WebGL / CfxTexture / captureStream unavailable
            return
          }
          rendererRef.current = renderer
          isActiveRef.current = true

          // Create PeerJS instance
          const peerConfig = buildPeerConfig(iceConfigRef.current)
          const peerId = `ea-streamer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const peer = new Peer(peerId, peerConfig)
          peerRef.current = peer

          // On open: report our peerId to the server
          peer.on('open', () => {
            void callLua('streamPublisher:peerReady', { peerId: peer.id })
          })

          // On incoming call from a viewer
          peer.on('call', (call) => {
            // Answer with the frame renderer's MediaStream
            if (rendererRef.current) {
              call.answer(rendererRef.current.stream)

              // The call.peer is the viewer's PeerJS ID — we track by viewerSrc
              // The mapping is established when the viewer initiates
              call.on('close', () => {
                callsRef.current.delete(call.peer as unknown as number)
              })

              // Store by the call's peer ID (we'll map viewerSrc -> call later)
              callsRef.current.set(call.peer as unknown as number, call)
            }
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
          teardown()
          break
        }

        case 'streamPublisher:addViewer': {
          // The viewer will initiate the call once both peers are ready.
          // We just need to be ready to answer (handled by peer.on('call') above).
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
