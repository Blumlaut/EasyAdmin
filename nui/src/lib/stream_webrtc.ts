/**
 * WebRTC-based live stream transport.
 *
 * Replaces the per-frame latent-event pipeline. Video frames flow peer-to-peer
 * over WebRTC (SRTP/DTLS) directly from the target player's NUI to the admin's
 * NUI — they never touch the FiveM network channel or the server's CPU. The
 * server only relays the initial SDP/ICE signaling (a handful of tiny JSON
 * messages). See `server/stream_signaling.lua`.
 *
 * Roles:
 *   - StreamPublisher  (target side) — renders CfxTexture to a canvas, captures
 *     it via `canvas.captureStream()`, and negotiates one RTCPeerConnection per
 *     viewer, sending a video track to each.
 *   - StreamSubscriber (viewer side) — receives an offer from a publisher,
 *     answers, and exposes the incoming MediaStream to attach to a <video>.
 *
 * Signaling is non-trickle: each side waits for ICE gathering to complete and
 * sends a single SDP containing all candidates. Simpler and robust; costs a
 * little connection-setup latency. Trickle ICE is a future optimization.
 */

import { callLua } from '../fivem'

// Three.js objects are dynamically typed (loaded at runtime, see screenshot-three.d.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsObject = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeJsGlobal = any

export interface SignalPayload {
  type: 'offer' | 'answer'
  sdp: string
}

export interface StreamPublisherOptions {
  /** Max longer-dimension resolution (px) of the captured canvas. */
  maxResolution: number
  /** Target capture FPS (drives the render loop + captureStream rate). */
  targetFps: number
  /** ICE STUN/TURN server URLs (e.g. 'stun:stun.l.google.com:19302'). */
  stunServers: string[]
}

/** Parse a comma-separated STUN server convar string into URLs. */
export function parseStunServers(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function rtcConfig(stunServers: string[]): RTCConfiguration {
  const iceServers: RTCIceServer[] = stunServers.map((urls) => ({ urls }))
  return { iceServers }
}

/**
 * Resolve once ICE gathering reaches 'complete', or after a safety timeout.
 * Non-trickle signaling relies on the local SDP containing all candidates.
 */
function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 3000): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      pc.removeEventListener('icegatheringstatechange', check)
      resolve()
    }
    const check = () => {
      if (pc.iceGatheringState === 'complete') finish()
    }
    pc.addEventListener('icegatheringstatechange', check)
    // STUN over a flaky link can stall; don't block the connection forever.
    setTimeout(finish, timeoutMs)
  })
}

const CFX_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x, 1.0 - uv.y);
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
 * StreamPublisher — runs on the player being streamed.
 *
 * Renders the game render target (CfxTexture) to a canvas via Three.js, samples
 * it into a MediaStream with `canvas.captureStream()`, and publishes the video
 * track to each viewer over its own RTCPeerConnection.
 */
export class StreamPublisher {
  private canvas: HTMLCanvasElement
  private opts: StreamPublisherOptions
  private renderer: ThreeJsObject | null = null
  private scene: ThreeJsObject | null = null
  private camera: ThreeJsObject | null = null
  private gameTexture: ThreeJsObject | null = null
  private stream: MediaStream | null = null
  private rafId = 0
  private running = false
  private lastFrameTime = 0
  private destroyed = false
  /** viewerSrc -> RTCPeerConnection */
  private peers = new Map<number, RTCPeerConnection>()

  constructor(canvas: HTMLCanvasElement, opts: StreamPublisherOptions) {
    this.canvas = canvas
    this.opts = opts
  }

  /**
   * Build the WebGL pipeline (Three.js + CfxTexture) and start the canvas
   * MediaStream. Returns false if Three.js / CfxTexture are unavailable
   * (e.g. browser dev mode) or if captureStream is not supported by this CEF.
   */
  init(): boolean {
    // WebRTC + canvas.captureStream must both be present. Some FiveM CEF
    // builds strip WebRTC; bail cleanly so the viewer sees "failed to start"
    // instead of a thrown exception.
    if (typeof RTCPeerConnection !== 'function') return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (this.canvas as any).captureStream !== 'function') return false
    if (!window.THREE || !window.CfxTexture) return false

    const three = window.THREE as ThreeJsGlobal
    const { OrthographicCamera, Scene, ShaderMaterial, PlaneBufferGeometry, Mesh, WebGLRenderer } =
      three

    // Cap the longer dimension, scale the shorter to preserve aspect ratio.
    const srcW = window.innerWidth
    const srcH = window.innerHeight
    const longer = Math.max(srcW, srcH)
    const scale = longer > this.opts.maxResolution ? this.opts.maxResolution / longer : 1
    const w = Math.max(2, Math.round(srcW * scale))
    const h = Math.max(2, Math.round(srcH * scale))

    const camera = new OrthographicCamera(w / -2, w / 2, h / 2, h / -2, -10000, 10000)
    camera.position.z = 100

    const scene = new Scene()

    const gameTexture = new window.CfxTexture()
    if (!gameTexture) return false
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

