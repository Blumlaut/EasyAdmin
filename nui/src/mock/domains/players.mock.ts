/**
 * Mock data and handlers for the Players domain.
 * Covers: player list, player actions (kick, ban, freeze, mute, teleport, etc.),
 * cached players, and player identifiers.
 */

import type { CachedPlayer, Notification, Permissions, Player } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Demo Data ----

export const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'Alice Johnson', license: 'license:abc123', ip: '127.0.0.1', discord: 'alice#0001' },
  { id: 2, name: 'Bob Smith', license: 'license:def456', ip: '192.168.1.50' },
  { id: 3, name: 'Charlie Brown', license: 'license:ghi789', ip: '10.0.0.12', frozen: true },
  { id: 4, name: 'Diana Prince', license: 'license:jkl012', ip: '172.16.0.5', muted: true },
  { id: 5, name: 'Eve Adams', license: 'license:mno345', ip: '192.168.2.100' },
  { id: 6, name: 'Frank Castle', license: 'license:pqr678', ip: '10.10.10.10', admin: true, developer: true },
  { id: 7, name: 'Grace Hopper', license: 'license:stu901', ip: '172.20.0.3' },
  { id: 8, name: 'Hank Pym', license: 'license:vwx234', ip: '192.168.3.200', contributor: true },
]

export const DEMO_PERMISSIONS: Permissions = {
  'admin.menu': true,
  'player.kick': true,
  'player.ban.temporary': true,
  'player.ban.permanent': true,
  'player.ban.view': true,
  'player.ban.edit': true,
  'player.ban.remove': true,
  'player.warn': true,
  'player.slap': true,
  'player.spectate': true,
  'player.teleport.single': true,
  'player.teleport.everyone': true,
  'player.freeze': true,
  'player.mute': true,
  'player.screenshot': true,
  'player.bucket.join': true,
  'player.bucket.force': true,
  'player.reports.view': true,
  'server.statistics.view': true,
  'player.reports.claim': true,
  'player.reports.process': true,
  'server.announce': true,
  'server.convars': true,
  'server.resources.start': true,
  'server.resources.stop': true,
  'server.resources.monitor': true,
  'server.cleanup.cars': true,
  'server.cleanup.peds': true,
  'server.cleanup.props': true,
  'server.mute.global': true,
  'anon': true,
}

export const DEMO_CACHED: CachedPlayer[] = [
  { id: 99, name: 'Recent1', identifier: 'license:recent0001', droppedTime: Date.now() / 1000 - 60 },
  { id: 100, name: 'Recent2', identifier: 'license:recent0002', droppedTime: Date.now() / 1000 - 300 },
  { id: 101, name: 'Recent3', identifier: 'license:recent0003', droppedTime: Date.now() / 1000 - 600 },
  { id: 102, name: 'Recent4', identifier: 'license:recent0004', droppedTime: Date.now() / 1000 - 1200 },
]

// ---- Mutable state ----

let mockPlayers = [...DEMO_PLAYERS]
export const mockToasts: Notification[] = []

// ---- Handlers ----

async function handleRequestPlayers(): Promise<Response> {
  return jsonResponse({ players: mockPlayers, permissions: DEMO_PERMISSIONS })
}

async function handleKickPlayer(body: Record<string, unknown>): Promise<Response> {
  const kickId = Number(body.id || 0)
  mockPlayers = mockPlayers.filter((p) => p.id !== kickId)
  return jsonResponse({ success: true })
}

async function handleBanPlayer(body: Record<string, unknown>): Promise<Response> {
  const banId = Number(body.id || 0)
  mockPlayers = mockPlayers.filter((p) => p.id !== banId)
  return jsonResponse({ success: true })
}

async function handleOfflineBanPlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleWarnPlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSlapPlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleSpectatePlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleTeleportToPlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleTeleportPlayerToMe(body: Record<string, unknown>): Promise<Response> {
  if (body.id === -1) {
    return jsonResponse({ success: true })
  }
  return jsonResponse({ success: true })
}

async function handleTeleportMeBack(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleTeleportPlayerBack(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleTeleportIntoVehicle(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleJoinPlayerBucket(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleForcePlayerBucket(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleToggleFreeze(body: Record<string, unknown>): Promise<Response> {
  const freezeId = Number(body.id || 0)
  mockPlayers = mockPlayers.map((p) =>
    p.id === freezeId ? { ...p, frozen: !p.frozen } : p,
  )
  const updated = mockPlayers.find((p) => p.id === freezeId)
  if (updated) {
    window.postMessage({ action: 'playerUpdated', data: updated }, '*')
  }
  return jsonResponse({ success: true })
}

async function handleToggleMute(body: Record<string, unknown>): Promise<Response> {
  const muteId = Number(body.id || 0)
  mockPlayers = mockPlayers.map((p) =>
    p.id === muteId ? { ...p, muted: !p.muted } : p,
  )
  const updatedMuted = mockPlayers.find((p) => p.id === muteId)
  if (updatedMuted) {
    window.postMessage({ action: 'playerUpdated', data: updatedMuted }, '*')
  }
  return jsonResponse({ success: true })
}

async function handleScreenshotPlayer(_body: Record<string, unknown>): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleRequestCachedPlayers(): Promise<Response> {
  return jsonResponse({ players: DEMO_CACHED })
}

async function handleGetPlayerIdentifiers(body: Record<string, unknown>): Promise<Response> {
  const playerId = (body as Record<string, unknown>).id ?? 1
  setTimeout(() => {
    window.postMessage({
      action: 'playerIdentifiers',
      data: {
        id: playerId,
        identifiers: [
          'license:abc123def456',
          'license2:r5:def456abc123',
          'fivem:789xyz',
          'discord:123456789012345678',
          'ip:192.168.1.100:1234',
          'steam:steam:1100001abcdef01',
        ],
      },
    }, '*')
  }, 100)
  return jsonResponse({ success: true })
}

async function handleRefreshCachedPlayers(): Promise<Response> {
  return jsonResponse({ success: true })
}

async function handleRefreshPermissions(): Promise<Response> {
  return jsonResponse({ success: true })
}

export const playersMock: DomainMock & { toasts: Notification[]; getPlayers: () => Player[] } = {
  handlers: {
    requestPlayers: handleRequestPlayers,
    kickPlayer: handleKickPlayer,
    banPlayer: handleBanPlayer,
    offlineBanPlayer: handleOfflineBanPlayer,
    warnPlayer: handleWarnPlayer,
    slapPlayer: handleSlapPlayer,
    spectatePlayer: handleSpectatePlayer,
    teleportToPlayer: handleTeleportToPlayer,
    teleportPlayerToMe: handleTeleportPlayerToMe,
    teleportMeBack: handleTeleportMeBack,
    teleportPlayerBack: handleTeleportPlayerBack,
    teleportIntoVehicle: handleTeleportIntoVehicle,
    joinPlayerBucket: handleJoinPlayerBucket,
    forcePlayerBucket: handleForcePlayerBucket,
    toggleFreeze: handleToggleFreeze,
    toggleMute: handleToggleMute,
    screenshotPlayer: handleScreenshotPlayer,
    requestCachedPlayers: handleRequestCachedPlayers,
    getPlayerIdentifiers: handleGetPlayerIdentifiers,
    refreshCachedPlayers: handleRefreshCachedPlayers,
    refreshPermissions: handleRefreshPermissions,
  },
  toasts: mockToasts,
  getPlayers: () => mockPlayers,
}
