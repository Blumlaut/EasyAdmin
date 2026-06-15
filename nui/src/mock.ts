/**
 * Browser dev mock for FiveM NUI globals.
 * Auto-activates when `?dev` is in the URL.
 *
 * Provides demo data and intercepts callLua so the UI is fully interactive
 * without running FiveM.
 */

import type { BanEntry, CachedPlayer, Notification, Permissions, Player, Report } from './types'

const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'Alice Johnson', license: 'license:abc123', ip: '127.0.0.1', discord: 'alice#0001' },
  { id: 2, name: 'Bob Smith', license: 'license:def456', ip: '192.168.1.50' },
  { id: 3, name: 'Charlie Brown', license: 'license:ghi789', ip: '10.0.0.12', frozen: true },
  { id: 4, name: 'Diana Prince', license: 'license:jkl012', ip: '172.16.0.5', muted: true },
  { id: 5, name: 'Eve Adams', license: 'license:mno345', ip: '192.168.2.100' },
  { id: 6, name: 'Frank Castle', license: 'license:pqr678', ip: '10.10.10.10', developer: true },
  { id: 7, name: 'Grace Hopper', license: 'license:stu901', ip: '172.20.0.3' },
  { id: 8, name: 'Hank Pym', license: 'license:vwx234', ip: '192.168.3.200', contributor: true },
]

const DEMO_PERMISSIONS: Permissions = {
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
  'player.reports.claim': true,
  'player.reports.process': true,
  'server.announce': true,
  'server.convars': true,
  'server.resources.start': true,
  'server.resources.stop': true,
  'server.cleanup.cars': true,
  'server.cleanup.peds': true,
  'server.cleanup.props': true,
  'anon': true,
}

const DEMO_BANS: BanEntry[] = [
  {
    banid: '1001',
    name: 'Griefer One',
    reason: 'Mass RDM',
    banner: 'admin_alice',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:xxxx1111', 'ip:192.168.99.99', 'discord:griefer#0001'],
  },
  {
    banid: '1002',
    name: 'ToxicPlayer',
    reason: 'Hate speech',
    banner: 'admin_bob',
    expire: Math.floor(Date.now() / 1000) + 7 * 86400,
    expireString: '7 days',
    identifiers: ['license:yyyy2222'],
  },
  {
    banid: '1003',
    name: 'Cheater',
    reason: 'Aimbot detected',
    banner: 'system',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:zzzz3333', 'steam:1100001abcdef'],
  },
  {
    banid: '1004',
    name: 'Spam Bot',
    reason: 'Chat spam',
    banner: 'admin_carol',
    expire: Math.floor(Date.now() / 1000) + 86400,
    expireString: '1 day',
    identifiers: ['license:aaaa4444'],
  },
  {
    banid: '1005',
    name: 'Exploid Kid',
    reason: 'Exploiting',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 30 * 86400,
    expireString: '1 month',
    identifiers: ['license:bbbb5555', 'xbl:2535411546549870'],
  },
]

const DEMO_CACHED: CachedPlayer[] = [
  { id: 99, name: 'Recent1', identifier: 'license:recent0001', droppedTime: Date.now() / 1000 - 60 },
  { id: 100, name: 'Recent2', identifier: 'license:recent0002', droppedTime: Date.now() / 1000 - 300 },
  { id: 101, name: 'Recent3', identifier: 'license:recent0003', droppedTime: Date.now() / 1000 - 600 },
  { id: 102, name: 'Recent4', identifier: 'license:recent0004', droppedTime: Date.now() / 1000 - 1200 },
]

const DEMO_REPORTS: Report[] = [
  {
    id: 42,
    type: 0,
    reporter: 5,
    reporterName: 'Eve Adams',
    reported: 2,
    reportedName: 'Bob Smith',
    reason: 'Camping rooftop with sniper',
    reportTimeFormatted: '2m ago',
  },
  {
    id: 43,
    type: 1,
    reporter: 4,
    reporterName: 'Diana Prince',
    reported: 6,
    reportedName: 'Frank Castle',
    reason: 'Emergency: vehicle ramming on foot',
    reportTimeFormatted: '5m ago',
    claimed: true,
    claimedName: 'admin_alice',
  },
  {
    id: 44,
    type: 0,
    reporter: 7,
    reporterName: 'Grace Hopper',
    reason: 'Suspected cheating (infinite ammo)',
    reportTimeFormatted: '12m ago',
  },
]

