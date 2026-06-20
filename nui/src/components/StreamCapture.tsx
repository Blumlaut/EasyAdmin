/**
 * StreamCapture — hidden canvas that captures game frames continuously.
 *
 * Listens for `stream:start` / `stream:stop` messages from Lua and runs
 * a continuous capture loop using Three.js + CfxTexture.
 * Encoded frames are sent back to Lua via the `streamFrame` NUICallback.
 */

import { useEffect, useRef } from 'react'
import { createStreamEncoder, type StreamEncoder } from '../lib/stream_encoder'

interface StreamStartOptions {
  maxResolution: number
  quality: number
  targetFps: number
}

export function StreamCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const encoderRef = useRef<StreamEncoder | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const enc = createStreamEncoder(canvas)
    if (!enc) return // Three.js / CfxTexture not available (browser dev mode)

    encoderRef.current = enc

    return () => {
      enc.destroy()
      encoderRef.current = null
    }
  }, [])

  // Listen for stream control messages from Lua
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data
      if (!payload) return

      if (payload.action === 'stream:start') {
        const opts: StreamStartOptions = payload.data
        encoderRef.current?.start(opts)
      }

      if (payload.action === 'stream:stop') {
        encoderRef.current?.stop()
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
