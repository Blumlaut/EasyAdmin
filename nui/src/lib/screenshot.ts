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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
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
  }

  /**
   * Capture a single frame and return a data URI.
   *
   * @param maxResolution  Max length of the longer dimension (default 1280).
   *                       The shorter dimension is scaled to preserve aspect ratio.
   * @param quality        Encoding quality 0-1 (default 0.8).
   */
  async capture(maxResolution = 1280, quality = 0.8): Promise<string | null> {
    if (!this.renderer || this.destroyed) return null

    // Render the game texture to the RTT target
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera, this.rtTexture, true)

    const srcWidth = window.innerWidth
    const srcHeight = window.innerHeight

    // Cap the longer dimension, scale the shorter to preserve aspect ratio.
    const longer = Math.max(srcWidth, srcHeight)
    const scale = longer > maxResolution ? maxResolution / longer : 1

    const dstWidth = Math.round(srcWidth * scale)
    const dstHeight = Math.round(srcHeight * scale)

    // Read raw pixels from the render target
    const pixelCount = srcWidth * srcHeight * 4
    const read = new Uint8Array(pixelCount)
    this.renderer.readRenderTargetPixels(this.rtTexture, 0, 0, srcWidth, srcHeight, read)

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
    ctx.drawImage(offscreen, 0, 0) // clear
    // putImageData doesn't scale, so we use drawImage with the source as an ImageBitmap
    const bitmap = await createImageBitmap(imageData)
    ctx.drawImage(bitmap, 0, 0, dstWidth, dstHeight)
    bitmap.close()

    return offscreen.toDataURL('image/webp', quality)
  }

  destroy(): void {
    this.destroyed = true
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
