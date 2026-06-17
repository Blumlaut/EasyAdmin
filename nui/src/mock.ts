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
  DailyPeak,
  Notification,
  Permissions,
  Player,
  PlayerRegistryEntry,
  Report,
  ResourceEntry,
  ResourceMetadata,
  StatsSummary,
} from './types'

const DEMO_PLAYERS: Player[] = [
  { id: 1, name: 'Alice Johnson', license: 'license:abc123', ip: '127.0.0.1', discord: 'alice#0001' },
  { id: 2, name: 'Bob Smith', license: 'license:def456', ip: '192.168.1.50' },
  { id: 3, name: 'Charlie Brown', license: 'license:ghi789', ip: '10.0.0.12', frozen: true },
  { id: 4, name: 'Diana Prince', license: 'license:jkl012', ip: '172.16.0.5', muted: true },
  { id: 5, name: 'Eve Adams', license: 'license:mno345', ip: '192.168.2.100' },
  { id: 6, name: 'Frank Castle', license: 'license:pqr678', ip: '10.10.10.10', admin: true, developer: true },
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
  'server.statistics.view': true,
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

// ---- Random Resource Data Generator ----

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
  null, null, null, // some resources have no repo
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

  if (Math.random() > 0.3) {
    entries.push({ key: 'author', value: pick(AUTHORS) })
  }
  if (Math.random() > 0.4) {
    entries.push({ key: 'description', value: pick(DESCRIPTIONS) })
  }
  if (Math.random() > 0.3) {
    entries.push({ key: 'version', value: randomVersion() })
  }
  if (Math.random() > 0.7) {
    entries.push({ key: 'repository', value: pick(REPOSITORIES.filter(Boolean)) as string })
  }
  if (Math.random() > 0.8) {
    entries.push({ key: 'is_master', value: 'yes' })
  }
  if (Math.random() > 0.7) {
    entries.push({ key: 'lua54', value: 'yes' })
  }
  if (Math.random() > 0.85) {
    entries.push({ key: 'server_only', value: 'yes' })
  }
  if (Math.random() > 0.85) {
    entries.push({ key: 'client_scripts', value: '@self/client.lua' })
  }
  if (Math.random() > 0.85) {
    entries.push({ key: 'server_scripts', value: '@self/server.lua' })
  }
  if (Math.random() > 0.6) {
    entries.push({ key: 'dependencies', value: pick(['ox_lib', 'oxmysql', 'mysql-async', 'es_extended', 'qb-core']) })
  }
  if (Math.random() > 0.8) {
    entries.push({ key: 'provide', value: name })
  }

  return { name, state, entries }
}

function generateResources(count: number = 80): ResourceEntry[] {
  const resources = [...WELL_KNOWN_RESOURCES]
  // Generate unique random resources
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

// Generate resources once at module load
const GENERATED_RESOURCES = generateResources(80)

// Metadata cache - generated on demand
const RESOURCE_METADATA_CACHE = new Map<string, ResourceMetadata>()

function getResourceMetadata(name: string, state: string): ResourceMetadata {
  if (!RESOURCE_METADATA_CACHE.has(name)) {
    RESOURCE_METADATA_CACHE.set(name, generateResourceMetadata(name, state))
  }
  return RESOURCE_METADATA_CACHE.get(name)!
}

// ---- Random Statistics Data Generator ----

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
    // Ensure unique names
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
      firstSeen: Math.floor(firstSeen / 1000), // unix seconds (server format)
      lastSeen: Math.floor(lastSeen / 1000),
      sessions,
      playtime,
    })
  }

  return players
}

