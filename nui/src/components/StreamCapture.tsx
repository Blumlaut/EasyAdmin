/**
 * StreamCapture — hidden canvas + WebRTC publisher (target side).
 *
 * Runs on the player being streamed. Listens for control + signaling messages
 * from Lua and manages a `StreamPublisher` that renders the game frame
 * (CfxTexture) to a canvas and publishes it peer-to-peer to each viewer.
 *
 * Messages handled (Lua -> NUI):
 *   stream:start        — init publisher + render loop (first viewer)
 *   stream:teardown     — stop publisher (last viewer left)
 *   stream:addViewer    — negotiate a new PeerConnection for a viewer
 *   stream:removeViewer — close a viewer's PeerConnection
 *   stream:signal       — inbound signaling (answer from a viewer)
 */

import { useEffect, useRef } from 'react'
import { StreamPublisher, parseStunServers } from '../lib/stream_webrtc'

interface StreamStartOptions {
  maxResolution: number
  targetFps: number
  stunServers: string
}

export function StreamCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pubRef = useRef<StreamPublisher | null>(null)

  // Tear down the publisher on unmount
  useEffect(() => {
    return () => {
      pubRef.current?.destroy()
      pubRef.current = null
    }
  }, [])

  // Listen for stream control + signaling messages from Lua
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data
      if (!payload) return

      const canvas = canvasRef.current
      if (!canvas) return

      switch (payload.action) {
        case 'stream:start': {
          const opts = payload.data as StreamStartOptions
          // If a publisher already exists (e.g. stale start), tear it down first.
          pubRef.current?.destroy()
          const pub = new StreamPublisher(canvas, {
            maxResolution: opts.maxResolution,
            targetFps: opts.targetFps,
            stunServers: parseStunServers(opts.stunServers),
          })
          if (!pub.init()) return // Three.js / CfxTexture / captureStream unavailable
          pub.start()
          pubRef.current = pub
          break
        }
        case 'stream:teardown': {
          pubRef.current?.destroy()
          pubRef.current = null
          break
        }
        case 'stream:addViewer': {
          const viewerSrc = payload.data?.viewerSrc as number
          if (typeof viewerSrc === 'number') {
            void pubRef.current?.addViewer(viewerSrc)
          }
          break
        }
        case 'stream:removeViewer': {
          const viewerSrc = payload.data?.viewerSrc as number
          if (typeof viewerSrc === 'number') {
            pubRef.current?.removeViewer(viewerSrc)
          }
          break
        }
        case 'stream:signal': {
          const from = payload.data?.from as number
          const sig = payload.data?.payload
          if (typeof from === 'number' && sig) {
            void pubRef.current?.handleSignal(from, sig)
          }
          break
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering.
  // The WebGL drawingbuffer is sized to the capped stream resolution by the
  // publisher; CSS size stays 1x1 so it's invisible.
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
