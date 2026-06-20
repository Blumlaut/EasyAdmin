/**
 * ScreenshotCapture — hidden canvas that captures game frames via Three.js + CfxTexture.
 *
 * Renders a 1x1 hidden canvas inside the visible DOM tree (required for OSR).
 * Runs a continuous render loop to keep the WebGL context and CfxTexture warm
 * (mirrors screenshot-basic's requestAnimationFrame pattern).
 * Listens for `screenshot:request` messages from Lua and responds via NUICallback.
 */

/* eslint-disable no-console */
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as unknown as any
    console.log('[EA-Screenshot] Initializing capture context, THREE=' + (win.THREE ? 'available' : 'MISSING') + ', CfxTexture=' + (win.CfxTexture ? 'available' : 'MISSING'))

    const cap = createCapture(canvas)
    if (!cap) {
      // Three.js / CfxTexture not available (browser dev mode)
      console.warn('[EA-Screenshot] createCapture returned null (Three.js/CfxTexture unavailable)')
      return
    }

    captureRef.current = cap
    cap.startRenderLoop()
    console.log('[EA-Screenshot] Capture context initialized, render loop started')

    // Handle resize
    const handleResize = () => cap.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      console.log('[EA-Screenshot] Cleanup: destroying capture context')
      cap.destroy()
      captureRef.current = null
    }
  }, [])

  // Listen for screenshot requests from Lua (no dependencies — fires once on mount)
  useEffect(() => {
    console.log('[EA-Screenshot] Message listener registered')
    return on<ScreenshotRequest>('screenshot:request', async (req) => {
      console.log('[EA-Screenshot] Request received from Lua, correlationId=' + req.correlationId + ', maxResolution=' + (req.maxResolution ?? 1280) + ', quality=' + (req.quality ?? 0.8))

      const capture = captureRef.current
      if (!capture) {
        console.error('[EA-Screenshot] captureRef is null, cannot capture')
        await callLua('screenshotResult', {
          correlationId: req.correlationId,
          data: 'ERROR',
        })
        return
      }

      console.log('[EA-Screenshot] Starting capture...')
      const startTime = performance.now()
      const dataUri = await capture.capture(
        req.maxResolution ?? 1280,
        req.quality ?? 0.8,
      )
      const elapsed = Math.round(performance.now() - startTime)

      if (dataUri) {
        console.log('[EA-Screenshot] Capture completed in ' + elapsed + 'ms, dataUri length=' + dataUri.length)
      } else {
        console.error('[EA-Screenshot] Capture returned null after ' + elapsed + 'ms')
      }

      // Send result back to Lua via NUICallback
      console.log('[EA-Screenshot] Calling callLua screenshotResult')
      await callLua('screenshotResult', {
        correlationId: req.correlationId,
        data: dataUri ?? 'ERROR',
      })
      console.log('[EA-Screenshot] callLua screenshotResult complete')
    })
  }, [])

  // 1x1 hidden canvas — must be in the visible tree for OSR rendering
  return <canvas ref={canvasRef} className="ea-screenshot-canvas" width={1} height={1} />
}
