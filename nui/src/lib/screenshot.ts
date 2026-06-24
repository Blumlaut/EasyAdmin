/* eslint-disable no-console */
/**
 * Screenshot capture module.
 *
 * Uses Three.js (loaded via CDN) + FiveM's CfxTexture to capture the game
 * render target.  The canvas lives inside the visible DOM tree (required for
 * OSR rendering) but is hidden via CSS.
 *
 * Public API:
 *   - initialize(canvas: HTMLCanvasElement): ScreenshotCapture | null
 *   - capture(opts?): Promise<string | null>
 *   - destroy(): void
 */

// ---------------------------------------------------------------------------
// Capture class
// ---------------------------------------------------------------------------

// Three.js objects are dynamically typed (loaded from CDN at runtime)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsObject = any

// Type for the Three.js global (all exports we use)
interface ThreeJsGlobal {
  OrthographicCamera: ThreeJsObject
  Scene: ThreeJsObject
  WebGLRenderTarget: ThreeJsObject
  LinearFilter: number
  NearestFilter: number
  RGBAFormat: number
  UnsignedByteType: number
  ShaderMaterial: ThreeJsObject
  PlaneBufferGeometry: ThreeJsObject
  Mesh: ThreeJsObject
  WebGLRenderer: ThreeJsObject
}

export class ScreenshotCaptureCtx {
  private renderer: ThreeJsObject | null = null
  private scene: ThreeJsObject | null = null
  private camera: ThreeJsObject | null = null
  private rtTexture: ThreeJsObject | null = null
  private canvas: HTMLCanvasElement
  private destroyed = false

