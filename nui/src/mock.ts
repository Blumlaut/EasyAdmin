/**
 * Browser dev mock for FiveM NUI globals.
 * Auto-activates when `?dev` is in the URL.
 *
 * Provides demo data and intercepts callLua so the UI is fully interactive
 * without running FiveM.
 */

import type {
  BanEntry,
  BanListEntry,
  CachedPlayer,
  Notification,
  Permissions,
  Player,
  Report,
  ResourceEntry,
  ResourceMetadata,
} from './types'

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
    reason: 'Hate speech in chat',
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
    name: 'Exploit Kid',
    reason: 'Exploiting server',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 30 * 86400,
    expireString: '1 month',
    identifiers: ['license:bbbb5555', 'xbl:2535411546549870'],
  },
  {
    banid: '1006',
    name: 'Nuisance',
    reason: 'Repeated parking blocking',
    banner: 'admin_alice',
    expire: Math.floor(Date.now() / 1000) + 3 * 86400,
    expireString: '3 days',
    identifiers: ['license:cccc6666'],
  },
  {
    banid: '1007',
    name: 'MetaGamer',
    reason: 'Using external tools for meta-gaming',
    banner: 'admin_bob',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:dddd7777', 'discord:metagamer#1234'],
  },
  {
    banid: '1008',
    name: 'Repeater',
    reason: 'Second offense - vehicle theft',
    banner: 'admin_carol',
    expire: Math.floor(Date.now() / 1000) + 14 * 86400,
    expireString: '14 days',
    identifiers: ['license:eeee8888'],
  },
  {
    banid: '1009',
    name: 'Speeder',
    reason: 'Speed hacking in races',
    banner: 'system',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:ffff9999', 'steam:1100001xyzxyz'],
  },
  {
    banid: '1010',
    name: 'NoScope',
    reason: 'No-clip exploit',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 60 * 86400,
    expireString: '2 months',
    identifiers: ['license:gggg0000'],
  },
  {
    banid: '1011',
    name: 'Phony',
    reason: 'Impersonating staff',
    banner: 'admin_alice',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:hhhh1111', 'discord:phony#5678'],
  },
  {
    banid: '1012',
    name: 'DriveBy',
    reason: 'Unprovoked drive-by shooting',
    banner: 'admin_bob',
    expire: Math.floor(Date.now() / 1000) + 7 * 86400,
    expireString: '7 days',
    identifiers: ['license:iiii2222'],
  },
  {
    banid: '1013',
    name: 'LagSwitcher',
    reason: 'Lag switching during PvP',
    banner: 'system',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:jjjj3333', 'ip:10.20.30.40'],
  },
  {
    banid: '1014',
    name: 'Harasser',
    reason: 'Targeted harassment of another player',
    banner: 'admin_carol',
    expire: Math.floor(Date.now() / 1000) + 30 * 86400,
    expireString: '1 month',
    identifiers: ['license:kkkk4444'],
  },
  {
    banid: '1015',
    name: 'DoubleTrader',
    reason: 'Double trading scam',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 14 * 86400,
    expireString: '14 days',
    identifiers: ['license:llll5555', 'discord:doubletrader#9012'],
  },
  {
    banid: '1016',
    name: 'Parkour',
    reason: 'Clip exploit to access restricted areas',
    banner: 'admin_alice',
    expire: Math.floor(Date.now() / 1000) + 3 * 86400,
    expireString: '3 days',
    identifiers: ['license:mmmm6666'],
  },
  {
    banid: '1017',
    name: 'ScriptKiddie',
    reason: 'Using unauthorized script',
    banner: 'system',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:nnnn7777', 'steam:1100001ababab'],
  },
  {
    banid: '1018',
    name: 'RoadRage',
    reason: 'Persistent road rage incidents',
    banner: 'admin_bob',
    expire: Math.floor(Date.now() / 1000) + 7 * 86400,
    expireString: '7 days',
    identifiers: ['license:oooo8888'],
  },
  {
    banid: '1019',
    name: 'AccountFarmer',
    reason: 'Creating multiple accounts to evade bans',
    banner: 'admin_carol',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:pppp9999', 'license:qqqq0000', 'license:rrrr1111'],
  },
  {
    banid: '1020',
    name: 'PropertyDamager',
    reason: 'Repeated property damage',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 30 * 86400,
    expireString: '1 month',
    identifiers: ['license:ssss2222'],
  },
  {
    banid: '1021',
    name: 'VoiceAbuser',
    reason: 'Voice chat abuse and hate speech',
    banner: 'admin_alice',
    expire: Math.floor(Date.now() / 1000) + 14 * 86400,
    expireString: '14 days',
    identifiers: ['license:tttt3333', 'discord:voiceabuser#3456'],
  },
  {
    banid: '1022',
    name: 'BlenderSpammer',
    reason: 'Blender spam in public areas',
    banner: 'admin_bob',
    expire: Math.floor(Date.now() / 1000) + 1 * 86400,
    expireString: '1 day',
    identifiers: ['license:uuuu4444'],
  },
  {
    banid: '1023',
    name: 'MoneyGlitcher',
    reason: 'Exploiting money glitch',
    banner: 'system',
    expire: -1,
    expireString: 'Permanent',
    identifiers: ['license:vvvv5555', 'steam:1100001cdcdcd'],
  },
  {
    banid: '1024',
    name: 'NewbieGriefer',
    reason: 'Targeting and killing new players',
    banner: 'admin_carol',
    expire: Math.floor(Date.now() / 1000) + 7 * 86400,
    expireString: '7 days',
    identifiers: ['license:wwww6666'],
  },
  {
    banid: '1025',
    name: 'RuleBender',
    reason: 'Repeated rule bending and powergaming',
    banner: 'admin_dave',
    expire: Math.floor(Date.now() / 1000) + 30 * 86400,
    expireString: '1 month',
    identifiers: ['license:xxxx7777', 'discord:rulebender#7890'],
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
  {
    id: 45,
    type: 0,
    reporter: 1,
    reporterName: 'Alice Johnson',
    reported: 3,
    reportedName: 'Charlie Brown',
    reason: 'Blocking road with vehicle repeatedly',
    reportTimeFormatted: '20m ago',
  },
  {
    id: 46,
    type: 1,
    reporter: 8,
    reporterName: 'Hank Pym',
    reported: 5,
    reportedName: 'Eve Adams',
    reason: 'Emergency: player threatening self-harm IC',
    reportTimeFormatted: '25m ago',
  },
  {
    id: 47,
    type: 0,
    reporter: 2,
    reporterName: 'Bob Smith',
    reported: 7,
    reportedName: 'Grace Hopper',
    reason: 'Non-stop voice chat spam',
    reportTimeFormatted: '30m ago',
    claimed: true,
    claimedName: 'admin_bob',
  },
]

