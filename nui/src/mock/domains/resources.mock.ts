/**
 * Mock data and handlers for the Resources domain.
 * Covers: resource list, metadata, start/stop, update checks.
 */

import type { ResourceEntry, ResourceMetadata } from '../../types'
import type { DomainMock } from '../types'
import { jsonResponse } from '../types'

// ---- Resource data pools ----

const STATES: ResourceEntry['state'][] = ['started', 'stopped', 'starting', 'missing']
const FX_VERSIONS = ['cerulean', 'bodacious', 'grace', 'drake']
const GAMES = ['gta5', 'rdr3']
const AUTHORS = [
  'overextended', 'qbcore-framework', 'overextended', 'overextended',
  'tobiasherzog', 'kaiz custom scripts', 'vorp-core', 'esx-framework',
  'blaine', 'przemyslawbanach', 'ovt', 'project-error', 'misfits',
  'd-fens', 'blackbird', 'pabloferro', 'james', 'your own server dev',
  'some-github-user', 'fx-server', 'cfx',
]
const RESOURCE_PREFIXES = [
  'esx', 'qb', 'ox', 'vorp', 'nd', 'ps', 'cr', 'st', 'rp', 'lc',
  'my', 'custom', 'server', 'core', 'ui', 'hud', 'menu', 'system',
  'game', 'map', 'prop', 'vehicle', 'ped', 'weapon', 'job', 'biz',
  'house', 'garage', 'shop', 'bank', 'phone', 'radio', 'music',
  'voice', 'chat', 'admin', 'mod', 'anti', 'blip', 'marker',
  'spawn', 'death', 'wast', 'hospital', 'police', 'fire', 'ems',
  'mechanic', 'realestate', 'clothing', 'barber', 'tattoo', 'salon',
  'tuner', 'impound', 'towing', 'traffic', 'light', 'speed',
  'race', 'deathmatch', 'army', 'gang', 'crime', 'heist', 'robbery',
  'casino', 'minigame', 'fishing', 'hunting', 'farming', 'mining',
  'drugs', 'cooking', 'crafting', 'trading', 'auction', 'market',
  'notification', 'progress', 'bar', 'target', 'context', 'dialog',
  'inventory', 'storage', 'trunk', 'drop', 'throw', 'pickup',
  'animation', 'cam', 'effect', 'weather', 'time', 'clock',
  'weather', 'ambient', 'sound', 'music', 'radio', 'stream',
  'loader', 'config', 'init', 'setup', 'bootstrap', 'dependency',
]
const RESOURCE_SUFFIXES = [
  'core', 'shared', 'client', 'server', 'html', 'ui', 'fx',
  'common', 'base', 'main', 'menu', 'hud', 'status', 'info',
  'system', 'manager', 'handler', 'controller', 'service', 'lib',
  'util', 'helper', 'tools', 'addon', 'extension', 'extra', 'plus',
  'pro', 'ultimate', 'advanced', 'ultimate', 'lite', 'mini', 'max',
  'reborn', 'revamped', 'remake', 'rewrite', 'v2', 'v3', 'next',
  'original', 'classic', 'legacy', 'legacy',
]
const DESCRIPTIONS = [
  'A core framework resource providing essential server functionality.',
  'Client-side UI component for player interactions.',
  'Server-side resource handling game mechanics and events.',
  'A shared library providing common utilities and exports.',
  'Handles player jobs and associated functionality.',
  'Manages vehicle spawning, despawning, and persistence.',
  'Provides a customizable HUD with player status indicators.',
  'An inventory system with drag-and-drop support.',
  'Voice chat implementation with proximity and radio channels.',
  'A menu system for in-game radial and context menus.',
  'Handles housing and property management for players.',
  'Garage and vehicle storage management system.',
  'Shop system for buying and selling items.',
  'Phone application with messaging and contacts.',
  'Radio station manager with custom track support.',
  'Animation controller for player and vehicle animations.',
  'Weather and time control system for roleplay servers.',
  'Blip and marker manager for map elements.',
  'Spawn point manager with customizable locations.',
  'Death and respawn handling with blood money system.',
  'Hospital and medical system with injury mechanics.',
  'Police job with MDT, handcuffs, and jail functionality.',
  'Fire department job with extinguisher and rescue tools.',
  'EMS job with ambulance driving and patient transport.',
  'Mechanic job with vehicle repair and modification.',
  'Real estate system for buying and selling properties.',
  'Clothing store with custom outfit saving.',
  'Barber shop with hairstyle and color customization.',
  'Tattoo parlor with custom tattoo placement.',
  'Vehicle tuning and modification workshop.',
  'Impound lot for seized and parked vehicles.',
  'Towing service for vehicle recovery.',
  'Traffic light controller with customizable timing.',
  'Speed camera and traffic violation system.',
  'Racing system with checkpoints and leaderboards.',
  'Deathmatch mode with weapon spawning and scoring.',
  'Military faction with bases and vehicles.',
  'Gang territory system with turf wars.',
  'Heist planning and execution framework.',
  'Casino and gambling mini-game collection.',
  'Fishing mini-game with various species.',
  'Hunting system with animal spawns and trophies.',
  'Farming system with crops and livestock.',
  'Mining system with ore extraction and processing.',
  'Drug manufacturing and distribution chain.',
  'Cooking and food preparation system.',
  'Crafting system with recipes and materials.',
  'Trading post for player-to-player item exchange.',
  'Auction house for timed item sales.',
  'Market system for global item pricing.',
  'Notification system with toast and banner support.',
  'Progress bar system for actions and loading.',
  'Target system for interactive object highlighting.',
  'Context menu system for right-click interactions.',
  'Dialog system for in-game prompts and forms.',
  'Storage unit management for personal items.',
  'Vehicle trunk access and management.',
  'Item dropping and throwing mechanics.',
  'Pickup system for ground items and entities.',
  'Sound effect manager for ambient and UI sounds.',
  'Music player with playlist support.',
  'Stream manager for external media playback.',
  'Resource loader with dependency resolution.',
  'Configuration manager for server settings.',
  'Initialization resource for server bootstrap.',
  'Setup wizard for new server configuration.',
  'Bootstrap resource for framework initialization.',
  'Dependency manager for resource ordering.',
]
const REPOSITORIES = [
  'https://github.com/overextended/ox_lib',
  'https://github.com/overextended/ox_core',
  'https://github.com/overextended/ox_inventory',
  'https://github.com/overextended/voice',
  'https://github.com/qbcore-framework/qb-core',
  'https://github.com/esx-framework/esx_core',
  'https://github.com/vorp-core/framework',
  'https://github.com/project-error/error',
  'https://github.com/d-fens/base',
  null, null, null,
]

