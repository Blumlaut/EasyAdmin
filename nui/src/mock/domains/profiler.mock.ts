/**
 * Mock data and handlers for the Profiler domain.
 * Covers: profile capture (with progress), profile results, and code snippets.
 */

import type { CodeSnippet, ParsedProfile, ProfilerDetection, ProfilerProgress, ResourceTickData, ThreadTickData } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Helpers ----

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function broadcastProgress(progress: ProfilerProgress) {
  window.postMessage({ action: 'profilerProgress', data: progress }, '*')
}

function broadcastResult(profile: ParsedProfile, detection: ProfilerDetection) {
  window.postMessage({ action: 'profilerResult', data: { profile, detection } }, '*')
}

function broadcastSnippetResult(threadId: string, snippet: CodeSnippet, filePath: string, resource: string) {
  window.postMessage({
    action: 'profilerSnippetResult',
    data: { threadId, snippet, filePath, resource },
  }, '*')
}

// ---- Mock code snippets with hintable patterns ----

// Snippet 1: Event handler with TriggerServerEvent and SetTimeout
const SNIPPET_EVENT_HANDLER: CodeSnippet = {
  lines: [
    { number: 1, content: 'RegisterServerEvent("myresource:doAction", function(playerId)', highlighted: false },
    { number: 2, content: '    local src = source', highlighted: false },
    { number: 3, content: '    local playerName = GetPlayerName(playerId)', highlighted: true },
    { number: 4, content: '    local playerCoords = GetEntityCoords(GetPlayerPed(playerId))', highlighted: true },
    { number: 5, content: '', highlighted: false },
    { number: 6, content: '    -- Send notification to all players', highlighted: false },
    { number: 7, content: '    TriggerClientEvent("myresource:notifyAll", -1, playerName)', highlighted: true },
    { number: 8, content: '', highlighted: false },
    { number: 9, content: '    -- Schedule cleanup after 5 seconds', highlighted: false },
    { number: 10, content: '    SetTimeout(5000, function()', highlighted: true },
    { number: 11, content: '        local allPlayers = GetPlayers()', highlighted: true },
    { number: 12, content: '        for _, p in ipairs(allPlayers) do', highlighted: true },
    { number: 13, content: '            local dist = GetDistanceBetweenCoords(playerCoords, GetEntityCoords(GetPlayerPed(p)))', highlighted: true },
    { number: 14, content: '            if dist < 50 then', highlighted: false },
    { number: 15, content: '                TriggerClientEvent("myresource:nearby", p, playerName)', highlighted: true },
    { number: 16, content: '            end', highlighted: false },
    { number: 17, content: '        end', highlighted: false },
    { number: 18, content: '    end)', highlighted: false },
    { number: 19, content: 'end)', highlighted: false },
  ],
  windowStart: 1,
  windowEnd: 19,
  targetRange: '3..18',
}

// Snippet 2: Loop with expensive operations
const SNIPPET_EXPENSIVE_LOOP: CodeSnippet = {
  lines: [
    { number: 40, content: 'Citizen.CreateThread(function()', highlighted: false },
    { number: 41, content: '    while true do', highlighted: false },
    { number: 42, content: '        Citizen.Wait(1000)', highlighted: true },
    { number: 43, content: '', highlighted: false },
    { number: 44, content: '        local vehicles = GetAllVehicles()', highlighted: true },
    { number: 45, content: '        for _, vehicle in ipairs(vehicles) do', highlighted: true },
    { number: 46, content: '            local coords = GetEntityCoords(vehicle)', highlighted: true },
    { number: 47, content: '            local closest = GetClosestPlayer(coords.x, coords.y, coords.z)', highlighted: true },
    { number: 48, content: '            if closest then', highlighted: false },
    { number: 49, content: '                local data = json.encode({', highlighted: true },
    { number: 50, content: '                    vehicle = vehicle,', highlighted: false },
    { number: 51, content: '                    player = closest,', highlighted: false },
    { number: 52, content: '                })', highlighted: false },
    { number: 53, content: '                PerformHttpRequest("https://api.example.com/log", function()', highlighted: true },
    { number: 54, content: '                    -- log vehicle proximity', highlighted: false },
    { number: 55, content: '                end, "POST", data)', highlighted: false },
    { number: 56, content: '            end', highlighted: false },
    { number: 57, content: '        end', highlighted: false },
    { number: 58, content: '    end', highlighted: false },
    { number: 59, content: 'end)', highlighted: false },
  ],
  windowStart: 40,
  windowEnd: 59,
  targetRange: '42..57',
}

