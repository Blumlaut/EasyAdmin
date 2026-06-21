/* eslint-disable */
/**
 * Type declarations for Three.js + CfxTexture globals.
 *
 * Three.js (0.184.0) is loaded as an ES module from esm.sh and exposed
 * as `window.THREE` via a <script type="module"> block in index.html.
 *
 * CfxTexture is a FiveM-specific class injected into the NUI CEF context.
 * It is available as `window.CfxTexture` only when running inside FiveM.
 *
 * These are ambient type declarations — no runtime code is generated.
 * `any` types are used because we cannot import the full `three` package
 * (it's loaded at runtime via CDN in FiveM only).
 */

interface CfxTextureConstructor {
  new (): {
    needsUpdate: boolean
    width?: number
    height?: number
  }
}

declare global {
  var THREE: Record<string, unknown>
  var CfxTexture: CfxTextureConstructor | undefined
}

// Re-exported for convenience (not used at runtime)
export interface CfxTexture {
  needsUpdate: boolean
  width?: number
  height?: number
}

export interface OrthographicCamera {
  new (left: number, right: number, top: number, bottom: number, near: number, far: number): {
    position: { z: number }
  }
}

export interface Scene {
  new (): {
    add(obj: any): void
    children: any[]
  }
}

export interface WebGLRenderTarget {
  new (
    width: number,
    height: number,
    opts: {
      minFilter: number
      magFilter: number
      format: number
      type: number
    },
  ): {
    dispose(): void
  }
}

export interface ShaderMaterial {
  new (opts: {
    uniforms: Record<string, { value: any }>
    vertexShader: string
    fragmentShader: string
  }): any
}

export interface PlaneBufferGeometry {
  new (width: number, height: number): any
}

export interface Mesh {
  new (geometry: any, material: any): {
    position: { z: number }
    material: any
  }
}

export interface WebGLRenderer {
  new (opts: { canvas: HTMLCanvasElement; alpha: boolean }): {
    setPixelRatio(ratio: number): void
    setSize(width: number, height: number): void
    autoClear: boolean
    clear(): void
    render(scene: any, camera: any, target: any, clear: boolean): void
    readRenderTargetPixels(
      target: any,
      x: number,
      y: number,
      width: number,
      height: number,
      buffer: Uint8Array,
    ): void
    dispose(): void
  }
}

export const LinearFilter: number
export const NearestFilter: number
export const RGBAFormat: number
export const UnsignedByteType: number

export {}
