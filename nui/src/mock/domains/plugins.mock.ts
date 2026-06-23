/**
 * Mock data and handlers for the NUI plugin system.
 *
 * Intercepts the `pluginCall` NUI callback so plugins work in browser
 * dev mode (?dev). Each plugin's actions are mocked here.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- EasyInfo example plugin mock responses ----

function handlePluginCall(body: Record<string, unknown>): Promise<Response> {
  const pluginId = body.pluginId as string
  const action = body.action as string
  const server = body.server === true

  // EasyInfo: getServerInfo
  if (pluginId === 'easyinfo' && action === 'getServerInfo') {
    return Promise.resolve(jsonResponse({
      ok: true,
      resourceName: 'EasyAdmin (mock)',
      uptimeMs: 3600_000,
      playerCount: 8,
      frameRate: 60,
      gameName: 'FiveM',
    }))
  }

  // EasyInfo: getPlayerNotes
  if (pluginId === 'easyinfo' && action === 'getPlayerNotes') {
    return Promise.resolve(jsonResponse([
      { text: 'This is a mock note for the EasyInfo plugin demo.', author: 'Mock Admin', timestamp: Math.floor(Date.now() / 1000) - 600 },
      { text: 'Player has been warned previously for RDM.', author: 'Mock Mod', timestamp: Math.floor(Date.now() / 1000) - 86400 },
    ]))
  }

  // EasyInfo: getStatus (dashboard widget)
  if (pluginId === 'easyinfo' && action === 'getStatus') {
    return Promise.resolve(jsonResponse({ ok: true, online: true, latencyMs: 12 }))
  }

  // EasyInfo: server-side getPlayerCount
  if (pluginId === 'easyinfo' && action === 'getPlayerCount' && server) {
    return Promise.resolve(jsonResponse({ ok: true, count: 8, requestedBy: 1 }))
  }

  console.warn('[mock] Unknown pluginCall:', pluginId, action)
  return Promise.resolve(jsonResponse({ ok: false, error: 'unknown plugin action' }))
}

export const pluginsMock: DomainMock = {
  handlers: {
    pluginCall: handlePluginCall,
  },
}
