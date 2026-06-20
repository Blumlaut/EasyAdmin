/**
 * ScreenshotCapture — hidden canvas that captures game frames via Three.js + CfxTexture.
 *
 * Renders a 1x1 hidden canvas inside the visible DOM tree (required for OSR).
 * Runs a continuous render loop to keep the WebGL context and CfxTexture warm
 * (mirrors screenshot-basic's requestAnimationFrame pattern).
 * Listens for `screenshot:request` messages from Lua and responds via NUICallback.
 */

import { useEffect, useRef } from 'react'
import { createCapture, type ScreenshotCaptureCtx } from '../lib/screenshot'
import { callLua, on } from '../fivem'

interface ScreenshotRequest {
  correlationId: string
  maxResolution?: number // max length of the longer dimension (default 1280)
  quality?: number
}

export function ScreenshotCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<ScreenshotCaptureCtx | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('[EA-Screenshot] canvas ref is null, cannot initialize')
      return
    }

    const cap = createCapture(canvas)
    if (!cap) {
      // Three.js / CfxTexture not available (browser dev mode)
      return
    }

    captureRef.current = cap
    cap.startRenderLoop()

    // Handle resize
    const handleResize = () => cap.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cap.destroy()
      captureRef.current = null
    }
  }, [])

  // Listen for screenshot requests from Lua (no dependencies — fires once on mount)
  useEffect(() => {
    return on<ScreenshotRequest>('screenshot:request', async (req) => {

      const capture = captureRef.current
      if (!capture) {
        console.error('[EA-Screenshot] captureRef is null, cannot capture')
        await callLua('screenshotResult', {
          correlationId: req.correlationId,
          data: 'ERROR',
        })
        return
      }

      const dataUri = await capture.capture(
        req.maxResolution ?? 1280,
        req.quality ?? 0.8,
      )

      // Send result back to Lua via NUICallback
      await callLua('screenshotResult', {
        correlationId: req.correlationId,
        data: dataUri ?? 'ERROR',
      })
    })
  }, [])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