  // Continuous render loop — keeps WebGL context and CfxTexture warm.
  // Mirrors screenshot-basic's requestAnimationFrame loop.
  private rafId = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Start the continuous render loop.
   * Keeps the CfxTexture current so on-demand captures always get a fresh frame.
   */
  startRenderLoop(): void {
    if (this.destroyed || !this.renderer || !this.scene || !this.camera || !this.rtTexture) {
      console.warn('[EA-Screenshot] startRenderLoop: prerequisites not met')
      return
    }
    const tick = () => {
      if (this.destroyed || !this.renderer || !this.scene || !this.camera || !this.rtTexture) return
      this.renderer.clear()
      this.renderer.render(this.scene, this.camera, this.rtTexture, true)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  /** Stop the continuous render loop. */
  stopRenderLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  /**
   * Initialize the WebGL pipeline.
   * Returns false if Three.js / CfxTexture are not available (e.g. browser dev).
   */
  init(): boolean {
    if (!window.THREE || !window.CfxTexture) {
      return false
    }

    const three = window.THREE as unknown as ThreeJsGlobal
    const {
      OrthographicCamera,
      Scene,
      WebGLRenderTarget,
      LinearFilter,
      NearestFilter,
      RGBAFormat,
      UnsignedByteType,
      ShaderMaterial,
      PlaneBufferGeometry,
      Mesh,
      WebGLRenderer,
    } = three

    const width = window.innerWidth
    const height = window.innerHeight

    const camera = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      -10000,
      10000,
    )
    camera.position.z = 100

    const scene = new Scene()

    const gameTexture = new window.CfxTexture()
    if (!gameTexture) return false
    gameTexture.needsUpdate = true

    const material = new ShaderMaterial({
      uniforms: { tDiffuse: { value: gameTexture } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = vec2(uv.x, 1.0 - uv.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `,
    })

    const plane = new PlaneBufferGeometry(width, height)
    const quad = new Mesh(plane, material)
    quad.position.z = -100
    scene.add(quad)

    const renderer = new WebGLRenderer({ canvas: this.canvas, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.autoClear = false

    this.rtTexture = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
    })

    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    return true
  }

  /**
   * Resize the internal buffers to match the current window size.
   * Restarts the render loop with updated dimensions.
   */
  resize(): void {
    if (!this.renderer || !this.scene) return
    if (!window.THREE) return

    const three = window.THREE as unknown as ThreeJsGlobal
    const {
      OrthographicCamera,
      Scene,
      PlaneBufferGeometry,
      Mesh,
      WebGLRenderTarget,
      LinearFilter,
      NearestFilter,
      RGBAFormat,
      UnsignedByteType,
    } = three

    const width = window.innerWidth
    const height = window.innerHeight

    const camera = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      -10000,
      10000,
    )
    camera.position.z = 100
    this.camera = camera

    const plane = new PlaneBufferGeometry(width, height)
    const quad = new Mesh(plane, this.scene.children[0]?.material || {})
    quad.position.z = -100

    const scene = new Scene()
    scene.add(quad)
    this.scene = scene

    this.rtTexture = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
    })

    this.renderer.setSize(width, height)

    // Restart render loop with new dimensions
    this.stopRenderLoop()
    this.startRenderLoop()
  }

  /**
   * Capture a single frame and return a data URI.
   *
   * The render loop keeps the RTT current — this method only reads pixels
   * and encodes them. A 10-second timeout guards against hanging operations.
   *
   * @param maxResolution  Max length of the longer dimension (default 1280).
   *                       The shorter dimension is scaled to preserve aspect ratio.
   * @param quality        Encoding quality 0-1 (default 0.8).
   */
  async capture(maxResolution = 1280, quality = 0.8): Promise<string | null> {
    if (!this.renderer || !this.rtTexture || this.destroyed) return null

    // Guard against hanging operations (createImageBitmap / toDataURL)
    const timeoutPromise = new Promise<string | null>((_, reject) =>
      setTimeout(() => reject(new Error('Screenshot capture timed out')), 10000),
    )

    const capturePromise = (async () => {
      console.log('[EA-Screenshot] capture: starting pixel read')
      const srcWidth = window.innerWidth
      const srcHeight = window.innerHeight

      // Read raw pixels from the render target (rendered by the continuous loop)
      const pixelCount = srcWidth * srcHeight * 4
      const read = new Uint8Array(pixelCount)
      const renderer = this.renderer
      const rt = this.rtTexture
      if (!renderer || !rt) {
        console.error('[EA-Screenshot] capture: renderer or rtTexture is null')
        return null
      }
      console.log('[EA-Screenshot] capture: readRenderTargetPixels (' + srcWidth + 'x' + srcHeight + ')')
      renderer.readRenderTargetPixels(rt, 0, 0, srcWidth, srcHeight, read)
      console.log('[EA-Screenshot] capture: pixel read complete, nonZeroBytes=' + read.reduce((a, b) => a + (b !== 0 ? 1 : 0), 0) + '/' + pixelCount)

      // Cap the longer dimension, scale the shorter to preserve aspect ratio.
      const longer = Math.max(srcWidth, srcHeight)
      const scale = longer > maxResolution ? maxResolution / longer : 1

      const dstWidth = Math.round(srcWidth * scale)
      const dstHeight = Math.round(srcHeight * scale)

      // Draw to an offscreen canvas at the target resolution
      const offscreen = document.createElement('canvas')
      offscreen.width = dstWidth
      offscreen.height = dstHeight

      const ctx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null

      const imageData = new ImageData(
        new Uint8ClampedArray(read.buffer),
        srcWidth,
        srcHeight,
      )

      console.log('[EA-Screenshot] capture: createImageBitmap')
      const bitmap = await createImageBitmap(imageData)
      console.log('[EA-Screenshot] capture: drawImage (scale ' + srcWidth + 'x' + srcHeight + ' -> ' + dstWidth + 'x' + dstHeight + ')')
      ctx.drawImage(bitmap, 0, 0, dstWidth, dstHeight)
      bitmap.close()

      console.log('[EA-Screenshot] capture: toDataURL webp')
      const dataUrl = offscreen.toDataURL('image/webp', quality)
      console.log('[EA-Screenshot] capture: toDataURL complete, length=' + dataUrl.length)
      return dataUrl
    })()

    return Promise.race([capturePromise, timeoutPromise]).catch(() => null)
  }

  destroy(): void {
    this.destroyed = true
    this.stopRenderLoop()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    if (this.rtTexture) {
      this.rtTexture.dispose()
      this.rtTexture = null
    }
  }
}

/**
 * Factory — creates and initializes a capture instance.
 * Returns null if Three.js / CfxTexture are not available.
 */
export function createCapture(canvas: HTMLCanvasElement): ScreenshotCaptureCtx | null {
  const cap = new ScreenshotCaptureCtx(canvas)
  if (!cap.init()) return null
  return cap
}
