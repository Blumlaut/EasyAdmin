/**
 * StreamEncoder — continuous frame capture for live streaming.
 *
 * Uses Three.js (loaded via CDN) + FiveM's CfxTexture to capture the game
 * render target in a loop. Each frame is encoded to WebP and sent to Lua.
 *
 * Public API:
 *   - initialize(canvas: HTMLCanvasElement): StreamEncoder | null
 *   - start(opts): void
 *   - stop(): void
 *   - destroy(): void
 */

// Three.js objects are dynamically typed (loaded from CDN at runtime)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsObject = any

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

interface StreamOptions {
  maxResolution: number
  quality: number
  targetFps: number
}

export class StreamEncoder {
  private renderer: ThreeJsObject | null = null
  private scene: ThreeJsObject | null = null
  private camera: ThreeJsObject | null = null
  private rtTexture: ThreeJsObject | null = null
  private canvas: HTMLCanvasElement
  private destroyed = false

  // Streaming state
  private running = false
  private rafId = 0
  private lastFrameTime = 0
  private opts: StreamOptions | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  /**
   * Initialize the WebGL pipeline.
   * Returns false if Three.js / CfxTexture are not available.
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
   * Start the continuous capture loop.
   */
  start(opts: StreamOptions): void {
    if (!this.renderer || this.destroyed) return
    this.opts = opts
    this.running = true
    this.lastFrameTime = performance.now()
    this.tick()
  }

  /**
   * Stop the capture loop.
   */
  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  /**
   * Single frame of the capture loop.
   */
  private tick = async (): Promise<void> => {
    if (!this.running || !this.opts || !this.renderer || !this.scene || !this.camera || !this.rtTexture) return

    const now = performance.now()
    const interval = 1000 / this.opts.targetFps

    // Frame rate gating — skip if not enough time has passed
    if (now - this.lastFrameTime < interval) {
      this.rafId = requestAnimationFrame(this.tick)
      return
    }
    this.lastFrameTime = now

    try {
      const frame = await this.captureFrame(this.opts.maxResolution, this.opts.quality)
      if (frame) {
        // Send to Lua (fire-and-forget, no await to avoid blocking the loop)
        import('../fivem').then(({ callLua }) => callLua('streamFrame', { frame }))
      }
    } catch {
      // Silently skip bad frames
    }

    this.rafId = requestAnimationFrame(this.tick)
  }

  /**
   * Capture a single frame and return a data URI.
   */
  private async captureFrame(maxResolution: number, quality: number): Promise<string | null> {
    if (!this.renderer || !this.rtTexture) return null

    const srcWidth = window.innerWidth
    const srcHeight = window.innerHeight

    // Render the game texture to the RTT target
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera, this.rtTexture, true)

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

    const bitmap = await createImageBitmap(imageData)
    ctx.drawImage(bitmap, 0, 0, dstWidth, dstHeight)
    bitmap.close()

    return offscreen.toDataURL('image/webp', quality)
  }

  destroy(): void {
    this.stop()
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
 * Factory — creates and initializes a stream encoder instance.
 * Returns null if Three.js / CfxTexture are not available.
 */
export function createStreamEncoder(canvas: HTMLCanvasElement): StreamEncoder | null {
  const enc = new StreamEncoder(canvas)
  if (!enc.init()) return null
  return enc
}