const DEMO_RESOURCES: ResourceEntry[] = [
  { name: 'EasyAdmin', state: 'started', isProtected: true },
  { name: 'essentialmode', state: 'started' },
  { name: 'async', state: 'started' },
  { name: 'mysql-async', state: 'started' },
  { name: 'ox_lib', state: 'started' },
  { name: 'ox_core', state: 'started' },
  { name: 'ox_inventory', state: 'started' },
  { name: 'ox_target', state: 'started' },
  { name: 'qb-core', state: 'stopped' },
  { name: 'qb-phone', state: 'stopped' },
  { name: 'qb-garages', state: 'stopped' },
  { name: 'qb-houses', state: 'stopped' },
  { name: 'qb-shops', state: 'started' },
  { name: 'qb-menu', state: 'started' },
  { name: 'qb-loading', state: 'started' },
  { name: 'qb-mapmarker', state: 'started' },
  { name: 'qb-radio', state: 'stopped' },
  { name: 'qb-vehicleshop', state: 'stopped' },
  { name: 'oxmysql', state: 'started' },
  { name: 'ox_serverdata', state: 'started' },
  { name: 'ox_inventory_sounds', state: 'started' },
  { name: 'skinchanger', state: 'started' },
  { name: 'loader', state: 'started' },
  { name: 'mapmanager', state: 'started' },
  { name: 'chat', state: 'started' },
  { name: 'spawnmanager', state: 'started' },
  { name: 'basic-gamemode', state: 'started' },
  { name: 'hardcap', state: 'started' },
  { name: 'rcon', state: 'started' },
  { name: 'fivem', state: 'started' },
  { name: 'instance', state: 'started' },
  { name: 'bob74_ipl', state: 'stopped' },
  { name: 'renegade-vehicle-names', state: 'started' },
  { name: 'server-dui', state: 'started' },
  { name: 'voice', state: 'started' },
]

