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
export interface NUIPayload {
  action: string
  data: unknown
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
