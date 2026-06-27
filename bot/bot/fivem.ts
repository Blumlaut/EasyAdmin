// Adapter for FiveM globals so they work with bundlers and TypeScript.
// Import from this module instead of accessing globals directly.

/** FiveM exports proxy — use this instead of bare `exports` or `globalThis.exports` */
export const fivemExports: typeof exports = exports as unknown as typeof exports
