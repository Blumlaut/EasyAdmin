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
  developer?: boolean
  contributor?: boolean
  coords?: { x: number; y: number; z: number }
  selfbucket?: number
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
export interface AppSettings {
  orientation: 'left' | 'middle' | 'right'
  menuWidth: number
  tts: boolean
  ttsSpeed: number
  anonymous: boolean
  showLicenses: boolean
}

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
  | 'settings'

// Ban duration preset indices
export type BanDurationPreset = 'permanent' | 'custom' | number
