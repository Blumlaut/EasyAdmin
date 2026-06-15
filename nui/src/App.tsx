import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AppSettings,
  BanEntry,
  CachedPlayer,
  CleanupType,
  Notification,
  Permissions,
  Player,
  Report,
  View,
} from './types'
import { on, callLua } from './fivem'
import { Icon } from './components/icons'
import { Navigation, type NavItem } from './components/Navigation'
import { Toast } from './components/Toast'
import { ModalProvider } from './ModalContext'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { PlayerListPage } from './pages/Players/PlayerListPage'
import { PlayerDetailPage } from './pages/Players/PlayerDetailPage'
import { CachedPlayersPage } from './pages/Players/CachedPlayersPage'
import { BanListPage } from './pages/Bans/BanListPage'
import { BanDetailPage } from './pages/Bans/BanDetailPage'
import { ReportListPage } from './pages/Reports/ReportListPage'
import { ReportDetailPage } from './pages/Reports/ReportDetailPage'
import { ServerPage } from './pages/Server/ServerPage'
import { SettingsPage } from './pages/Settings/SettingsPage'

const NAV_ITEMS: NavItem[] = [
  { id: 'main', label: 'Dashboard', icon: 'home' },
  { id: 'players', label: 'Players', icon: 'users' },
  { id: 'bans', label: 'Ban List', icon: 'ban' },
  { id: 'reports', label: 'Reports', icon: 'flag' },
  { id: 'server', label: 'Server', icon: 'server' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const DEFAULT_SETTINGS: AppSettings = {
  orientation: 'middle',
  menuWidth: 0,
  tts: false,
  ttsSpeed: 4,
  anonymous: false,
  showLicenses: false,
}

const TOAST_DURATION_MS = 3000
const CLEANUP_TYPES: CleanupType[] = ['cars', 'peds', 'props']

function App() {
  // Visibility & routing
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<View>('main')
  const viewHistoryRef = useRef<View[]>([])

  // Data — owned by App so it persists across page navigation
  const [players, setPlayers] = useState<Player[]>([])
  // Ban detail cache: populated when BanDetailPage fetches a ban by ID
  const [banDetailCache, setBanDetailCache] = useState<Record<string, BanEntry>>({})
  const [reports, setReports] = useState<Report[]>([])
  const [cachedPlayers, setCachedPlayers] = useState<CachedPlayer[]>([])
  const [permissions, setPermissions] = useState<Permissions>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedBanId, setSelectedBanId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [isRedm, setIsRedm] = useState(false)
  const [ipPrivacy, setIpPrivacy] = useState(true)

  // Loading states per data set
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingCached, setLoadingCached] = useState(false)

  // Toast
  const [toast, setToast] = useState<Notification | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  // Settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [easterEggs, setEasterEggs] = useState<string[]>([])
  const [currentEasterEgg, setCurrentEasterEgg] = useState<string | null>(null)

  // === Toast ===

  const showToast = useCallback((text: string, type: Notification['type'] = 'info') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ text, type })
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }, [])

  // === Listeners from Lua ===

  useEffect(() => {
    return on<{ visible: boolean }>('menuToggle', (data) => {
      setVisible(data.visible)
      if (data.visible) {
        setView('main')
        setSelectedPlayer(null)
        setSelectedBanId(null)
        setSelectedReportId(null)
        viewHistoryRef.current = []
      }
    })
  }, [])

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

  // Ban detail pushed from Lua events.lua banDetailResult handler
  useEffect(() => {
    return on<{ ban: BanEntry | null }>('banDetail', (data) => {
      if (data.ban && data.ban.banid) {
        setBanDetailCache((prev) => ({ ...prev, [data.ban!.banid]: data.ban! }))
      }
    })
  }, [])

  // Legacy ban list push (backward compat — BanListPage now uses server-side pagination)
  useEffect(() => {
    return on<{ bans: BanEntry[] }>('updateBanList', () => {
      // No-op: BanListPage manages its own paginated state
    })
  }, [])

  // Cached players pushed from Lua events.lua fillCachedPlayers handler
  useEffect(() => {
    return on<{ players: CachedPlayer[] }>('updateCachedPlayers', (data) => {
      setCachedPlayers(data.players ?? [])
      setLoadingCached(false)
    })
  }, [])

  // Reports pushed from Lua events.lua fillReports handler
  useEffect(() => {
    return on<{ reports: Report[] }>('updateReports', (data) => {
      setReports(data.reports ?? [])
      setLoadingReports(false)
    })
  }, [])

  // Lua notifications
  useEffect(() => {
    return on<Notification>('notification', (data) => {
      showToast(data.text, data.type)
    })
  }, [showToast])

  // Player updates (freeze/mute state pushed from Lua)
  useEffect(() => {
    return on<Player>('playerUpdated', (data) => {
      setPlayers((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)))
      setSelectedPlayer((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev))
    })
  }, [])

  // Easter eggs init
  useEffect(() => {
    return on<{ easterEggs: string[]; currentEgg: string | null }>('initEasterEggs', (data) => {
      setEasterEggs(data.easterEggs)
      setCurrentEasterEgg(data.currentEgg)
    })
  }, [])

  // Settings init
  useEffect(() => {
    return on<AppSettings>('initSettings', (data) => {
      setSettings((prev) => ({ ...prev, ...data }))
    })
  }, [])

  // === Data fetch functions ===

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

  // Track which data sets have already been fetched so we only lazy-load once
  const fetchedRef = useRef({ reports: false, cachedPlayers: false })

  // === Navigation ===

  const navigateTo = useCallback((newView: View) => {
    setView((current) => {
      if (current !== newView) {
        viewHistoryRef.current.push(current)
      }
      return newView
    })
    // Set loading synchronously so skeletons render on first paint,
    // then kick off the actual fetch in a microtask.
    if (newView === 'reports' && !fetchedRef.current.reports) {
      fetchedRef.current.reports = true
      setLoadingReports(true)
      queueMicrotask(() => fetchReports())
    }
    if (newView === 'cached-players' && !fetchedRef.current.cachedPlayers) {
      fetchedRef.current.cachedPlayers = true
      setLoadingCached(true)
      queueMicrotask(() => fetchCachedPlayers())
    }
  }, [fetchReports, fetchCachedPlayers])

  const goBack = useCallback(() => {
    const previous = viewHistoryRef.current.pop()
    if (previous) {
      setView(previous)
    } else {
      setView('main')
      setSelectedPlayer(null)
      setSelectedBanId(null)
      setSelectedReportId(null)
    }
  }, [])

  // === Derived state ===

  const activeNavId: string = (() => {
    if (view === 'player-detail' || view === 'cached-players') return 'players'
    if (view === 'ban-detail') return 'bans'
    if (view === 'report-detail') return 'reports'
    return view
  })()

  // Permission gating for nav items
  const visibleNavItems = NAV_ITEMS.map((item) => {
    let disabled = false
    if (item.id === 'bans' && !permissions['player.ban.view']) disabled = true
    if (item.id === 'reports' && !permissions['player.reports.view']) disabled = true
    if (
      item.id === 'server' &&
      !permissions['server.announce'] &&
      !permissions['server.convars'] &&
      !permissions['player.ban.view']
    ) {
      disabled = true
    }
    return { ...item, disabled }
  })

  const availableViews: View[] = ['main', 'players']
  if (permissions['player.ban.view']) availableViews.push('bans')
  if (permissions['player.reports.view']) availableViews.push('reports')
  if (
    permissions['server.announce'] ||
    permissions['server.convars'] ||
    permissions['player.ban.view']
  ) {
    availableViews.push('server')
  }
  availableViews.push('settings', 'cached-players')

  // === Handlers ===

  const selectPlayer = useCallback((player: Player) => {
    setSelectedPlayer(player)
    navigateTo('player-detail')
  }, [navigateTo])

  const selectBan = useCallback((banId: string) => {
    setSelectedBanId(banId)
    // Trigger server-side fetch for ban detail if not already cached
    if (!banDetailCache[banId]) {
      callLua('getBanById', { banid: banId }).catch(() => {})
    }
    navigateTo('ban-detail')
  }, [navigateTo, banDetailCache])

  const selectReport = useCallback((reportId: number) => {
    setSelectedReportId(reportId)
    navigateTo('report-detail')
  }, [navigateTo])

  // ESC closes the menu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        callLua('closeMenu').catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible])

  if (!visible) return null

  const closeMenu = () => callLua('closeMenu').catch(() => {})

  return (
    <>
      <ModalProvider
        cleanupTypes={CLEANUP_TYPES}
        onToast={showToast}
        onPlayersUpdated={fetchPlayers}
      >
        <div className="ea-window">
          <aside className="sidebar">
            <div className="sidebar-header">
              <img src="./logo.png" alt="EasyAdmin" className="sidebar-logo" />
              <div>
                <h1 className="text-xl font-bold sidebar-title text-gradient">EasyAdmin</h1>
                <p className="text-xs text-muted" style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '10px' }}>Admin Panel</p>
              </div>
            </div>
            <div className="sidebar-nav">
              <Navigation
                items={visibleNavItems.map((item) => ({
                  ...item,
                  badge: item.id === 'players' ? players.length : item.badge,
                }))}
                activeId={activeNavId}
                onSelect={(id) => {
                  if (id === 'main') navigateTo('main')
                  else if (id === 'players') navigateTo('players')
                  else if (id === 'bans') navigateTo('bans')
                  else if (id === 'reports') navigateTo('reports')
                  else if (id === 'server') navigateTo('server')
                  else if (id === 'settings') navigateTo('settings')
                }}
              />
            </div>
            <div className="sidebar-footer">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Icon name="shield" size="xs" />
                <span>
                  {Object.values(permissions).filter(Boolean).length} permissions active
                </span>
              </div>
            </div>
          </aside>

          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <header className="topbar">
              {view !== 'main' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={goBack}
                  aria-label="Go back"
                >
                  <Icon name="chevron-left" size="xs" />
                  Back
                </button>
              )}
              <h2 className="text-xl font-semibold" style={{ letterSpacing: '-0.01em' }}>
                {getPageTitle(view, selectedPlayer, selectedBanId, selectedReportId)}
              </h2>
              <button
                className="btn btn-ghost btn-icon btn-close ml-auto"
                onClick={closeMenu}
                aria-label="Close"
              >
                <Icon name="x" size="xs" />
              </button>
            </header>

            <main className="glass main-content">
              {view === 'main' && (
                <Dashboard playerCount={players.length} />
              )}

              {view === 'players' && (
                <PlayerListPage
                  players={players}
                  loading={loadingPlayers}
                  permissions={permissions}
                  onSelectPlayer={selectPlayer}
                  onOpenCached={() => navigateTo('cached-players')}
                  onToast={showToast}
                  onRefresh={fetchPlayers}
                />
              )}

              {view === 'player-detail' && selectedPlayer && (
                <PlayerDetailPage
                  player={selectedPlayer}
                  permissions={permissions}
                  ipPrivacy={ipPrivacy}
                  onToast={showToast}
                />
              )}

              {view === 'cached-players' && (
                <CachedPlayersPage
                  cachedPlayers={cachedPlayers}
                  loading={loadingCached}
                  onToast={showToast}
                  onRefresh={fetchCachedPlayers}
                />
              )}

              {view === 'bans' && (
                <BanListPage
                  showLicenses={settings.showLicenses}
                  ipPrivacy={ipPrivacy}
                  onSelectBan={selectBan}
                  onToast={showToast}
                />
              )}

              {view === 'ban-detail' && selectedBanId && (
                <BanDetailPage
                  banId={selectedBanId}
                  ban={banDetailCache[selectedBanId] ?? null}
                  ipPrivacy={ipPrivacy}
                  permissions={permissions}
                  onBack={goBack}
                  onToast={showToast}
                  onUnbanned={() => {
                    // BanListPage manages its own paginated state; navigate back (user can refresh if needed)
                    setBanDetailCache((prev) => {
                      const { [selectedBanId!]: _, ...rest } = prev
                      return rest
                    })
                    navigateTo('bans')
                  }}
                />
              )}

              {view === 'reports' && (
                <ReportListPage
                  reports={reports}
                  loading={loadingReports}
                  onSelectReport={selectReport}
                  onToast={showToast}
                  onRefresh={fetchReports}
                />
              )}

              {view === 'report-detail' && selectedReportId && (
                <ReportDetailPage
                  reportId={selectedReportId}
                  reports={reports}
                  permissions={permissions}
                  players={players}
                  onOpenPlayer={(id) => {
                    const p = players.find((pl) => pl.id === id)
                    if (p) selectPlayer(p)
                    else showToast('Player not online', 'error')
                  }}
                  onRemoved={() => {
                    setReports((prev) => prev.filter((r) => r.id !== selectedReportId))
                    navigateTo('reports')
                  }}
                  onToast={showToast}
                />
              )}

              {view === 'server' && (
                <ServerPage
                  permissions={permissions}
                  isRedm={isRedm}
                  onToast={showToast}
                />
              )}

              {view === 'settings' && (
                <SettingsPage
                  permissions={permissions}
                  settings={settings}
                  easterEggs={easterEggs}
                  currentEasterEgg={currentEasterEgg}
                  isRedm={isRedm}
                  onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
                  onToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      </ModalProvider>

      {toast && <Toast message={toast.text} type={toast.type} />}
    </>
  )
}

function getPageTitle(
  view: View,
  player: Player | null,
  banId: string | null,
  reportId: number | null,
): string {
  if (view === 'main') return 'Dashboard'
  if (view === 'players') return 'Player Management'
  if (view === 'player-detail' && player) return player.name
  if (view === 'cached-players') return 'Cached Players'
  if (view === 'bans') return 'Ban List'
  if (view === 'ban-detail' && banId) return `Ban ${banId}`
  if (view === 'reports') return 'Reports'
  if (view === 'report-detail' && reportId !== null) return `Report #${reportId}`
  if (view === 'server') return 'Server Management'
  if (view === 'settings') return 'Settings'
  return 'EasyAdmin'
}

export default App
