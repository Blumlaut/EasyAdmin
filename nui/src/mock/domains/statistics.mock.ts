/**
 * Mock data and handlers for the Statistics domain.
 * Covers: stats summary, daily peaks, player registry, paginated registry.
 */

import type { DailyPeak, PlayerRegistryEntry, StatsSummary } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Data pools ----

const PLAYER_FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
  'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
]
const PLAYER_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
]
const PLAYER_SUFFIXES = [
  '', '', '', '', // many have no suffix
  '_RP', '_Roleplay', '_Gamer', '_Pro', '_Official',
  '2024', '2025', 'x', 'xd', 'lol',
  '_Fivem', '_GTA', '_FiveM', '_Server',
  '1', '2', '3', '99', '007',
]

// ---- Helpers ----

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePlayerName(): string {
  const first = pick(PLAYER_FIRST_NAMES)
  const last = pick(PLAYER_LAST_NAMES)
  const suffix = pick(PLAYER_SUFFIXES)
  return `${first}${last}${suffix}`
}

function generateIdentifier(): string {
  const prefixes = ['license', 'license2', 'fivem', 'discord', 'steam']
  const prefix = pick(prefixes)
  const hex = () => Math.random().toString(36).slice(2, 12)
  if (prefix === 'steam') return `steam:1100001${hex().slice(0, 8)}`
  if (prefix === 'discord') return `discord:${Math.floor(Math.random() * 90000000000000000) + 10000000000000000}`
  if (prefix === 'fivem') return `fivem:${hex().slice(0, 8)}`
  return `${prefix}:${hex()}`
}

function generatePlayerRegistry(count: number = 100): PlayerRegistryEntry[] {
  const now = Date.now()
  const maxDaysAgo = 120 * 86400000
  const players: PlayerRegistryEntry[] = []
  const names = new Set<string>()

  for (let i = 0; i < count; i++) {
    let name = generatePlayerName()
    let attempts = 0
    while (names.has(name) && attempts < 20) {
      name = generatePlayerName()
      attempts++
    }
    names.add(name)

    const sessions = Math.floor(Math.random() * 200) + 1
    const avgSession = Math.floor(Math.random() * 7200) + 300 // 5min - 2h
    const playtime = sessions * avgSession + Math.floor(Math.random() * 3600)
    const firstSeenAgo = Math.floor(Math.random() * maxDaysAgo)
    const lastSeenAgo = Math.floor(Math.random() * (firstSeenAgo + 1))
    const firstSeen = now - firstSeenAgo
    const lastSeen = now - lastSeenAgo

    const identifiers = [generateIdentifier()]
    if (Math.random() > 0.5) identifiers.push(generateIdentifier())
    if (Math.random() > 0.7) identifiers.push(generateIdentifier())

    players.push({
      name,
      identifier: identifiers[0],
      identifiers,
      firstSeen: Math.floor(firstSeen / 1000),
      lastSeen: Math.floor(lastSeen / 1000),
      sessions,
      playtime,
    })
  }

  return players
}

function generateDailyPeaks(days: number): DailyPeak[] {
  const now = Math.floor(Date.now() / 1000)
  const dayStart = now - (now % 86400)
  const peaks: DailyPeak[] = []

  for (let i = days - 1; i >= 0; i--) {
    const day = dayStart - i * 86400
    const baseCount = 15 + Math.floor(Math.random() * 20)
    const isWeekend = (new Date(day * 1000).getDay() + 6) % 7 >= 5
    const weekendBoost = isWeekend ? Math.floor(Math.random() * 15) : 0

    const max = baseCount + weekendBoost + Math.floor(Math.random() * 10)
    const min = Math.max(0, Math.floor(max * (0.2 + Math.random() * 0.3)))
    const avg = Math.floor((max + min) / 2 + Math.random() * 5)
    const entries = Math.floor(Math.random() * 50) + 20

    peaks.push({ day, max, avg, min, entries })
  }

  return peaks
}

