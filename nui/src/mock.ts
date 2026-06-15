/**
 * Browser dev mock for FiveM NUI globals.
 * Auto-activates when `?dev` is in the URL.
 *
 * Provides demo data and intercepts callLua so the UI is fully interactive
 * without running FiveM.
 */

import type { Player, Permissions, Notification } from './types'

const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'Alice Johnson', license: 'license:abc123', ip: '127.0.0.1' },
  { id: 2, name: 'Bob Smith', license: 'license:def456', ip: '192.168.1.50' },
  { id: 3, name: 'Charlie Brown', license: 'license:ghi789', ip: '10.0.0.12', frozen: true },
  { id: 4, name: 'Diana Prince', license: 'license:jkl012', ip: '172.16.0.5', muted: true },
  { id: 5, name: 'Eve Adams', license: 'license:mno345', ip: '192.168.2.100' },
  { id: 6, name: 'Frank Castle', license: 'license:pqr678', ip: '10.10.10.10' },
  { id: 7, name: 'Grace Hopper', license: 'license:stu901', ip: '172.20.0.3' },
  { id: 8, name: 'Hank Pym', license: 'license:vwx234', ip: '192.168.3.200' },
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

      case 'kickPlayer': {
        const kickId = Number(body.id || 0)
        mockPlayers = mockPlayers.filter((p) => p.id !== kickId)
        mockToasts.push({ text: `Kicked ${body.name || 'player'}`, type: 'success' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })
      }

      case 'banPlayer': {
        const banId = Number(body.id || 0)
        mockPlayers = mockPlayers.filter((p) => p.id !== banId)
        mockToasts.push({ text: `Banned ${body.name || 'player'}`, type: 'success' })
        broadcastNotification(mockToasts[mockToasts.length - 1])
        return jsonResponse({ success: true })
      }

      case 'warnPlayer':
        mockToasts.push({ text: `Warned ${body.name || 'player'}`, type: 'info' })
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

      case 'toggleFreeze': {
        const freezeId = Number(body.id || 0)
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
      }

      case 'toggleMute': {
        const muteId = Number(body.id || 0)
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
      }

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
// @ts-expect-error FiveM global not in lib.dom
(window as Record<string, unknown>).parentResourceName = 'EasyAdmin'

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

// eslint-disable-next-line no-console -- dev-only banner
console.log(
  '%c[EasyAdmin NUI Dev Mode] Mock active. Use the UI freely.',
  'color: #4ade80; font-weight: bold; font-size: 14px;',
)
