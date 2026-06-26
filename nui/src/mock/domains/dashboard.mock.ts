/**
 * Mock data and handlers for the Dashboard domain.
 * Covers: server stats, player history.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Helpers ----

function getStartedResources(): number {
  // We need access to the internal mock resources. Since we can't access them
  // directly, we'll generate consistent mock data here.
  // In practice, the dashboard mock is used independently.
  return 45
}

// ---- Handlers ----

async function handleRequestServerStats(): Promise<Response> {
  return jsonResponse({
    maxPlayers: 48,
    resources: {
      total: 80,
      started: getStartedResources(),
      stopped: 35,
    },
    entities: {
      vehicles: 142,
      peds: 387,
      objects: 1253,
    },
  })
}

async function handleRequestPlayerHistory(body: Record<string, unknown>): Promise<Response> {
  const range = body.range || '24h'
  const now = Math.floor(Date.now() / 1000)
  let span: number
  let interval: number
  if (range === '1h') { span = 3600; interval = 300 }
  else if (range === '6h') { span = 21600; interval = 600 }
  else if (range === '7d') { span = 604800; interval = 900 }
  else { span = 86400; interval = 600 }

  const points = []
  for (let t = now - span; t <= now; t += interval) {
    const count = Math.floor(Math.random() * 30) + 5
    points.push({ timestamp: t, count })
  }
  return jsonResponse(points)
}

export const dashboardMock: DomainMock = {
  handlers: {
    requestServerStats: handleRequestServerStats,
    requestPlayerHistory: handleRequestPlayerHistory,
    requestUpdateInfo: async () => jsonResponse({ ok: true }),
  },
}
