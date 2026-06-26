// Type declaration for @citizenfx/three (FiveM fork of Three.js r100 with CfxTexture)
// This package does not ship with TypeScript declarations.

declare module '@citizenfx/three' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ThreeJsObject = any

  // CfxTexture — FiveM-specific texture that captures the game render target
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const CfxTexture: any

  // Re-export commonly used Three.js constructors (screenshot/stream capture needs these)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const OrthographicCamera: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Scene: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const WebGLRenderTarget: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ShaderMaterial: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const PlaneBufferGeometry: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Mesh: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const WebGLRenderer: any

  // Filter/format constants
  export const LinearFilter: number
  export const NearestFilter: number
  export const RGBAFormat: number
  export const UnsignedByteType: number

  // Default export is the THREE namespace object (mirrors the global THREE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const THREE: any
  export default THREE
}