// Snippet 3: NUI callbacks with JSON operations
const SNIPPET_NUI_CALLBACKS: CodeSnippet = {
  lines: [
    { number: 100, content: 'RegisterNUICallback("getData", function(data, cb)', highlighted: false },
    { number: 101, content: '    local result = LoadResourceFile("myresource", "data.json")', highlighted: true },
    { number: 102, content: '    if result then', highlighted: false },
    { number: 103, content: '        local parsed = json.decode(result)', highlighted: true },
    { number: 104, content: '        SendNUIMessage({', highlighted: true },
    { number: 105, content: '            type = "dataUpdate",', highlighted: false },
    { number: 106, content: '            payload = parsed,', highlighted: false },
    { number: 107, content: '        })', highlighted: false },
    { number: 108, content: '        cb({ success = true })', highlighted: false },
    { number: 109, content: '    else', highlighted: false },
    { number: 110, content: '        cb({ success = false })', highlighted: false },
    { number: 111, content: '    end', highlighted: false },
    { number: 112, content: 'end)', highlighted: false },
    { number: 113, content: '', highlighted: false },
    { number: 114, content: 'SetInterval(function()', highlighted: true },
    { number: 115, content: '    local state = GetResourceState("target-resource")', highlighted: true },
    { number: 116, content: '    if state == "started" then', highlighted: false },
    { number: 117, content: '        TriggerEvent("myresource:checkStatus")', highlighted: true },
    { number: 118, content: '    end', highlighted: false },
    { number: 119, content: 'end, 5000)', highlighted: false },
  ],
  windowStart: 100,
  windowEnd: 119,
  targetRange: '101..118',
}

// Snippet 4: Player management with identifier lookups
const SNIPPET_PLAYER_MGMT: CodeSnippet = {
  lines: [
    { number: 200, content: 'local playerCache = {}', highlighted: false },
    { number: 201, content: '', highlighted: false },
    { number: 202, content: 'RegisterNetEvent("esx:playerLoaded", function(player)', highlighted: false },
    { number: 203, content: '    local src = source', highlighted: false },
    { number: 204, content: '    local identifier = GetPlayerIdentifier(src)', highlighted: true },
    { number: 205, content: '    local name = GetPlayerName(src)', highlighted: true },
    { number: 206, content: '    local ped = GetPlayerPed(src)', highlighted: true },
    { number: 207, content: '', highlighted: false },
    { number: 208, content: '    playerCache[identifier] = {', highlighted: false },
    { number: 209, content: '        name = name,', highlighted: false },
    { number: 210, content: '        ped = ped,', highlighted: false },
    { number: 211, content: '        loaded = true,', highlighted: false },
    { number: 212, content: '    }', highlighted: false },
    { number: 213, content: '', highlighted: false },
    { number: 214, content: '    for k, v in pairs(playerCache) do', highlighted: true },
    { number: 215, content: '        table.insert(v, { key = k })', highlighted: true },
    { number: 216, content: '    end', highlighted: false },
    { number: 217, content: 'end)', highlighted: false },
  ],
  windowStart: 200,
  windowEnd: 217,
  targetRange: '204..216',
}

// Snippet mapping: thread label -> snippet info
const SNIPPET_MAP: Record<string, { snippet: CodeSnippet; filePath: string; resource: string }> = {
  'server/events.lua[1..19]': { snippet: SNIPPET_EVENT_HANDLER, filePath: 'server/events.lua', resource: 'myresource' },
  'server/loops.lua[40..59]': { snippet: SNIPPET_EXPENSIVE_LOOP, filePath: 'server/loops.lua', resource: 'proximity-tracker' },
  'server/nui.lua[100..119]': { snippet: SNIPPET_NUI_CALLBACKS, filePath: 'server/nui.lua', resource: 'myresource' },
  'server/players.lua[200..217]': { snippet: SNIPPET_PLAYER_MGMT, filePath: 'server/players.lua', resource: 'es_extended' },
}

// ---- Mock profile data ----

function buildMockThreads(resource: string): ThreadTickData[] {
  if (resource === 'myresource') {
    return [
      {
        label: 'thread @myresource/server/events.lua[1..19]',
        resource: 'myresource',
        filePath: 'server/events.lua',
        lineRange: '1..19',
        durationUs: 185.4,
      },
      {
        label: 'thread @myresource/server/nui.lua[100..119]',
        resource: 'myresource',
        filePath: 'server/nui.lua',
        lineRange: '100..119',
        durationUs: 92.7,
      },
    ]
  }
  if (resource === 'proximity-tracker') {
    return [
      {
        label: 'thread @proximity-tracker/server/loops.lua[40..59]',
        resource: 'proximity-tracker',
        filePath: 'server/loops.lua',
        lineRange: '40..59',
        durationUs: 312.6,
      },
    ]
  }
  if (resource === 'es_extended') {
    return [
      {
        label: 'thread @es_extended/server/players.lua[200..217]',
        resource: 'es_extended',
        filePath: 'server/players.lua',
        lineRange: '200..217',
        durationUs: 67.3,
      },
    ]
  }
  return []
}