    const renderer = new WebGLRenderer({ canvas: this.canvas, alpha: false })
    // pixelRatio 1 — captureStream samples the drawingbuffer, which setSize
    // already scales to our capped resolution. No need for HiDPI inflation.
    renderer.setPixelRatio(1)
    renderer.setSize(w, h)
    renderer.autoClear = false

    // Sample the canvas into a MediaStream at the target FPS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.stream = (this.canvas as any).captureStream(this.opts.targetFps) as MediaStream
    if (!this.stream) return false

    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.gameTexture = gameTexture

    return true
  }

  /** Start the render loop that keeps the CfxTexture fresh on the canvas. */
  start(): void {
    if (this.destroyed || !this.renderer || this.running) return
    this.running = true
    this.lastFrameTime = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = (): void => {
    if (!this.running || !this.renderer || !this.scene || !this.camera || !this.gameTexture) return

    const now = performance.now()
    const interval = 1000 / this.opts.targetFps
    if (now - this.lastFrameTime >= interval) {
      this.lastFrameTime = now
      // Re-pull the latest game frame into the texture and render it.
      this.gameTexture.needsUpdate = true
      this.renderer.clear()
      this.renderer.render(this.scene, this.camera)
    }
    this.rafId = requestAnimationFrame(this.tick)
  }

  /**
   * Create a PeerConnection for a new viewer and send them an offer.
   * Idempotent per viewerSrc.
   */
  async addViewer(viewerSrc: number): Promise<void> {
    if (this.peers.has(viewerSrc)) return
    if (!this.stream) return

    const pc = new RTCPeerConnection(rtcConfig(this.opts.stunServers))
    this.peers.set(viewerSrc, pc)

    pc.onconnectionstatechange = () => {
      // Clean up dead peers; the server tracks viewer membership separately,
      // so a transient failure here just ends that viewer's connection.
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(viewerSrc)
      }
    }

    for (const track of this.stream.getTracks()) {
      pc.addTrack(track, this.stream)
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitForIceGathering(pc)

    this.sendSignal(viewerSrc, {
      type: 'offer',
      sdp: pc.localDescription?.sdp ?? offer.sdp ?? '',
    })
  }

  /** Handle an inbound signal (an answer from a viewer). */
  async handleSignal(from: number, payload: SignalPayload): Promise<void> {
    // For the publisher, the only expected inbound payload is an answer.
    // `from` is the viewer's server ID — peers are keyed by it, so we look up
    // the correct PeerConnection directly (no ambiguous matching when several
    // viewers' answers are in flight at once).
    if (payload.type !== 'answer') return

    const pc = this.peers.get(from)
    if (!pc) return
    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }),
      )
    } catch {
      // Stale / duplicate answer — ignore.
    }
  }

  /** Tear down the PeerConnection for a viewer who stopped watching. */
  removeViewer(viewerSrc: number): void {
    const pc = this.peers.get(viewerSrc)
    if (pc) {
      pc.close()
      this.peers.delete(viewerSrc)
    }
  }

  private sendSignal(to: number, payload: SignalPayload): void {
    callLua('streamSignal', { to, payload }).catch(() => {})
  }

  /** Stop all connections and the render loop, keeping the pipeline built. */
  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    for (const pc of this.peers.values()) pc.close()
    this.peers.clear()
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop()
      this.stream = null
    }
  }

  /** Full teardown — stop and release WebGL resources. */
  destroy(): void {
    this.stop()
    this.destroyed = true
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    this.scene = null
    this.camera = null
    this.gameTexture = null
  }
}

/**
 * StreamSubscriber — runs on the admin viewing a stream.
 *
 * Receives the publisher's offer, answers, and exposes the incoming
 * MediaStream via `onStream` so the UI can attach it to a <video> element.
 */
export class StreamSubscriber {
  private stunServers: string[]
  private pc: RTCPeerConnection | null = null
  /** Fired with the remote video stream once the track arrives. */
  onStream: ((stream: MediaStream) => void) | null = null
  /** Fired when the connection ends (closed/failed). */
  onClose: (() => void) | null = null

  constructor(stunServers: string[]) {
    this.stunServers = stunServers
  }

  /** Handle an inbound offer from the publisher; creates + answers a PC. */
  async handleSignal(from: number, payload: SignalPayload): Promise<void> {
    if (payload.type !== 'offer') return

    // A new offer means a fresh publisher session — drop any old PC.
    this.close()

    const pc = new RTCPeerConnection(rtcConfig(this.stunServers))
    this.pc = pc

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream && this.onStream) this.onStream(stream)
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.onClose?.()
      }
    }

    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }),
      )
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await waitForIceGathering(pc)
      this.sendSignal(from, {
        type: 'answer',
        sdp: pc.localDescription?.sdp ?? answer.sdp ?? '',
      })
    } catch {
      this.close()
    }
  }

  close(): void {
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
  }

  private sendSignal(to: number, payload: SignalPayload): void {
    callLua('streamSignal', { to, payload }).catch(() => {})
  }
}
