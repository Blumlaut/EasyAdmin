/**
 * Map domain mock — simulates the client's 2 Hz position stream.
 *
 * Demo players are parked at real, independently-verified GTA V landmarks so
 * browser e2e runs can visually confirm coordinate resolution against the
 * live Social Club tiles.
 */
import { jsonResponse, type DomainMock } from '../types'
import type { MapPlayerPos } from '../../types'

/** Player id -> landmark (world coords). */
const LANDMARK_POSITIONS: Record<number, { x: number; y: number; label: string }> = {
  1: { x: -1850.127, y: -1231.751, label: 'Del Perro Pier' },
  2: { x: 450.718, y: 5566.614, label: 'Mount Chiliad' },
  3: { x: -3426.683, y: 967.738, label: 'Chumash Pier (Alamo)' },
  4: { x: 486.417, y: -3339.692, label: 'Merryweather Dock' },
  5: { x: 3430.155, y: 5174.196, label: 'El Gordo Lighthouse' },
  6: { x: 24.775, y: 7644.102, label: 'North tip' },
  7: { x: -1700, y: -1100, label: 'near Del Perro' },
  8: { x: 600, y: 5400, label: 'near Mount Chiliad' },
}

const SELF_ID = 6 // Frank Castle (demo admin)

let timer: ReturnType<typeof setInterval> | null = null

export function startMapStreamer(): void {
  if (timer) return
  const startedAt = Date.now()

  const emit = () => {
    // Small circular drift around each landmark so updates are visible.
    const t = (Date.now() - startedAt) / 1000
    const players: MapPlayerPos[] = Object.entries(LANDMARK_POSITIONS).map(([id, p]) => {
      const i = Number(id)
      const r = 6
      return {
        id: i,
        x: p.x + r * Math.sin(t * 0.3 + i),
        y: p.y + r * Math.cos(t * 0.25 + i),
      }
    })
    window.postMessage({ action: 'updateMapPlayers', data: { players, selfId: SELF_ID } }, '*')
  }

  emit()
  timer = setInterval(emit, 500)
}

export const mapMock: DomainMock = {
  handlers: {
    // No-op in browser dev: the mock streamer runs independently.
    setMapStream: async () => jsonResponse({ ok: true }),
  },
}