let mockPlayers = [...DEMO_PLAYERS]
let mockBans: BanEntry[] = [...DEMO_BANS]
let mockReports: Report[] = [...DEMO_REPORTS]
const mockToasts: Notification[] = []

function broadcastNotification(notification: Notification) {
  window.postMessage({ action: 'notification', data: notification }, '*')
}

function toastAndReturn(text: string, type: Notification['type'] = 'success', extra: Record<string, unknown> = {}) {
  const n: Notification = { text, type }
  mockToasts.push(n)
  broadcastNotification(n)
  return jsonResponse({ success: true, ...extra })
}

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
        return toastAndReturn(`Kicked ${body.name || 'player'}`)
      }

      case 'banPlayer': {
        const banId = Number(body.id || 0)
        mockPlayers = mockPlayers.filter((p) => p.id !== banId)
        return toastAndReturn(`Banned ${body.name || 'player'}`)
      }

      case 'offlineBanPlayer':
        return toastAndReturn(`Offline-banned ${body.name || 'player'}`)

      case 'warnPlayer':
        return toastAndReturn(`Warned ${body.name || 'player'}`, 'info')

      case 'slapPlayer':
        return toastAndReturn(`Slapped ${body.name || 'player'}`, 'info')

      case 'spectatePlayer':
        return toastAndReturn(`Spectating ${body.name || 'player'}`, 'info')

      case 'teleportToPlayer':
        return toastAndReturn(`Teleported to ${body.name || 'player'}`, 'info')

      case 'teleportPlayerToMe':
        if (body.id === -1) {
          return toastAndReturn(`Teleported everyone to you`, 'info')
        }
        return toastAndReturn(`Teleported ${body.name || 'player'} to you`, 'info')

      case 'teleportMeBack':
        return toastAndReturn('Teleported back', 'info')

      case 'teleportPlayerBack':
        return toastAndReturn('Player teleported back', 'info')

      case 'teleportIntoVehicle':
        return toastAndReturn('Placed into closest vehicle', 'info')

      case 'joinPlayerBucket':
        return toastAndReturn('Joined bucket', 'info')

      case 'forcePlayerBucket':
        return toastAndReturn('Forced into your bucket', 'info')

      case 'toggleFreeze': {
        const freezeId = Number(body.id || 0)
        mockPlayers = mockPlayers.map((p) =>
          p.id === freezeId ? { ...p, frozen: !p.frozen } : p
        )
        const updated = mockPlayers.find((p) => p.id === freezeId)
        if (updated) {
          window.postMessage({ action: 'playerUpdated', data: updated }, '*')
        }
        return toastAndReturn(`${updated?.frozen ? 'Frozen' : 'Unfrozen'} ${body.name || 'player'}`, 'info')
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
        return toastAndReturn(`${updatedMuted?.muted ? 'Muted' : 'Unmuted'} ${body.name || 'player'}`, 'info')
      }

      case 'screenshotPlayer':
        return toastAndReturn(`Screenshot of ${body.name || 'player'} saved`)

      case 'requestBanList':
        return jsonResponse({ bans: mockBans })

      case 'getBanById': {
        const ban = mockBans.find((b) => b.banid === String(body.banid))
        return jsonResponse({ ban })
      }

      case 'editBan': {
        mockBans = mockBans.map((b) => (b.banid === body.banid ? { ...b, ...body } : b))
        return toastAndReturn('Ban updated')
      }

      case 'unbanPlayer': {
        mockBans = mockBans.filter((b) => b.banid !== body.banid)
        return toastAndReturn('Player unbanned')
      }

      case 'requestCachedPlayers':
        return jsonResponse({ players: DEMO_CACHED })

      case 'requestReports':
        return jsonResponse({ reports: mockReports })

      case 'getReportById': {
        const report = mockReports.find((r) => r.id === Number(body.id))
        return jsonResponse({ report })
      }

      case 'claimReport': {
        mockReports = mockReports.map((r) =>
          r.id === Number(body.id) ? { ...r, claimed: true, claimedName: 'admin_you' } : r,
        )
        return toastAndReturn('Report claimed')
      }

      case 'closeReport': {
        mockReports = mockReports.filter((r) => r.id !== Number(body.id))
        return toastAndReturn('Report closed')
      }

      case 'closeSimilarReports': {
        const target = mockReports.find((r) => r.id === Number(body.id))
        if (target) {
          mockReports = mockReports.filter(
            (r) => !(r.reporter === target.reporter && r.reported === target.reported),
          )
        }
        return toastAndReturn('Similar reports closed')
      }

      case 'announce':
        return toastAndReturn('Announcement sent')

      case 'setGameType':
        return toastAndReturn('Gametype updated')

      case 'setMapName':
        return toastAndReturn('Map name updated')

      case 'startResource':
        return toastAndReturn(`Started ${body.name}`)

      case 'stopResource':
        return toastAndReturn(`Stopped ${body.name}`)

      case 'setConvar':
        return toastAndReturn(`Set ${body.name}`)

      case 'requestCleanup':
        return toastAndReturn('Cleanup requested', 'info')

      case 'requestServerStats':
        return jsonResponse({
          maxPlayers: 48,
          resources: {
            total: 85,
            started: 78,
            stopped: 7,
          },
          entities: {
            vehicles: 142,
            peds: 387,
            objects: 1253,
          },
        })

      case 'requestPlayerHistory': {
        const range = body.range || '24h'
        const now = Date.now()
        let span: number
        let interval: number
        if (range === '1h') { span = 3600000; interval = 300000 }       // 1h, 5min points
        else if (range === '6h') { span = 21600000; interval = 600000 }  // 6h, 10min points
        else if (range === '7d') { span = 604800000; interval = 900000 } // 7d, 15min points
        else { span = 86400000; interval = 600000 }                       // 24h, 10min points
        const points = []
        for (let t = now - span; t <= now; t += interval) {
          const count = Math.floor(Math.random() * 30) + 5
          points.push({ timestamp: t, count })
        }
        return jsonResponse(points)
      }

      case 'setAnonymous':
      case 'setTtsEnabled':
      case 'setTtsSpeed':
      case 'setEasterEgg':
      case 'setShowLicenses':
        return jsonResponse({ success: true })

      case 'closeMenu':
        window.postMessage({ action: 'menuToggle', data: { visible: false } }, '*')
        return jsonResponse({ success: true })

      case 'setResourceKvp':
        return jsonResponse({ success: true })

      case 'copyToClipboard':
        return jsonResponse({ success: true })

      case 'refreshBanList':
      case 'refreshCachedPlayers':
      case 'refreshPermissions':
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
;(window as Record<string, unknown>).parentResourceName = 'EasyAdmin'

// Auto-open the menu after a short delay
setTimeout(() => {
  window.postMessage({ action: 'menuToggle', data: { visible: true } }, '*')
  // Also push initial player data
  window.postMessage({
    action: 'updatePlayers',
    data: {
      players: DEMO_PLAYERS,
      permissions: DEMO_PERMISSIONS,
      redm: false,
      ipprivacy: true,
    },
  }, '*')
  // Push demo easter eggs
  window.postMessage({
    action: 'initEasterEggs',
    data: { easterEggs: ['pride', 'logo-hardadmin', 'banner-hardadmin'], currentEgg: null },
  }, '*')
  // Push initial settings
  window.postMessage({
    action: 'initSettings',
    data: {
      orientation: 'middle',
      menuWidth: 0,
      tts: false,
      ttsSpeed: 4,
      anonymous: false,
      showLicenses: false,
    },
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

// eslint-disable-next-line no-console -- dev-only banner
console.log(
  '%c[EasyAdmin NUI Dev Mode] Mock active. Use the UI freely.',
  'color: #4ade80; font-weight: bold; font-size: 14px;',
)
