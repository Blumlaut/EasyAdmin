/**
 * GTA V world <-> Social Club map tile coordinate conversion.
 *
 * The map is a flat orthographic projection: a single affine transform maps
 * game-world coordinates (x east, y north) onto the tile server's z4 pixel
 * space (2048 x 3072 px, origin top-left, y south). The transform was fitted
 * against the actual tile server imagery (coastline ICP) and validated with
 * 31 independently-sourced landmark coordinates (residuals < 30 m).
 *
 * Tile server: https://s.rsg.sc/sc/images/games/GTAV/map/{style}/{z}/{x}/{y}.jpg
 * (Rockstar's Social Club tile CDN — no key, three styles: render, game, print).
 */

// ---- Fitted transform: world -> z4 pixel space ----
// px4 = KX * x + OX
// py4 = KY * y + OY   (KY negative: world y increases north, py increases south)
const KX = 0.2231727578362635
const KY = -0.2263214952251289
const OX = 941.1319005359636
const OY = 1903.7418159274296

/** z4 pixel space dimensions (world extent at Leaflet zoom 0). */
export const MAP_W = 2048
export const MAP_H = 3072

/** z4 px of a world point. */
export function worldToMapPx(x: number, y: number): { px: number; py: number } {
  return { px: KX * x + OX, py: KY * y + OY }
}

/**
 * Leaflet coordinates for a world point under CRS.Simple
 * (lat = north, lng = east). py is top-down, so lat = -py.
 */
export function worldToLatLng(x: number, y: number): [number, number] {
  const { px, py } = worldToMapPx(x, y)
  return [-py, px]
}

/**
 * Approximate inverse of worldToLatLng: Leaflet lat/lng back to game-world
 * coords.  Because the transform is a simple affine fit (not a true map
 * projection) the result is only approximate — typically within 20-50 game
 * units of the clicked tile position, which is sufficient for "get me near
 * this area" teleportation.
 */
export function mapToGameCoords(lat: number, lng: number): { x: number; y: number } {
  // worldToLatLng: lat = -py, lng = px
  // worldToMapPx: px = KX * x + OX, py = KY * y + OY
  // Inverse: x = (lng - OX) / KX, y = (-lat - OY) / KY
  return {
    x: (lng - OX) / KX,
    y: (-lat - OY) / KY,
  }
}

// ---- Tile server geometry ----

/** Available tile styles. */
export const SC_STYLES = ['render', 'game', 'print'] as const
export type ScStyle = (typeof SC_STYLES)[number]

export const SC_TILE_BASE = 'https://s.rsg.sc/sc/images/games/GTAV/map'

/**
 * Per-zoom tile grid extent served by the CDN (tile counts, origin 0,0).
 * The grid is the island's bounding box at each resolution — NOT a standard
 * 2^z square. z >= 7 is partial (north-only) and must not be used.
 */
const SC_RANGES: Record<number, readonly [number, number]> = {
  0: [1, 1],
  1: [1, 2],
  2: [2, 3],
  3: [4, 6],
  4: [8, 12],
  5: [16, 24],
  6: [32, 48],
}

export const SC_MIN_ZOOM = 0
export const SC_MAX_ZOOM = 6

/**
 * The tile server's grid subdivides the same fixed world extent (MAP_W x MAP_H)
 * at every zoom, so a Leaflet tile (tx, ty) at zoom z (CRS.Simple)
 * maps 1:1 onto SC tile (tx, ty) at SC zoom z + 4. Leaflet tile y increases
 * southward and is non-negative here because the whole map has lat <= 0.
 * (Verified empirically: a player at Del Perro Pier resolves to SC tile (2, 8)
 * at Leaflet z0, matching the fitted transform's z4 pixel location.)
 */
export function leafletZoomToScZoom(z: number): number {
  return z + 4
}

export function scTileForLeaflet(z: number, tx: number, ty: number): { z: number; x: number; y: number } | null {
  const scZ = leafletZoomToScZoom(z)
  const x = tx
  const y = ty
  const range = SC_RANGES[scZ]
  // z0/z1 tiles are stretched over non-square regions -> no 1:1 mapping.
  if (!range || scZ < 2 || x < 0 || y < 0 || x >= range[0] || y >= range[1]) return null
  return { z: scZ, x, y }
}

export function scTileUrl(style: ScStyle, z: number, x: number, y: number): string {
  return `${SC_TILE_BASE}/${style}/${z}/${x}/${y}.jpg`
}

/**
 * Full island bounds in Leaflet lat/lng (with the tile grid's margin included).
 * maxZoom 2 = SC z6, the deepest zoom with complete island coverage.
 */
export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-MAP_H, 0],
  [0, MAP_W],
]

// SC z0/z1 tiles are 256x256 images stretched over non-square world regions,
// so the 1:1 grid mapping only holds for SC z2..z6 -> Leaflet -2..2.
export const MAP_MIN_ZOOM = -2 // SC z2 (2x3 grid, 1024-unit tiles)
export const MAP_MAX_ZOOM = 6 - 4 // 2 (SC z6)
