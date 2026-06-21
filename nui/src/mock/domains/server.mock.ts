/**
 * Mock data and handlers for the Server domain.
 * Covers: announcements, gametype, map name, convars, cleanup.
 */

import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Handlers ----

async function handleAnnounce(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetGameType(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetMapName(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSetConvar(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleRequestCleanup(): Promise<Response> {
  return jsonResponse({ success: true })
}

export const serverMock: DomainMock = {
  handlers: {
    announce: handleAnnounce,
    setGameType: handleSetGameType,
    setMapName: handleSetMapName,
    setConvar: handleSetConvar,
    requestCleanup: handleRequestCleanup,
  },
}
