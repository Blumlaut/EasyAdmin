// Player data shape sent from Lua to NUI
export interface Player {
  id: number
  name: string
  identifier?: string
  ip?: string
  discord?: string
  license?: string
  xbl?: string
  ipprivacy?: boolean
  frozen?: boolean
  muted?: boolean
  admin?: boolean
  developer?: boolean
  contributor?: boolean
  coords?: { x: number; y: number; z: number }
  selfbucket?: number
  avatar?: string
}

// Permission checks sent from Lua to NUI (mirrors the Lua permissions table)
export type Permissions = Record<string, boolean>

// Initial state sent from Lua when menu opens
export interface MenuState {
  players: Player[]
  permissions: Permissions
  redm: boolean
  menuOpen: boolean
}

// NUI message from Lua to frontend
export interface NUIPayload<T = unknown> {
  action: string
  data: T
}

// Ban duration options
export interface BanDuration {
  label: string
  time: number
}

// Notification from Lua
export interface Notification {
  text: string
  type?: 'info' | 'success' | 'error'
}

// Lightweight ban entry for list view (no identifiers, fetched from server paginated)
export interface BanListEntry {
  banid: string
  reason: string
  name?: string
  expire?: number
  expireString?: string
}

// Full ban entry with identifiers (fetched on-demand for detail/edit views)
export interface BanEntry extends BanListEntry {
  banner?: string
  identifiers: string[]
}

