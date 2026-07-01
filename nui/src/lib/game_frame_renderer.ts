/**
 * Raw WebGL game-frame renderer for stream capture.
 *
 * Creates a hidden canvas at viewport resolution, hooks FiveM's CfxTexture,
 * and returns a MediaStream via canvas.captureStream(). No Three.js dependency.
 */

// CfxTexture is injected by FiveM into the NUI CEF context.
// Accessed via (window as any).CfxTexture below — no need for a global declare.

interface ShaderInfo {
  program: WebGLProgram
  attribPosition: number
  attribTexCoord: number
  uniformTexture: WebGLUniformLocation | null
}

/**
 * Compile a full-screen quad shader program.
 */
function compileQuadProgram(gl: WebGLRenderingContext): ShaderInfo | null {
  const vsSource = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `

  const fsSource = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D uTexture;
    void main() {
      gl_FragColor = texture2D(uTexture, vTexCoord);
    }
  `

  const compileShader = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vs = compileShader(gl.VERTEX_SHADER, vsSource)
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource)
  if (!vs || !fs) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return {
    program,
    attribPosition: gl.getAttribLocation(program, 'aPosition'),
    attribTexCoord: gl.getAttribLocation(program, 'aTexCoord'),
    uniformTexture: gl.getUniformLocation(program, 'uTexture'),
  }
}

/**
 * Hook the FiveM game texture using the CfxTexture class.
 *
 * The texture hook sequence (texImage2D placeholder + wrap-mode toggle)
 * ensures the external texture is properly bound for rendering.
 */
function hookGameTexture(gl: WebGLRenderingContext): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) throw new Error('Failed to create WebGL texture')
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Upload a 1x1 blue pixel as placeholder
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]))

  // The wrap-mode toggle sequence is required for CfxTexture to bind the
  // game render target correctly in FiveM's CEF.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  return texture
}

/**
 * Set up vertex buffers for a full-screen quad (two triangles in NDC).
 */
interface QuadBuffers {
  positionBuffer: WebGLBuffer
  texCoordBuffer: WebGLBuffer
}

function setupQuadBuffers(gl: WebGLRenderingContext): QuadBuffers {
  // Two triangles covering NDC (-1 to +1)
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ])

  // Texture coordinates (flip Y to match game texture orientation)
  const texCoords = new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    1, 0,
  ])

  const positionBuffer = gl.createBuffer()
  if (!positionBuffer) throw new Error('Failed to create position buffer')
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const texCoordBuffer = gl.createBuffer()
  if (!texCoordBuffer) throw new Error('Failed to create texCoord buffer')
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)

  return { positionBuffer, texCoordBuffer }
}

export interface FrameRenderer {
  /** The canvas element (CSS-hidden, full viewport resolution). */
  canvas: HTMLCanvasElement
  /** The MediaStream from canvas.captureStream(). */
  stream: MediaStream
  /** Stop the render loop and release resources. */
  destroy(): void
}

/**
 * Create a raw WebGL renderer that captures the game frame as a MediaStream.
 *
 * @param fps  Target capture frame rate.
 * @returns  FrameRenderer with canvas, stream, and destroy method, or null on failure.
 */
export function createFrameRenderer(fps: number): FrameRenderer | null {
  // Check prerequisites
  if (typeof RTCPeerConnection !== 'function') return null

  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.className = 'ea-screenshot-canvas'
  document.body.appendChild(canvas)

  const gl = canvas.getContext('webgl', {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    desynchronized: true as any,
  }) as WebGLRenderingContext | null
  if (!gl) {
    document.body.removeChild(canvas)
    return null
  }
  // Explicit assertion: after null check, gl is WebGLRenderingContext
  const glCtx: WebGLRenderingContext = gl

  const shader = compileQuadProgram(glCtx)
  if (!shader) {
    document.body.removeChild(canvas)
    return null
  }

  const texture = hookGameTexture(glCtx)
  const buffers = setupQuadBuffers(glCtx)

  // Create CfxTexture and bind it to our WebGL texture
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfxTexture = (window as any).CfxTexture
  if (!cfxTexture) {
    glCtx.deleteTexture(texture)
    document.body.removeChild(canvas)
    return null
  }

  // Start the render loop
  let animId = 0
  const interval = 1000 / fps
  let lastFrameTime = 0

  const tick = (now: number) => {
    if (now - lastFrameTime >= interval) {
      lastFrameTime = now

      glCtx.useProgram(shader.program)

      // Bind position attribute
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffers.positionBuffer)
      glCtx.enableVertexAttribArray(shader.attribPosition)
      glCtx.vertexAttribPointer(shader.attribPosition, 2, glCtx.FLOAT, false, 0, 0)

      // Bind texture coordinate attribute
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffers.texCoordBuffer)
      glCtx.enableVertexAttribArray(shader.attribTexCoord)
      glCtx.vertexAttribPointer(shader.attribTexCoord, 2, glCtx.FLOAT, false, 0, 0)

      // Bind the game texture
      glCtx.activeTexture(glCtx.TEXTURE0)
      glCtx.bindTexture(glCtx.TEXTURE_2D, texture)
      if (shader.uniformTexture) {
        glCtx.uniform1i(shader.uniformTexture, 0)
      }

      // Update CfxTexture to pull the latest game frame
      if (cfxTexture.update) {
        cfxTexture.update()
      }

      // Draw the full-screen quad
      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4)
      glCtx.finish()
    }
    animId = requestAnimationFrame(tick)
  }

  animId = requestAnimationFrame(tick)

  // Capture the canvas as a MediaStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captureStream = (canvas as any).captureStream ?? (canvas as any).mozCaptureStream
  if (!captureStream) {
    cancelAnimationFrame(animId)
    cleanup(glCtx, shader, texture, buffers)
    document.body.removeChild(canvas)
    return null
  }

  const stream = captureStream.call(canvas, fps) as MediaStream
  if (!stream) {
    cancelAnimationFrame(animId)
    cleanup(glCtx, shader, texture, buffers)
    document.body.removeChild(canvas)
    return null
  }

  return {
    canvas,
    stream,
    destroy: () => {
      cancelAnimationFrame(animId)
      // Lose the WebGL context to release GPU resources
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ext = glCtx.getExtension('WEBGL_lose_context') as any
      if (ext) ext.loseContext()
      cleanup(glCtx, shader, texture, buffers)
      document.body.removeChild(canvas)
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}

/** Clean up WebGL resources. */
function cleanup(
  gl: WebGLRenderingContext,
  shader: ShaderInfo,
  texture: WebGLTexture,
  buffers: QuadBuffers,
): void {
  gl.deleteTexture(texture)
  gl.deleteBuffer(buffers.positionBuffer)
  gl.deleteBuffer(buffers.texCoordBuffer)
  gl.deleteProgram(shader.program)
}
