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
import { loadThree } from '../lib/three-loader'
import { callLua, on } from '../fivem'

interface ScreenshotRequest {
  correlationId: string
  maxResolution?: number // max length of the longer dimension (default 1280)
  quality?: number
}

export function ScreenshotCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureRef = useRef<ScreenshotCaptureCtx | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Initialize Three.js + WebGL pipeline.
  // loadThree() is pre-fetched in main.tsx, so this typically resolves immediately.
  // The screenshot event listener is registered INSIDE this effect so it only fires
  // after the render loop is running — no race condition.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('[EA-Screenshot] canvas ref is null, cannot initialize')
      return
    }

    let cancelled = false

    ;(async () => {
      await loadThree()
      if (cancelled) return

      const cap = createCapture(canvas)
      if (!cap) {
        // Three.js / CfxTexture not available (browser dev mode)
        return
      }
      if (cancelled) { cap.destroy(); return }

      cap.startRenderLoop()
      captureRef.current = cap

      // Handle resize
      const handleResize = () => cap.resize()
      window.addEventListener('resize', handleResize)

      // Only listen for screenshot requests AFTER the render loop is running.
      // This guarantees CfxTexture has frames to capture.
      const unsubscribe = on<ScreenshotRequest>('screenshot:request', async (req) => {
        const dataUri = await cap.capture(
          req.maxResolution ?? 1280,
          req.quality ?? 0.8,
        )
        await callLua('screenshotResult', {
          correlationId: req.correlationId,
          data: dataUri ?? 'ERROR',
        })
      })

      cleanupRef.current = () => {
        window.removeEventListener('resize', handleResize)
        unsubscribe()
        cap.destroy()
      }
    })()

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
      captureRef.current = null
    }
  }, [])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
