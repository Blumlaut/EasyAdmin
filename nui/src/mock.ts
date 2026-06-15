/**
 * Browser dev mock for FiveM NUI globals.
 * Auto-activates when `?dev` is in the URL.
 *
 * Provides demo data and intercepts callLua so the UI is fully interactive
 * without running FiveM.
 */

import type { Player, Permissions, Notification } from './types'

const DEMO_PLAYERS: Player[] = [
  { id: '1', name: 'Alice Johnson', license: 'license:abc123', ip: '127.0.0.1', ping: 24, score: 150, gang: '', job: 'police', frozen: false, muted: false },
  { id: '2', name: 'Bob Smith', license: 'license:def456', ip: '192.168.1.50', ping: 45, score: 80, gang: 'lostmc', job: '', frozen: false, muted: false },
  { id: '3', name: 'Charlie Brown', license: 'license:ghi789', ip: '10.0.0.12', ping: 120, score: 30, gang: '', job: 'mechanic', frozen: true, muted: false },
  { id: '4', name: 'Diana Prince', license: 'license:jkl012', ip: '172.16.0.5', ping: 15, score: 500, gang: '', job: 'doctor', frozen: false, muted: true },
  { id: '5', name: 'Eve Adams', license: 'license:mno345', ip: '192.168.2.100', ping: 67, score: 200, gang: 'ballas', job: '', frozen: false, muted: false },
  { id: '6', name: 'Frank Castle', license: 'license:pqr678', ip: '10.10.10.10', ping: 200, score: 5, gang: '', job: '', frozen: false, muted: false },
  { id: '7', name: 'Grace Hopper', license: 'license:stu901', ip: '172.20.0.3', ping: 33, score: 350, gang: '', job: 'police', frozen: false, muted: false },
  { id: '8', name: 'Hank Pym', license: 'license:vwx234', ip: '192.168.3.200', ping: 89, score: 120, gang: 'vagos', job: '', frozen: false, muted: false },
]

const DEMO_PERMISSIONS: Permissions = {
  'admin.menu': true,
  'admin.player.kick': true,
  'admin.player.ban': true,
  'admin.player.warn': true,
  'admin.player.slap': true,
  'admin.player.spectate': true,
  'admin.player.teleport': true,
  'admin.player.freeze': true,
  'admin.player.mute': true,
  'admin.player.screenshot': true,
  'admin.server': false,
  'admin.settings': false,
}

let mockPlayers = [...DEMO_PLAYERS]
const mockToasts: Notification[] = []

// Intercept fetch calls that go to the Lua backend
const originalFetch = window.fetch
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.includes('/EasyAdmin/')) {
    const action = input.split('/').pop() || ''
    const body = init?.body ? JSON.parse(bodyToString(init.body)) : {}

    // Simulate async delay like a real server
    await new Promise((resolve) => setTimeout(resolve, 100))

    switch (action) {
      case 'requestPlayers':
        return jsonResponse({ players: mockPlayers, permissions: DEMO_PERMISSIONS })

      case 'kickPlayer':
        const kickId = String(body.id || '')
        mockPlayers = mockPlayers.filter((p) => p.id !== kickId)
        mockToasts.push({ text: `Kicked ${body.name || 'player'}`, type: 'success' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'banPlayer':
        const banId = String(body.id || '')
        mockPlayers = mockPlayers.filter((p) => p.id !== banId)
        mockToasts.push({ text: `Banned ${body.name || 'player'}`, type: 'success' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'warnPlayer':
        mockToasts.push({ text: `Warned ${body.name || 'player'}`, type: 'warning' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'slapPlayer':
        mockToasts.push({ text: `Slapped ${body.name || 'player'}`, type: 'info' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'spectatePlayer':
        mockToasts.push({ text: `Spectating ${body.name || 'player'}`, type: 'info' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'teleportToPlayer':
        mockToasts.push({ text: `Teleported to ${body.name || 'player'}`, type: 'info' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'toggleFreeze':
        const freezeId = String(body.id || '')
        mockPlayers = mockPlayers.map((p) =>
          p.id === freezeId ? { ...p, frozen: !p.frozen } : p
        )
        // Broadcast the player update
        const updated = mockPlayers.find((p) => p.id === freezeId)
        if (updated) {
          window.postMessage({ action: 'playerUpdated', data: updated }, '*')
        }
        mockToasts.push({ text: `${updated?.frozen ? 'Frozen' : 'Unfrozen'} ${body.name || 'player'}`, type: 'info' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'toggleMute':
        const muteId = String(body.id || '')
        mockPlayers = mockPlayers.map((p) =>
          p.id === muteId ? { ...p, muted: !p.muted } : p
        )
        const updatedMuted = mockPlayers.find((p) => p.id === muteId)
        if (updatedMuted) {
          window.postMessage({ action: 'playerUpdated', data: updatedMuted }, '*')
        }
        mockToasts.push({ text: `${updatedMuted?.muted ? 'Muted' : 'Unmuted'} ${body.name || 'player'}`, type: 'info' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'screenshotPlayer':
        mockToasts.push({ text: `Screenshot of ${body.name || 'player'} saved`, type: 'success' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })

      case 'closeMenu':
        window.postMessage({ action: 'menuToggle', data: { visible: false } }, '*')
        return jsonResponse({ success: true })

      case 'setResourceKvp':
        return jsonResponse({ success: true })

      default:
        console.warn('[mock] Unknown action:', action)
        return jsonResponse({ success: false })
    }
  }
  return originalFetch(input, init)
}

// Provide the FiveM global
window.parentResourceName = 'EasyAdmin'

// Auto-open the menu after a short delay
setTimeout(() => {
  window.postMessage({ action: 'menuToggle', data: { visible: true } }, '*')
  // Also push initial player data
  window.postMessage({
    action: 'updatePlayers',
    data: { players: DEMO_PLAYERS, permissions: DEMO_PERMISSIONS },
  }, '*')
}, 500)

function bodyToString(body: unknown): string {
  if (typeof body === 'string') return body
  if (body instanceof FormData) {
    const parts: string[] = []
    // @ts-expect-error FormData iteration
    for (const [k, v] of body.entries()) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    }
    return parts.join('&')
  }
  return JSON.stringify(body)
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function broadcastNotification(notification: Notification) {
  window.postMessage({ action: 'notification', data: notification }, '*')
}

console.log(
  '%c[EasyAdmin NUI Dev Mode] Mock active. Use the UI freely.',
  'color: #4ade80; font-weight: bold; font-size: 14px;',
)