// Well-known resources that should always be present
const WELL_KNOWN_RESOURCES: ResourceEntry[] = [
  {
    name: 'EasyAdmin',
    state: 'started',
    isProtected: true,
    version: '7.52',
    description: 'EasyAdmin - Admin Menu for FiveM & RedM',
    repository: 'https://github.com/Blumlaut/EasyAdmin',
  },
  { name: 'mapmanager', state: 'started' },
  { name: 'chat', state: 'started' },
  { name: 'spawnmanager', state: 'started' },
  { name: 'basic-gamemode', state: 'started' },
  { name: 'hardcap', state: 'started' },
  { name: 'rcon', state: 'started' },
  { name: 'fivem', state: 'started' },
  { name: 'instance', state: 'started' },
  { name: 'loader', state: 'started' },
]

// ---- Helpers ----

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomVersion(): string {
  const major = Math.floor(Math.random() * 5)
  const minor = Math.floor(Math.random() * 20)
  const patch = Math.floor(Math.random() * 10)
  return `${major}.${minor}.${patch}`
}

function generateRandomResource(): ResourceEntry {
  const name = `${pick(RESOURCE_PREFIXES)}-${pick(RESOURCE_SUFFIXES)}`
  const state = Math.random() > 0.2 ? 'started' : pick(STATES)
  const hasVersion = Math.random() > 0.4
  const hasDescription = Math.random() > 0.3
  const hasRepository = Math.random() > 0.6

  return {
    name,
    state,
    version: hasVersion ? randomVersion() : undefined,
    description: hasDescription ? pick(DESCRIPTIONS) : undefined,
    repository: hasRepository ? pick(REPOSITORIES.filter(Boolean)) as string : undefined,
  }
}