// Server-side paginated ban response
export interface PaginatedBanResponse {
  bans: BanListEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Cached (offline) player entry
export interface CachedPlayer {
  id: number
  name: string
  identifier?: string
  droppedTime?: number
  immune?: boolean
}

// Report entry from server
export interface Report {
  id: number
  type: 0 | 1
  reporter: number
  reporterName: string
  reported?: number
  reportedName?: string
  reason: string
  reportTimeFormatted: string
  claimed?: boolean
  claimedName?: string
}

// Cleanup options
export type CleanupType = 'cars' | 'peds' | 'props'
export type CleanupRadius = 10 | 20 | 50 | 100 | 'global'

// App settings (mirrors ea_* kvp entries)
export type SidebarMode = 'vertical' | 'horizontal'
export type SidebarDirection = 'right' | 'left' | 'down' | 'up'

export interface AppSettings {
  anonymous: boolean
  // Accessibility
  highContrast: boolean
  fontSize: number // base font size in px: 10–20, default 12
  // Layout
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
}

// Default window dimensions (used when no KVP saved size exists)
export const DEFAULT_WINDOW_SIZE = { width: 1210, height: 750 }

// Navigation views
export type View =
  | 'main'
  | 'players'
  | 'player-detail'
  | 'bans'
  | 'ban-detail'
  | 'reports'
  | 'report-detail'
  | 'cached-players'
  | 'server'
  | 'resources'
  | 'resource-detail'
  | 'profiler'
  | 'player-statistics'
  | 'server-metrics'
  | 'settings'

// Ban duration preset indices
export type BanDurationPreset = 'permanent' | 'custom' | number

// Server stats for dashboard
export interface ServerStats {
  maxPlayers: number
  resources: {
    total: number
    started: number
    stopped: number
  }
  entities: {
    vehicles: number
    peds: number
    objects: number
  }
}

// Single data point for sparkline charts
export interface PlayerCountPoint {
  timestamp: number
  count: number
}

// Time range filter for player history
export type HistoryRange = '1h' | '6h' | '24h' | '7d' | '30d' | '90d' | '120d'

// Statistics time range presets
export type StatsRange = '7d' | '30d' | '90d' | '120d'

// Player registry entry (from statistics module)
export interface PlayerRegistryEntry {
  name: string         // player username (latest known)
  identifier: string   // primary (most stable) identifier
  identifiers?: string[] // all identifiers for this player (omitted in paginated responses)
  firstSeen: number    // unix ms (paginated: unix seconds, converted on receive)
  lastSeen: number     // unix ms (paginated: unix seconds, converted on receive)
  sessions: number
  playtime: number     // seconds
}

// Server-side paginated player registry response
export interface PaginatedPlayerRegistryResponse {
  players: PlayerRegistryEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Daily aggregated player count stats
export interface DailyPeak {
  day: number          // unix epoch day (start of day, seconds)
  max: number
  avg: number
  min: number
  entries: number      // number of data points that day
}

// Summary statistics returned by server
export interface StatsSummary {
  totalUnique: number
  newPlayers: number       // firstSeen within range
  returningPlayers: number // sessions > 1 within range
  retentionRate: number    // returning / total unique (0-100)
  avgSessionLength: number // seconds (true mean of individual sessions)
  medianSessionLength: number // seconds (true median of individual sessions)
  shortestSession: number  // seconds
  longestSession: number   // seconds
  totalSessions: number
  totalPlaytime: number    // seconds
}

// Reason shortcut (from ea_addShortcut)
export interface ReasonShortcut {
  key: string
  value: string
}

// Resource entry from server (includes metadata summary)
export interface ResourceEntry {
  name: string
  state: 'started' | 'stopped' | 'starting' | 'stopping' | 'missing' | 'unknown'
  isProtected?: boolean
  version?: string
  description?: string
  repository?: string
  latestVersion?: string | null
  outdated?: boolean
}

// Resource metadata fetched via GET_RESOURCE_METADATA
export interface ResourceMetadata {
  name: string
  state: string
  entries: { key: string; value: string }[]
}

// Update check result for a single resource
export interface ResourceUpdateResult {
  name: string
  latest: string | null
  outdated: boolean
}

// ============================================================
// Profiler types
// ============================================================

// Per-thread execution data
export interface ThreadTickData {
  label: string                  // Full label: "thread @resource/file.lua[10..25]"
  resource: string               // Extracted resource name
  filePath: string               // Extracted file path (e.g. "server/admin_server.lua")
  lineRange: string              // Extracted line range (e.g. "10..25")
  durationUs: number             // This thread's execution time in μs
}

// Per-resource tick data
export interface ResourceTickData {
  name: string                   // Resource name (e.g. "EasyAdmin")
  tickCount: number              // Number of ticks across all frames
  totalUs: number                // Total time spent in ticks (μs)
  avgUs: number                  // Average tick time (μs)
  maxUs: number                  // Worst single tick (μs)
  minUs: number                  // Best single tick (μs)
  pctOfTotal: number             // Percentage of total tick time (0-100)
  threads: ThreadTickData[]      // Thread-level breakdown
}

// Profile summary statistics
export interface ProfileSummary {
  framesCaptured: number         // Total frames recorded
  frameTimes: {                  // Frame-to-frame timing
    avgMs: number                // Average frame time in ms
    minMs: number
    maxMs: number
    fps: number                  // Derived: 1000 / avgMs
  }
  totalTickTime: {               // Sum of all resource ticks per frame (avg)
    avgUs: number                // Average total tick time per frame in microseconds
    maxUs: number
  }
}

// Complete parsed profile
export interface ParsedProfile {
  summary: ProfileSummary
  resources: ResourceTickData[]  // Sorted by totalUs descending
  capturedAt: number             // Unix timestamp (ms) when profile was captured
}

// Endpoint detection info sent with results
export interface ProfilerDetection {
  method: string                 // "GetCurrentServerEndpoint" | "cached" | "convar"
  port: number
}

// Profiler progress state
export interface ProfilerProgress {
  phase: 'recording' | 'generating' | 'fetching' | 'parsing' | 'retrying' | 'complete'
  message: string
  percent: number
}

// Profiler error payload
export interface ProfilerError {
  message: string
}

// Profiler result payload (from server)
export interface ProfilerResult {
  profile: ParsedProfile
  detection: ProfilerDetection
}

// Profiler UI state
export type ProfilerUIState = 'empty' | 'recording' | 'results' | 'error' | 'endpoint-error'

// ============================================================
// Action History
// ============================================================

// Single action history entry (from Storage.addAction)
export interface ActionHistoryEntry {
  id: number               // Sequential ID
  time: number             // Unix timestamp (seconds)
  action: string           // Action type (e.g. "Ban", "Kick", "Warn")
  reason: string           // Reason text
  moderator: string        // Moderator name
  banid?: string | number  // Optional ban ID linkage
}

// ============================================================
// Admin Notes
// ============================================================

// Single admin note entry (from Storage.addNote)
export interface AdminNoteEntry {
  id: number               // Sequential ID
  time: string             // Formatted date string ("DD/MM/YYYY HH:MM")
  content: string          // Note content
  moderator: string        // Moderator name
}

// ============================================================
// Update Info
// ============================================================

// Update availability info pushed from server
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  available: boolean
}
