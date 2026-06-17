/**
 * Mock data and handlers for the Bans domain.
 * Covers: ban list pagination, ban detail, edit ban, unban.
 */

import type { BanEntry, BanListEntry } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse, toastAndReturn } from '../types'
import { mockToasts } from './players.mock'

// ---- Demo Data ----

export const DEMO_BANS: BanEntry[] = [
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

// ---- Mutable state ----

let mockBans: BanEntry[] = [...DEMO_BANS]

// ---- Helpers ----

function toBanListEntry(ban: BanEntry): BanListEntry {
  return {
    banid: ban.banid,
    name: ban.name,
    reason: ban.reason,
    expire: ban.expire,
    expireString: ban.expireString,
  }
}

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

// ---- Handlers ----

async function handleRequestBanPage(body: Record<string, unknown>): Promise<Response> {
  const page = Number(body.page) || 1
  const pageSize = Number(body.pageSize) || 10
  const query = String(body.query || '')
  const result = paginateBans(page, pageSize, query)
  window.postMessage({ action: 'banPage', data: result }, '*')
  return jsonResponse({ success: true })
}

async function handleRequestBanList(): Promise<Response> {
  return jsonResponse({ bans: mockBans })
}

async function handleGetBanById(body: Record<string, unknown>): Promise<Response> {
  const ban = mockBans.find((b) => b.banid === String(body.banid))
  // Push via NUI message (matching real Lua flow: banDetailResult handler)
  setTimeout(() => {
    window.postMessage({ action: 'banDetail', data: { ban } }, '*')
  }, 50)
  return jsonResponse({ success: true })
}

async function handleEditBan(body: Record<string, unknown>): Promise<Response> {
  mockBans = mockBans.map((b) => (b.banid === body.banid ? { ...b, ...body } : b))
  return toastAndReturn('Ban updated', 'success', {}, mockToasts)
}

async function handleUnbanPlayer(body: Record<string, unknown>): Promise<Response> {
  mockBans = mockBans.filter((b) => b.banid !== body.banid)
  return toastAndReturn('Player unbanned', 'success', {}, mockToasts)
}

async function handleRefreshBanList(): Promise<Response> {
  return jsonResponse({ success: true })
}

export const bansMock: DomainMock = {
  handlers: {
    requestBanPage: handleRequestBanPage,
    requestBanList: handleRequestBanList,
    getBanById: handleGetBanById,
    editBan: handleEditBan,
    unbanPlayer: handleUnbanPlayer,
    refreshBanList: handleRefreshBanList,
  },
}
