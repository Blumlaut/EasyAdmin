import { useCallback, useEffect, useState } from 'react'
import type {
  AppSettings,
  BanEntry,
  CachedPlayer,
  Permissions,
  Player,
  ReasonShortcut,
  Report,
} from '../types'
import type { WindowPosition } from './useWindowDrag'
import type { WindowSize } from './useWindowResize'
import { on, callLua } from '../fivem'

export interface AppDataResult {
  // Player data
  players: Player[]
  loadingPlayers: boolean
  setLoadingPlayers: (v: boolean) => void
  fetchPlayers: () => void

  // Ban data
  banDetailCache: Record<string, BanEntry>
  setBanDetailCache: React.Dispatch<React.SetStateAction<Record<string, BanEntry>>>

  // Report data
  reports: Report[]
  setReports: React.Dispatch<React.SetStateAction<Report[]>>
  loadingReports: boolean
  setLoadingReports: (v: boolean) => void
  fetchReports: () => void

  // Cached players
  cachedPlayers: CachedPlayer[]
  loadingCached: boolean
  setLoadingCached: (v: boolean) => void
  fetchCachedPlayers: () => void

  // Permissions & server info
  permissions: Permissions
  isRedm: boolean
  ipPrivacy: boolean

  // Settings & shortcuts
  settings: AppSettings
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
  shortcuts: ReasonShortcut[]

  // Window init data (position/size restored from KVP)
  windowPosData: WindowPosition | null
  windowSizeData: WindowSize | null
}

export function useAppData(): AppDataResult {
  // Data state
  const [players, setPlayers] = useState<Player[]>([])
  const [banDetailCache, setBanDetailCache] = useState<Record<string, BanEntry>>({})
  const [reports, setReports] = useState<Report[]>([])
  const [cachedPlayers, setCachedPlayers] = useState<CachedPlayer[]>([])
  const [permissions, setPermissions] = useState<Permissions>({})
  const [isRedm, setIsRedm] = useState(false)
  const [ipPrivacy, setIpPrivacy] = useState(true)

  // Loading states
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingCached, setLoadingCached] = useState(false)

  // Settings & shortcuts
  const [settings, setSettings] = useState<AppSettings>({
    anonymous: false,
    highContrast: false,
    fontSize: 100,
    sidebarMode: 'vertical',
    sidebarDirection: 'right',
  })
  const [shortcuts, setShortcuts] = useState<ReasonShortcut[]>([])

  // Window init data from KVP
  const [windowPosData, setWindowPosData] = useState<WindowPosition | null>(null)
  const [windowSizeData, setWindowSizeData] = useState<WindowSize | null>(null)

  // === Event listeners from Lua ===

  useEffect(() => {
    return on<{ players: Player[]; permissions: Permissions; redm?: boolean; ipprivacy?: boolean }>(
      'updatePlayers',
      (data) => {
        setPlayers(data.players)
        setPermissions(data.permissions)
        if (typeof data.redm === 'boolean') setIsRedm(data.redm)
        if (typeof data.ipprivacy === 'boolean') setIpPrivacy(data.ipprivacy)
        setLoadingPlayers(false)
      },
    )
  }, [])

  useEffect(() => {
    return on<{ ban: BanEntry | null }>('banDetail', (data) => {
      const ban = data.ban
      if (ban && ban.banid) {
        setBanDetailCache((prev) => ({ ...prev, [ban.banid]: ban }))
      }
    })
  }, [])

  // Legacy ban list push (backward compat — BanListPage now uses server-side pagination)
  useEffect(() => {
    return on<{ bans: BanEntry[] }>('updateBanList', () => {
      // No-op: BanListPage manages its own paginated state
    })
  }, [])

  useEffect(() => {
    return on<{ players: CachedPlayer[] }>('updateCachedPlayers', (data) => {
      setCachedPlayers(data.players ?? [])
      setLoadingCached(false)
    })
  }, [])

  useEffect(() => {
    return on<{ reports: Report[] }>('updateReports', (data) => {
      setReports(data.reports ?? [])
      setLoadingReports(false)
    })
  }, [])

  useEffect(() => {
    return on<Player>('playerUpdated', (data) => {
      setPlayers((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)))
    })
  }, [])

  useEffect(() => {
    return on<AppSettings>('initSettings', (data) => {
      setSettings((prev) => ({ ...prev, ...data }))
    })
  }, [])

  useEffect(() => {
    return on<WindowPosition>('initWindowPos', (data) => {
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        setWindowPosData(data)
      }
    })
  }, [])

  useEffect(() => {
    return on<WindowSize>('initWindowSize', (data) => {
      if (data && typeof data.width === 'number' && typeof data.height === 'number') {
        setWindowSizeData(data)
      }
    })
  }, [])

  useEffect(() => {
    return on<{ shortcuts: ReasonShortcut[] }>('updateShortcuts', (data) => {
      setShortcuts(data.shortcuts ?? [])
    })
  }, [])

  // === Fetch functions ===

  const fetchPlayers = useCallback(() => {
    setLoadingPlayers(true)
    callLua('requestPlayers').catch(() => setLoadingPlayers(false))
  }, [])

  const fetchReports = useCallback(() => {
    callLua('requestReports').catch(() => setLoadingReports(false))
  }, [])

  const fetchCachedPlayers = useCallback(() => {
    callLua('requestCachedPlayers').catch(() => setLoadingCached(false))
  }, [])

  return {
    players,
    loadingPlayers,
    setLoadingPlayers,
    fetchPlayers,
    banDetailCache,
    setBanDetailCache,
    reports,
    setReports,
    loadingReports,
    setLoadingReports,
    fetchReports,
    cachedPlayers,
    loadingCached,
    setLoadingCached,
    fetchCachedPlayers,
    permissions,
    isRedm,
    ipPrivacy,
    settings,
    setSettings,
    shortcuts,
    windowPosData,
    windowSizeData,
  }
}
