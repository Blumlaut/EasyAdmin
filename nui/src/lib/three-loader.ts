/**
 * Lazy loader for @citizenfx/three (Three.js).
 *
 * Three.js is a large dependency (~500-700 KB minified) that is only needed
 * for screenshot capture and live stream features. This module dynamically
 * imports it on demand and exposes it as `window.THREE` / `window.CfxTexture`
 * so the existing screenshot.ts and stream_webrtc.ts code works unchanged.
 *
 * Usage:
 *   const ready = await loadThree()
 *   // window.THREE and window.CfxTexture are now available
 */

let promise: Promise<boolean> | null = null

/**
 * Load Three.js dynamically and expose it as a global.
 * Subsequent calls return the same cached promise.
 *
 * @returns true if Three.js was loaded successfully, false if already loaded
 *   or if the import failed (e.g. browser dev mode without the package).
 */
export async function loadThree(): Promise<boolean> {
  // Already loaded — nothing to do
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).THREE) return false

  // Already loading — wait for the in-flight import
  if (promise) return promise

  promise = (async () => {
    try {
      const CfxThree = await import('@citizenfx/three')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).THREE = CfxThree
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).CfxTexture = CfxThree.CfxTexture
      return true
    } catch {
      // Browser dev mode or import failure — Three.js simply won't be available.
      // Screenshot/stream features will gracefully degrade (return null).
      return false
    }
  })()

  return promise
}