const DEMO_RESOURCE_METADATA: Record<string, ResourceMetadata> = {
  EasyAdmin: {
    name: 'EasyAdmin',
    state: 'started',
    entries: [
      { key: 'fx_version', value: 'cerulean' },
      { key: 'game', value: 'rdr3' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'Blumlaut <blue@furfag.de>' },
      { key: 'description', value: 'EasyAdmin - Admin Menu for FiveM & RedM' },
      { key: 'repository', value: 'https://github.com/Blumlaut/EasyAdmin' },
      { key: 'version', value: '7.52' },
      { key: 'is_master', value: 'yes' },
      { key: 'lua54', value: 'yes' },
      { key: 'node_version', value: '22' },
      { key: 'provide', value: 'EasyAdmin' },
    ],
  },
  ox_lib: {
    name: 'ox_lib',
    state: 'started',
    entries: [
      { key: 'fx_version', value: 'cerulean' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'overextended' },
      { key: 'description', value: 'A library of common, utilitarian functions and a standardisations library for annotations, configs, and events.' },
      { key: 'version', value: '3.20.0' },
      { key: 'dependencies', value: '/server:4802' },
      { key: 'dependencies', value: '/gameBuild:h4' },
    ],
  },
  ox_core: {
    name: 'ox_core',
    state: 'started',
    entries: [
      { key: 'fx_version', value: 'cerulean' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'overextended' },
      { key: 'description', value: 'A lightweight resource providing events and exports for common functionality, such as a persistent and standardised user management system and player/vehicle grouping.' },
      { key: 'version', value: '0.14.0' },
      { key: 'dependencies', value: 'ox_lib' },
      { key: 'dependencies', value: 'oxmysql' },
    ],
  },
  ox_inventory: {
    name: 'ox_inventory',
    state: 'started',
    entries: [
      { key: 'fx_version', value: 'cerulean' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'overextended' },
      { key: 'description', value: 'An inventory resource for covenant framework with storage to and from internal/external databases, physical item limits and a client-side first codebase.' },
      { key: 'version', value: '2.3.1' },
      { key: 'dependencies', value: 'ox_lib' },
      { key: 'dependencies', value: 'oxmysql' },
      { key: 'ox_lib', value: 'locale' },
      { key: 'ox_lib', value: 'math' },
      { key: 'ox_lib', value: 'table' },
      { key: 'ox_lib', value: 'string' },
    ],
  },
  'qb-core': {
    name: 'qb-core',
    state: 'stopped',
    entries: [
      { key: 'fx_version', value: 'cerulean' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'qbox' },
      { key: 'description', value: 'qb-core is now qbox-core' },
      { key: 'version', value: '1.0.0' },
      { key: 'dependencies', value: 'ox_lib' },
      { key: 'dependencies', value: 'oxmysql' },
    ],
  },
  voice: {
    name: 'voice',
    state: 'started',
    entries: [
      { key: 'fx_version', value: 'bodacious' },
      { key: 'game', value: 'gta5' },
      { key: 'author', value: 'overextended' },
      { key: 'description', value: 'Server-side voice communication for FiveM with support for proximity voice, radio channels, and voice over IP.' },
      { key: 'version', value: '2.4.0' },
      { key: 'server_only', value: 'yes' },
    ],
  },
}

let mockPlayers = [...DEMO_PLAYERS]
let mockBans: BanEntry[] = [...DEMO_BANS]
let mockReports: Report[] = [...DEMO_REPORTS]
let mockResources: ResourceEntry[] = [...DEMO_RESOURCES]
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

// Convert BanEntry to BanListEntry (strip identifiers for list view)
function toBanListEntry(ban: BanEntry): BanListEntry {
  return {
    banid: ban.banid,
    name: ban.name,
    reason: ban.reason,
    expire: ban.expire,
    expireString: ban.expireString,
  }
}

