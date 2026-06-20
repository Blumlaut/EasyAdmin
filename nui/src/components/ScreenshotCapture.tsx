/**
 * ScreenshotCapture — hidden canvas that captures game frames via Three.js + CfxTexture.
 *
 * Renders a 1x1 hidden canvas inside the visible DOM tree (required for OSR).
 * Listens for `screenshot:request` messages from Lua and responds via NUICallback.
 */

import { useEffect, useRef, useState } from 'react'
import { createCapture, type ScreenshotCaptureCtx } from '../lib/screenshot'
import { callLua } from '../fivem'

interface ScreenshotRequest {
  correlationId: string
  maxResolution?: number // max length of the longer dimension (default 1280)
  quality?: number
}

export function ScreenshotCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<ScreenshotCaptureCtx | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const cap = createCapture(canvas)
    if (!cap) {
      // Three.js / CfxTexture not available (browser dev mode)
      return
    }

    captureRef.current = cap
    setReady(true)

    // Handle resize
    const handleResize = () => cap.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cap.destroy()
      captureRef.current = null
      setReady(false)
    }
  }, [])

  // Listen for screenshot requests from Lua
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const payload = event.data
      if (!payload || payload.action !== 'screenshot:request') return
      if (!captureRef.current || !ready) return

      const capture = captureRef.current
      const req: ScreenshotRequest = payload.data
      const dataUri = await capture.capture(
        req.maxResolution ?? 1280,
        req.quality ?? 0.8,
      )

      // Send result back to Lua via NUICallback
      await callLua('screenshotResult', {
        correlationId: req.correlationId,
        data: dataUri,
      })
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [ready])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