function generateStatsSummary(dailyPeaks: DailyPeak[], registry: PlayerRegistryEntry[]): StatsSummary {
  const totalUnique = registry.length
  const now = Date.now() / 1000
  const rangeSeconds = dailyPeaks.length * 86400
  const rangeStart = now - rangeSeconds

  const newPlayers = registry.filter((p) => p.firstSeen >= rangeStart).length
  const returningPlayers = totalUnique - newPlayers
  const retentionRate = totalUnique > 0 ? Math.round((returningPlayers / totalUnique) * 100) : 0

  const totalSessions = registry.reduce((sum, p) => sum + p.sessions, 0)
  const totalPlaytime = registry.reduce((sum, p) => sum + p.playtime, 0)
  const avgSessionLength = totalSessions > 0 ? Math.round(totalPlaytime / totalSessions) : 0
  const medianSessionLength = Math.round(avgSessionLength * (0.6 + Math.random() * 0.2))
  const shortestSession = Math.floor(Math.random() * 120) + 10
  const longestSession = Math.floor(Math.random() * 28800) + 7200

  return {
    totalUnique,
    newPlayers,
    returningPlayers,
    retentionRate,
    avgSessionLength,
    medianSessionLength,
    shortestSession,
    longestSession,
    totalSessions,
    totalPlaytime,
  }
}

// ---- Persistent generated data ----

const GENERATED_REGISTRY = generatePlayerRegistry(100)

function generatePeaksForRange(range: '7d' | '30d' | '90d' | '120d'): DailyPeak[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 120
  return generateDailyPeaks(days)
}

// ---- Handlers ----

async function handleRequestStatsSummary(body: Record<string, unknown>): Promise<Response> {
  const statsRange = (body.range as '7d' | '30d' | '90d' | '120d') || '30d'
  const peaks = generatePeaksForRange(statsRange)
  const summary = generateStatsSummary(peaks, GENERATED_REGISTRY)
  setTimeout(() => {
    window.postMessage({ action: 'statsSummary', data: summary }, '*')
  }, 150)
  return jsonResponse({ success: true })
}

async function handleRequestDailyPeaks(body: Record<string, unknown>): Promise<Response> {
  const statsRange = (body.range as '7d' | '30d' | '90d' | '120d') || '30d'
  const peaks = generatePeaksForRange(statsRange)
  setTimeout(() => {
    window.postMessage({ action: 'dailyPeaks', data: peaks }, '*')
  }, 200)
  return jsonResponse({ success: true })
}

async function handleRequestPlayerRegistry(body: Record<string, unknown>): Promise<Response> {
  const filterDays = Number(body.filterDays) || 120
  const now = Date.now() / 1000
  const cutoff = now - filterDays * 86400
  const filtered = GENERATED_REGISTRY.filter((p) => p.firstSeen >= cutoff)
  setTimeout(() => {
    window.postMessage({ action: 'playerRegistry', data: filtered }, '*')
  }, 250)
  return jsonResponse({ success: true })
}

async function handleRequestPlayerRegistryPage(body: Record<string, unknown>): Promise<Response> {
  const page = Number(body.page) || 1
  const pageSize = Number(body.pageSize) || 20
  const query = String(body.query || '').toLowerCase()
  const sortBy = String(body.sortBy || 'lastSeen')
  const filterDays = Number(body.filterDays) || 120
  const now = Date.now() / 1000
  const cutoff = now - filterDays * 86400

  let filtered = GENERATED_REGISTRY.filter((p) => p.firstSeen >= cutoff)
  if (query) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(query))
  }

  if (sortBy === 'sessions') {
    filtered = [...filtered].sort((a, b) => b.sessions - a.sessions)
  } else if (sortBy === 'playtime') {
    filtered = [...filtered].sort((a, b) => b.playtime - a.playtime)
  } else {
    filtered = [...filtered].sort((a, b) => b.lastSeen - a.lastSeen)
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.max(1, Math.min(page, totalPages))
  const start = (clampedPage - 1) * pageSize
  const pagePlayers = filtered.slice(start, start + pageSize)

  setTimeout(() => {
    window.postMessage({
      action: 'playerRegistryPage',
      data: { players: pagePlayers, total, page: clampedPage, pageSize, totalPages },
    }, '*')
  }, 150)
  return jsonResponse({ success: true })
}

export const statisticsMock: DomainMock = {
  handlers: {
    requestStatsSummary: handleRequestStatsSummary,
    requestDailyPeaks: handleRequestDailyPeaks,
    requestPlayerRegistry: handleRequestPlayerRegistry,
    requestPlayerRegistryPage: handleRequestPlayerRegistryPage,
  },
}
