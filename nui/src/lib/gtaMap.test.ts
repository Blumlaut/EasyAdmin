import { describe, it, expect } from 'vitest'
import {
  worldToMapPx,
  worldToLatLng,
  scTileForLeaflet,
  scTileUrl,
  leafletZoomToScZoom,
  MAP_W,
  MAP_H,
  MAP_BOUNDS,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from './gtaMap'

/**
 * Landmarks with independently-sourced game coordinates, verified to land on
 * the matching feature in the SC tile imagery (see commit/PR validation).
 * Tolerances are in z4 px (1 px ~= 9 m at this scale).
 */
const LANDMARKS: Array<{ name: string; x: number; y: number; px: number; py: number; tol: number }> = [
  { name: 'Del Perro Pier', x: -1850.127, y: -1231.751, px: 528.2, py: 2182.5, tol: 10 },
  { name: 'Mount Chiliad', x: 450.718, y: 5566.614, px: 1041.7, py: 643.9, tol: 10 },
  { name: 'Merryweather Dock', x: 486.417, y: -3339.692, px: 1049.7, py: 2659.6, tol: 10 },
  { name: 'Chumash Pier', x: -3426.683, y: 967.738, px: 176.4, py: 1684.7, tol: 10 },
  { name: 'North tip', x: 24.775, y: 7644.102, px: 946.7, py: 173.7, tol: 25 },
]

describe('worldToMapPx', () => {
  it.each(LANDMARKS)('$name lands on the expected z4 pixel', ({ x, y, px, py, tol }) => {
    const r = worldToMapPx(x, y)
    expect(r.px).toBeCloseTo(px, -1)
    expect(r.px).toBeGreaterThan(px - tol)
    expect(r.px).toBeLessThan(px + tol)
    expect(r.py).toBeGreaterThan(py - tol)
    expect(r.py).toBeLessThan(py + tol)
  })

  it('is monotonic: +x east, +y north (up on map)', () => {
    const a = worldToMapPx(0, 0)
    const east = worldToMapPx(100, 0)
    const north = worldToMapPx(0, 100)
    expect(east.px).toBeGreaterThan(a.px)
    expect(east.py).toBeCloseTo(a.py, 5)
    expect(north.py).toBeLessThan(a.py)
    expect(north.px).toBeCloseTo(a.px, 5)
  })

  it('maps the full world inside the tile grid', () => {
    const corners = [
      worldToMapPx(-4230, -3640),
      worldToMapPx(4230, -3640),
      worldToMapPx(-4230, 7644),
      worldToMapPx(4230, 7644),
    ]
    for (const c of corners) {
      expect(c.px).toBeGreaterThanOrEqual(-10)
      expect(c.px).toBeLessThanOrEqual(MAP_W + 10)
      expect(c.py).toBeGreaterThanOrEqual(100)
      expect(c.py).toBeLessThanOrEqual(MAP_H - 100)
    }
  })
})

describe('worldToLatLng', () => {
  it('converts to CRS.Simple coordinates (lat = -py, lng = px)', () => {
    const [lat, lng] = worldToLatLng(0, 0)
    const { px, py } = worldToMapPx(0, 0)
    expect(lat).toBeCloseTo(-py, 10)
    expect(lng).toBeCloseTo(px, 10)
  })

  it('keeps all landmarks inside the map bounds', () => {
    for (const lm of LANDMARKS) {
      const [lat, lng] = worldToLatLng(lm.x, lm.y)
      expect(lat).toBeGreaterThanOrEqual(MAP_BOUNDS[0][0])
      expect(lat).toBeLessThanOrEqual(MAP_BOUNDS[1][0])
      expect(lng).toBeGreaterThanOrEqual(MAP_BOUNDS[0][1])
      expect(lng).toBeLessThanOrEqual(MAP_BOUNDS[1][1])
    }
  })
})

describe('scTileForLeaflet', () => {
  it('maps Leaflet tiles 1:1 onto SC tiles at zoom 0 (SC z4)', () => {
    expect(scTileForLeaflet(0, 0, 0)).toEqual({ z: 4, x: 0, y: 0 })
    // Del Perro Pier: world (-1850.1, -1231.8) -> lng 528.2, lat -2182.5 -> tile (2, 8)
    expect(scTileForLeaflet(0, 2, 8)).toEqual({ z: 4, x: 2, y: 8 })
    expect(scTileForLeaflet(0, 7, 11)).toEqual({ z: 4, x: 7, y: 11 })
  })

  it('maps deep zoom tiles to SC z6', () => {
    expect(scTileForLeaflet(2, 31, 47)).toEqual({ z: 6, x: 31, y: 47 })
  })

  it('maps negative zoom tiles to coarser SC zooms', () => {
    expect(scTileForLeaflet(-2, 1, 2)).toEqual({ z: 2, x: 1, y: 2 })
  })

  it('returns null for tiles outside the served grid', () => {
    expect(scTileForLeaflet(2, 32, 0)).toBeNull() // x beyond 32 tiles
    expect(scTileForLeaflet(2, 0, 48)).toBeNull() // y beyond 48 tiles
    expect(scTileForLeaflet(3, 0, 0)).toBeNull() // SC z7 not served
    expect(scTileForLeaflet(-3, 0, 1)).toBeNull() // SC z1 tiles are stretched (no 1:1 mapping)
    expect(scTileForLeaflet(-4, 0, 1)).toBeNull() // SC z0 has no (0,1)
  })
})

describe('tile server constants', () => {
  it('builds correct tile URLs', () => {
    expect(scTileUrl('render', 4, 3, 7)).toBe('https://s.rsg.sc/sc/images/games/GTAV/map/render/4/3/7.jpg')
  })

  it('zoom mapping is consistent', () => {
    expect(leafletZoomToScZoom(0)).toBe(4)
    expect(leafletZoomToScZoom(MAP_MAX_ZOOM)).toBe(6)
    expect(leafletZoomToScZoom(MAP_MIN_ZOOM)).toBe(2)
  })
})