function generateResourceMetadata(name: string, state: string): ResourceMetadata {
  const entries: { key: string; value: string }[] = [
    { key: 'fx_version', value: pick(FX_VERSIONS) },
    { key: 'game', value: pick(GAMES) },
  ]

  if (Math.random() > 0.3) entries.push({ key: 'author', value: pick(AUTHORS) })
  if (Math.random() > 0.4) entries.push({ key: 'description', value: pick(DESCRIPTIONS) })
  if (Math.random() > 0.3) entries.push({ key: 'version', value: randomVersion() })
  if (Math.random() > 0.7) entries.push({ key: 'repository', value: pick(REPOSITORIES.filter(Boolean)) as string })
  if (Math.random() > 0.8) entries.push({ key: 'is_master', value: 'yes' })
  if (Math.random() > 0.7) entries.push({ key: 'lua54', value: 'yes' })
  if (Math.random() > 0.85) entries.push({ key: 'server_only', value: 'yes' })
  if (Math.random() > 0.85) entries.push({ key: 'client_scripts', value: '@self/client.lua' })
  if (Math.random() > 0.85) entries.push({ key: 'server_scripts', value: '@self/server.lua' })
  if (Math.random() > 0.6) entries.push({ key: 'dependencies', value: pick(['ox_lib', 'oxmysql', 'mysql-async', 'es_extended', 'qb-core']) })
  if (Math.random() > 0.8) entries.push({ key: 'provide', value: name })

  return { name, state, entries }
}

function generateResources(count: number = 80): ResourceEntry[] {
  const resources = [...WELL_KNOWN_RESOURCES]
  const names = new Set(WELL_KNOWN_RESOURCES.map((r) => r.name))
  while (resources.length < count) {
    const resource = generateRandomResource()
    if (!names.has(resource.name)) {
      names.add(resource.name)
      resources.push(resource)
    }
  }
  return resources
}

// ---- Mutable state ----

const GENERATED_RESOURCES = generateResources(80)
let mockResources: ResourceEntry[] = [...GENERATED_RESOURCES]
const RESOURCE_METADATA_CACHE = new Map<string, ResourceMetadata>()

function getResourceMetadata(name: string, state: string): ResourceMetadata {
  if (!RESOURCE_METADATA_CACHE.has(name)) {
    RESOURCE_METADATA_CACHE.set(name, generateResourceMetadata(name, state))
  }
  return RESOURCE_METADATA_CACHE.get(name)!
}

function pushResourcesUpdate() {
  window.postMessage({
    action: 'updateResources',
    data: { resources: mockResources, protected: 'EasyAdmin' },
  }, '*')
}

// ---- Handlers ----

async function handleRequestResources(): Promise<Response> {
  pushResourcesUpdate()
  return jsonResponse({ resources: mockResources, protected: 'EasyAdmin' })
}

async function handleRequestResourceMetadata(body: Record<string, unknown>): Promise<Response> {
  const name = body.name as string
  const state = mockResources.find((r) => r.name === name)?.state || 'unknown'
  const metadata = getResourceMetadata(name, state)
  return jsonResponse({ metadata })
}

async function handleRequestResourceMetadataBatch(body: Record<string, unknown>): Promise<Response> {
  const names = body.names as string[]
  const metadataList = (names ?? []).map((name) => {
    const state = mockResources.find((r) => r.name === name)?.state || 'unknown'
    return getResourceMetadata(name, state)
  })
  return jsonResponse({ metadata: metadataList })
}

async function handleStartResource(body: Record<string, unknown>): Promise<Response> {
  const startName = body.name as string
  mockResources = mockResources.map((r) =>
    r.name === startName ? { ...r, state: 'started' as const } : r,
  )
  pushResourcesUpdate()
  return jsonResponse({ success: true })
}

async function handleStopResource(body: Record<string, unknown>): Promise<Response> {
  const stopName = body.name as string
  mockResources = mockResources.map((r) =>
    r.name === stopName ? { ...r, state: 'stopped' as const } : r,
  )
  pushResourcesUpdate()
  return jsonResponse({ success: true })
}

async function handleCheckResourceUpdates(body: Record<string, unknown>): Promise<Response> {
  const names = body.names as string[]
  const updates = (names ?? []).map((name) => {
    const res = mockResources.find((r) => r.name === name)
    if (!res?.repository || !res?.version) {
      return { name, latest: null, outdated: false }
    }
    if (name === 'EasyAdmin') {
      return { name, latest: '7.52', outdated: false }
    }
    const hasUpdate = Math.random() < 0.2
    if (hasUpdate) {
      const parts = res.version.split('.').map(Number)
      if (parts.length >= 2) {
        parts[1] = parts[1] + 1
      }
      return { name, latest: parts.join('.'), outdated: true }
    }
    return { name, latest: res.version, outdated: false }
  })
  return jsonResponse({ updates })
}

export const resourcesMock: DomainMock = {
  handlers: {
    requestResources: handleRequestResources,
    requestResourceMetadata: handleRequestResourceMetadata,
    requestResourceMetadataBatch: handleRequestResourceMetadataBatch,
    startResource: handleStartResource,
    stopResource: handleStopResource,
    checkResourceUpdates: handleCheckResourceUpdates,
  },
}