// Paginate bans with optional search
function paginateBans(page: number, pageSize: number, query: string) {
  let list = mockBans.map(toBanListEntry)
  if (query) {
    const q = query.toLowerCase()
    list = list.filter(
      (b) =>
        b.banid.includes(q) ||
        (b.name ?? '').toLowerCase().includes(q) ||
        (b.reason ?? '').toLowerCase().includes(q),
    )
  }
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.max(1, Math.min(page, totalPages))
  const start = (clampedPage - 1) * pageSize
  const pageBans = list.slice(start, start + pageSize)
  return { bans: pageBans, total, page: clampedPage, pageSize, totalPages }
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

      // ---- Ban pagination (async push via NUI message, like real Lua) ----
      case 'requestBanPage': {
        const page = Number(body.page) || 1
        const pageSize = Number(body.pageSize) || 10
        const query = String(body.query || '')
        const result = paginateBans(page, pageSize, query)
        // Broadcast the paginated result via NUI message (matching real Lua flow)
        window.postMessage({ action: 'banPage', data: result }, '*')
        return jsonResponse({ success: true })
      }

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

      // ---- Reports (broadcast via NUI message, like real Lua) ----
      case 'requestReports': {
        window.postMessage({ action: 'updateReports', data: { reports: mockReports } }, '*')
        return jsonResponse({ success: true })
      }

      case 'getReportById': {
        const report = mockReports.find((r) => r.id === Number(body.id))
        return jsonResponse({ report })
      }

      case 'claimReport': {
        mockReports = mockReports.map((r) =>
          r.id === Number(body.id) ? { ...r, claimed: true, claimedName: 'admin_you' } : r,
        )
        // Push updated reports via NUI message
        window.postMessage({ action: 'updateReports', data: { reports: mockReports } }, '*')
        return toastAndReturn('Report claimed')
      }

      case 'closeReport': {
        mockReports = mockReports.filter((r) => r.id !== Number(body.id))
        window.postMessage({ action: 'updateReports', data: { reports: mockReports } }, '*')
        return toastAndReturn('Report closed')
      }

      case 'closeSimilarReports': {
        const target = mockReports.find((r) => r.id === Number(body.id))
        if (target) {
          mockReports = mockReports.filter(
            (r) => !(r.reporter === target.reporter && r.reported === target.reported),
          )
        }
        window.postMessage({ action: 'updateReports', data: { reports: mockReports } }, '*')
        return toastAndReturn('Similar reports closed')
      }

      case 'announce':
        return toastAndReturn('Announcement sent')

      case 'setGameType':
        return toastAndReturn('Gametype updated')

      case 'setMapName':
        return toastAndReturn('Map name updated')

      // ---- Resources ----
      case 'requestResources':
        return jsonResponse({ resources: mockResources, protected: 'EasyAdmin' })

      case 'requestResourceMetadata': {
        const name = body.name as string
        const metadata = DEMO_RESOURCE_METADATA[name] || {
          name,
          state: mockResources.find((r) => r.name === name)?.state || 'unknown',
          entries: [
            { key: 'fx_version', value: 'cerulean' },
            { key: 'game', value: 'gta5' },
            { key: 'version', value: '1.0.0' },
          ],
        }
        return jsonResponse({ metadata })
      }

      case 'startResource': {
        const startName = body.name as string
        mockResources = mockResources.map((r) =>
          r.name === startName ? { ...r, state: 'started' as const } : r,
        )
        return toastAndReturn(`Started ${startName}`)
      }

      case 'stopResource': {
        const stopName = body.name as string
        mockResources = mockResources.map((r) =>
          r.name === stopName ? { ...r, state: 'stopped' as const } : r,
        )
        return toastAndReturn(`Stopped ${stopName}`)
      }

      case 'setConvar':
        return toastAndReturn(`Set ${body.name}`)

      case 'requestCleanup':
        return toastAndReturn('Cleanup requested', 'info')

      case 'requestServerStats':
        return jsonResponse({
          maxPlayers: 48,
          resources: {
            total: mockResources.length,
            started: mockResources.filter((r) => r.state === 'started').length,
            stopped: mockResources.filter((r) => r.state === 'stopped').length,
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
  // Push initial reports
  window.postMessage({
    action: 'updateReports',
    data: { reports: DEMO_REPORTS },
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
