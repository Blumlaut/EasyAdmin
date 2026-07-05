/**
 * Three.js game-frame renderer for stream capture.
 *
 * Creates a hidden canvas, renders FiveM's CfxTexture onto it via Three.js,
 * and returns a MediaStream via canvas.captureStream().
 *
 * CfxTexture is a Three.js Texture subclass from @citizenfx/three. It must be
 * used inside a Three.js render pipeline — setting `needsUpdate = true` before
 * each `renderer.render()` causes Three.js to re-upload the latest game frame.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsObject = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsGlobal = any

export interface FrameRenderer {
  /** The canvas element (CSS-hidden, scaled resolution). */
  canvas: HTMLCanvasElement
  /** The MediaStream from canvas.captureStream(). */
  stream: MediaStream
  /** Stop the render loop and release resources. */
  destroy(): void
}

const CFX_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const CFX_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  void main() {
    gl_FragColor = texture2D(tDiffuse, vUv);
  }
`

/**
 * Create a Three.js-based renderer that captures the game frame as a MediaStream.
 *
 * @param fps  Target capture frame rate.
 * @returns  FrameRenderer with canvas, stream, and destroy method, or null on failure.
 */
export function createFrameRenderer(fps: number): FrameRenderer | null {
  const three = (window as any).THREE as ThreeJsGlobal | undefined
  const CfxTexture = (window as any).CfxTexture as new () => ThreeJsObject | undefined

  if (!three || !CfxTexture) return null
  if (typeof RTCPeerConnection !== 'function') return null

  const {
    OrthographicCamera,
    Scene,
    ShaderMaterial,
    PlaneBufferGeometry,
    Mesh,
    WebGLRenderer,
  } = three

  // Create a hidden canvas at a reasonable resolution.
  // Use the smaller dimension to keep GPU/CPU usage manageable.
  const srcW = window.innerWidth
  const srcH = window.innerHeight
  const canvas = document.createElement('canvas')
  const longer = Math.max(srcW, srcH)
  const maxResolution = 640
  const scale = longer > maxResolution ? maxResolution / longer : 1
  const w = Math.max(2, Math.round(srcW * scale))
  const h = Math.max(2, Math.round(srcH * scale))
  canvas.width = w
  canvas.height = h
  canvas.className = 'ea-screenshot-canvas'
  document.body.appendChild(canvas)

  // Set up Three.js renderer
  const renderer = new WebGLRenderer({ canvas, alpha: false })
  renderer.setPixelRatio(1)
  renderer.setSize(w, h)
  renderer.autoClear = false

  // Set up scene + camera (full-screen quad)
  const camera = new OrthographicCamera(w / -2, w / 2, h / 2, h / -2, -10000, 10000)
  camera.position.z = 100

  const scene = new Scene()

  // Create CfxTexture — this is the game render target
  const gameTexture = new CfxTexture()
  if (!gameTexture) {
    document.body.removeChild(canvas)
    return null
  }
  gameTexture.needsUpdate = true

  const material = new ShaderMaterial({
    uniforms: { tDiffuse: { value: gameTexture } },
    vertexShader: CFX_VERTEX_SHADER,
    fragmentShader: CFX_FRAGMENT_SHADER,
  })

  const plane = new PlaneBufferGeometry(w, h)
  const quad = new Mesh(plane, material)
  quad.position.z = -100
  scene.add(quad)

  // Capture the canvas as a MediaStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captureStream = (canvas as any).captureStream ?? (canvas as any).mozCaptureStream
  if (!captureStream) {
    document.body.removeChild(canvas)
    return null
  }

  const stream = captureStream.call(canvas, fps) as MediaStream
  if (!stream) {
    document.body.removeChild(canvas)
    return null
  }

  // Start the render loop
  let animId = 0
  let lastFrameTime = 0
  const interval = 1000 / fps
  let running = true

  const tick = (now: number) => {
    if (!running) return

    if (now - lastFrameTime >= interval) {
      lastFrameTime = now
      // Re-pull the latest game frame into the texture and render it.
      gameTexture.needsUpdate = true
      renderer.clear()
      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(tick)
  }

  animId = requestAnimationFrame(tick)

  return {
    canvas,
    stream,
    destroy: () => {
      running = false
      cancelAnimationFrame(animId)
      renderer.dispose()
      material.dispose()
      plane.dispose()
      document.body.removeChild(canvas)
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}