function generateDailyPeaks(days: number): DailyPeak[] {
  const now = Math.floor(Date.now() / 1000)
  const dayStart = now - (now % 86400) // start of today
  const peaks: DailyPeak[] = []

  for (let i = days - 1; i >= 0; i--) {
    const day = dayStart - i * 86400
    // Simulate realistic player counts with some variation
    const baseCount = 15 + Math.floor(Math.random() * 20)
    const isWeekend = (new Date(day * 1000).getDay() + 6) % 7 >= 5 // Sat=5, Sun=6
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

  // Simulate median (slightly less than mean due to long-tail distribution)
  const medianSessionLength = Math.round(avgSessionLength * (0.6 + Math.random() * 0.2))
  const shortestSession = Math.floor(Math.random() * 120) + 10 // 10s - 2min
  const longestSession = Math.floor(Math.random() * 28800) + 7200 // 2h - 10h

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

// Generate a persistent registry (same across calls)
const GENERATED_REGISTRY = generatePlayerRegistry(100)

// Generate peaks on demand based on range
function generatePeaksForRange(range: '7d' | '30d' | '90d' | '120d'): DailyPeak[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 120
  return generateDailyPeaks(days)
}

let mockPlayers = [...DEMO_PLAYERS]
let mockBans: BanEntry[] = [...DEMO_BANS]
let mockReports: Report[] = [...DEMO_REPORTS]
let mockResources: ResourceEntry[] = [...GENERATED_RESOURCES]
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
      case 'requestResources': {
        // Also push via NUI message (async server push pattern)
        window.postMessage({
          action: 'updateResources',
          data: { resources: mockResources, protected: 'EasyAdmin' },
        }, '*')
        return jsonResponse({ resources: mockResources, protected: 'EasyAdmin' })
      }

      case 'requestResourceMetadata': {
        const name = body.name as string
        const state = mockResources.find((r) => r.name === name)?.state || 'unknown'
        const metadata = getResourceMetadata(name, state)
        return jsonResponse({ metadata })
      }

      case 'requestResourceMetadataBatch': {
        const names = body.names as string[]
        const metadataList = (names ?? []).map((name) => {
          const state = mockResources.find((r) => r.name === name)?.state || 'unknown'
          return getResourceMetadata(name, state)
        })
        return jsonResponse({ metadata: metadataList })
      }

      case 'startResource': {
        const startName = body.name as string
        mockResources = mockResources.map((r) =>
          r.name === startName ? { ...r, state: 'started' as const } : r,
        )
        // Push updated list via NUI message
        window.postMessage({
          action: 'updateResources',
          data: { resources: mockResources, protected: 'EasyAdmin' },
        }, '*')
        return toastAndReturn(`Started ${startName}`)
      }

      case 'stopResource': {
        const stopName = body.name as string
        mockResources = mockResources.map((r) =>
          r.name === stopName ? { ...r, state: 'stopped' as const } : r,
        )
        // Push updated list via NUI message
        window.postMessage({
          action: 'updateResources',
          data: { resources: mockResources, protected: 'EasyAdmin' },
        }, '*')
        return toastAndReturn(`Stopped ${stopName}`)
      }

      case 'checkResourceUpdates': {
        const names = body.names as string[]
        // Simulate async GitHub check - ~20% of resources with repos have updates
        const updates = (names ?? []).map((name) => {
          const res = mockResources.find((r) => r.name === name)
          if (!res?.repository || !res?.version) {
            return { name, latest: null, outdated: false }
          }
          // EasyAdmin is always on latest
          if (name === 'EasyAdmin') {
            return { name, latest: '7.52', outdated: false }
          }
          // ~20% chance of having an update available
          const hasUpdate = Math.random() < 0.2
          if (hasUpdate) {
            // Bump minor or patch version
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
        // Match the real server: timestamps are unix epoch seconds (os.time())
        // The frontend multiplies by 1000 to convert to milliseconds
        const range = body.range || '24h'
        const now = Math.floor(Date.now() / 1000)
        let span: number
        let interval: number
        if (range === '1h') { span = 3600; interval = 300 }      // 1h, 5min points
        else if (range === '6h') { span = 21600; interval = 600 } // 6h, 10min points
        else if (range === '7d') { span = 604800; interval = 900 } // 7d, 15min points
        else { span = 86400; interval = 600 }                     // 24h, 10min points
        const points = []
        for (let t = now - span; t <= now; t += interval) {
          const count = Math.floor(Math.random() * 30) + 5
          points.push({ timestamp: t, count })
        }
        return jsonResponse(points)
      }

      // ---- Statistics ----
      case 'requestStatsSummary': {
        const statsRange = (body.range as '7d' | '30d' | '90d' | '120d') || '30d'
        const peaks = generatePeaksForRange(statsRange)
        const summary = generateStatsSummary(peaks, GENERATED_REGISTRY)
        // Simulate async delay
        setTimeout(() => {
          window.postMessage({ action: 'statsSummary', data: summary }, '*')
        }, 150)
        return jsonResponse({ success: true })
      }

      case 'requestDailyPeaks': {
        const statsRange = (body.range as '7d' | '30d' | '90d' | '120d') || '30d'
        const peaks = generatePeaksForRange(statsRange)
        // Simulate async delay
        setTimeout(() => {
          window.postMessage({ action: 'dailyPeaks', data: peaks }, '*')
        }, 200)
        return jsonResponse({ success: true })
      }

      case 'requestPlayerRegistry': {
        const filterDays = Number(body.filterDays) || 120
        const now = Date.now() / 1000
        const cutoff = now - filterDays * 86400
        const filtered = GENERATED_REGISTRY.filter((p) => p.firstSeen >= cutoff)
        // Simulate async delay
        setTimeout(() => {
          window.postMessage({ action: 'playerRegistry', data: filtered }, '*')
        }, 250)
        return jsonResponse({ success: true })
      }

      case 'requestPlayerRegistryPage': {
        const page = Number(body.page) || 1
        const pageSize = Number(body.pageSize) || 20
        const query = String(body.query || '').toLowerCase()
        const sortBy = String(body.sortBy || 'lastSeen')
        const filterDays = Number(body.filterDays) || 120
        const now = Date.now() / 1000
        const cutoff = now - filterDays * 86400

        // Filter
        let filtered = GENERATED_REGISTRY.filter((p) => p.firstSeen >= cutoff)
        if (query) {
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(query))
        }

        // Sort
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

        // Simulate async delay and push via NUI message (matching real Lua flow)
        setTimeout(() => {
          window.postMessage({
            action: 'playerRegistryPage',
            data: { players: pagePlayers, total, page: clampedPage, pageSize, totalPages },
          }, '*')
        }, 150)
        return jsonResponse({ success: true })
      }

      case 'setAnonymous':
      case 'setEasterEgg':
      case 'setShowLicenses':
        return jsonResponse({ success: true })

      case 'closeMenu':
        window.postMessage({ action: 'menuToggle', data: { visible: false } }, '*')
        return jsonResponse({ success: true })

      case 'setResourceKvp':
        return jsonResponse({ success: true })

      case 'getPlayerIdentifiers': {
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
      ipprivacy: false,
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
      anonymous: false,
      highContrast: false,
      fontSize: 100,
      menuSize: 'default',
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
