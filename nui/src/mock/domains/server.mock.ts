/**
 * Mock data and handlers for the Server domain.
 * Covers: announcements, gametype, map name, convars, cleanup.
 */

import type { DomainMock } from '../types'
import { toastAndReturn } from '../types'
import { mockToasts } from './players.mock'

// ---- Handlers ----

async function handleAnnounce(): Promise<Response> {
  return toastAndReturn('Announcement sent', 'success', {}, mockToasts)
}

async function handleSetGameType(): Promise<Response> {
  return toastAndReturn('Gametype updated', 'success', {}, mockToasts)
}

async function handleSetMapName(): Promise<Response> {
  return toastAndReturn('Map name updated', 'success', {}, mockToasts)
}

async function handleSetConvar(body: Record<string, unknown>): Promise<Response> {
  return toastAndReturn(`Set ${body.name}`, 'success', {}, mockToasts)
}

async function handleRequestCleanup(): Promise<Response> {
  return toastAndReturn('Cleanup requested', 'info', {}, mockToasts)
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