function buildMockProfile(): ParsedProfile {
  const resources: ResourceTickData[] = [
    {
      name: 'proximity-tracker',
      tickCount: 200,
      totalUs: 62520,
      avgUs: 312.6,
      maxUs: 489.2,
      minUs: 198.4,
      pctOfTotal: 42.3,
      threads: buildMockThreads('proximity-tracker'),
    },
    {
      name: 'myresource',
      tickCount: 200,
      totalUs: 55620,
      avgUs: 278.1,
      maxUs: 412.8,
      minUs: 156.3,
      pctOfTotal: 37.9,
      threads: buildMockThreads('myresource'),
    },
    {
      name: 'es_extended',
      tickCount: 200,
      totalUs: 13460,
      avgUs: 67.3,
      maxUs: 128.5,
      minUs: 34.2,
      pctOfTotal: 9.1,
      threads: buildMockThreads('es_extended'),
    },
    {
      name: 'ox_lib',
      tickCount: 200,
      totalUs: 8900,
      avgUs: 44.5,
      maxUs: 89.1,
      minUs: 12.3,
      pctOfTotal: 6.0,
      threads: [],
    },
    {
      name: 'EasyAdmin',
      tickCount: 200,
      totalUs: 3100,
      avgUs: 15.5,
      maxUs: 42.7,
      minUs: 5.1,
      pctOfTotal: 2.1,
      threads: [],
    },
  ]

  return {
    summary: {
      framesCaptured: 200,
      frameTimes: {
        avgMs: 5.2,
        minMs: 3.8,
        maxMs: 12.4,
        fps: 192.3,
      },
      totalTickTime: {
        avgUs: 147.9,
        maxUs: 678.3,
      },
    },
    resources,
    capturedAt: Date.now(),
  }
}

// ---- Handlers ----

async function handleStartProfiler(body: Record<string, unknown>): Promise<Response> {
  const frames = (body.frames as number) ?? 100

  // Simulate progressive profiling phases
  broadcastProgress({ phase: 'recording', message: `Recording ${frames} frames...`, percent: 5 })
  await sleep(600)

  broadcastProgress({ phase: 'recording', message: `Captured ${Math.floor(frames * 0.3)} / ${frames} frames`, percent: 30 })
  await sleep(500)

  broadcastProgress({ phase: 'recording', message: `Captured ${Math.floor(frames * 0.7)} / ${frames} frames`, percent: 65 })
  await sleep(400)

  broadcastProgress({ phase: 'recording', message: `Captured ${frames} / ${frames} frames`, percent: 90 })
  await sleep(200)

  broadcastProgress({ phase: 'generating', message: 'Generating profile report...', percent: 92 })
  await sleep(300)

  broadcastProgress({ phase: 'fetching', message: 'Fetching tick data...', percent: 95 })
  await sleep(200)

  broadcastProgress({ phase: 'parsing', message: 'Parsing results...', percent: 98 })
  await sleep(200)

  const profile = buildMockProfile()
  const detection: ProfilerDetection = { method: 'GetCurrentServerEndpoint', port: 30120 }

  broadcastProgress({ phase: 'complete', message: 'Profile complete!', percent: 100 })
  broadcastResult(profile, detection)

  return jsonResponse({ success: true })
}

async function handleProfilerGetSnippet(body: Record<string, unknown>): Promise<Response> {
  const label = body.label as string

  // Extract file path and line range from label like "thread @resource/file.lua[1..19]"
  const match = label.match(/@[^/]+\/(.+?)\[(\d+\.\.\d+)\]/)
  if (match) {
    const key = `${match[1]}[${match[2]}]`
    const entry = SNIPPET_MAP[key]
    if (entry) {
      await sleep(150) // simulate file read delay
      broadcastSnippetResult(
        String(body.threadId),
        entry.snippet,
        entry.filePath,
        entry.resource,
      )
      return jsonResponse({ success: true })
    }
  }

  // Fallback: broadcast an error for unknown snippets
  window.postMessage({
    action: 'profilerSnippetError',
    data: { threadId: String(body.threadId), message: 'Source file not found' },
  }, '*')
  return jsonResponse({ success: false })
}

export const profilerMock: DomainMock = {
  handlers: {
    startProfiler: handleStartProfiler,
    profilerGetSnippet: handleProfilerGetSnippet,
  },
}
