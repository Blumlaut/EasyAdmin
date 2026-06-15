import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AppSettings,
  BanEntry,
  CachedPlayer,
  Notification,
  Permissions,
  Player,
  Report,
  View,
} from './types'
import { on, callLua } from './fivem'
import { Icon } from './components/icons'
import { Navigation, type NavItem } from './components/Navigation'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'
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

interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  orientation: 'middle',
  menuWidth: 0,
  tts: false,
  ttsSpeed: 4,
  anonymous: false,
  showLicenses: false,
}

const TOAST_DURATION_MS = 3000

function App() {
  // Visibility & routing
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<View>('main')
  const viewHistoryRef = useRef<View[]>([])

  // Data
  const [players, setPlayers] = useState<Player[]>([])
  const [permissions, setPermissions] = useState<Permissions>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedBanId, setSelectedBanId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [isRedm, setIsRedm] = useState(false)
  const [ipPrivacy, setIpPrivacy] = useState(true)

  // UI
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [toast, setToast] = useState<Notification | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  // Settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [easterEggs, setEasterEggs] = useState<string[]>([])
  const [currentEasterEgg, setCurrentEasterEgg] = useState<string | null>(null)

  // Bump to refetch player list. The other pages lazy-load on mount
  // so we don't need refresh counters for them.
  const [playersRefresh, setPlayersRefresh] = useState(0)

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
      },
    )
  }, [])

  // updateBanList / updateReports / updateCachedPlayers are received by the
  // individual pages (which lazy-load their own data). Keep these listeners
  // as a no-op placeholder in case Lua needs to broadcast updates later.
  useEffect(() => {
    return on<{ bans: BanEntry[] }>('updateBanList', () => {})
  }, [])
  useEffect(() => {
    return on<{ players: CachedPlayer[] }>('updateCachedPlayers', () => {})
  }, [])
  useEffect(() => {
    return on<{ reports: Report[] }>('updateReports', () => {})
  }, [])

  useEffect(() => {
    return on<Notification>('notification', (data) => {
      showToast(data.text, data.type)
    })
  }, [showToast])

  useEffect(() => {
    return on<Player>('playerUpdated', (data) => {
      setPlayers((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)))
      setSelectedPlayer((prev) => (prev && prev.id === data.id ? { ...prev, ...data } : prev))
    })
  }, [])

  useEffect(() => {
    return on<{ easterEggs: string[]; currentEgg: string | null }>('initEasterEggs', (data) => {
      setEasterEggs(data.easterEggs)
      setCurrentEasterEgg(data.currentEgg)
    })
  }, [])

  useEffect(() => {
    return on<AppSettings>('initSettings', (data) => {
      setSettings((prev) => ({ ...prev, ...data }))
    })
  }, [])

  // === Navigation ===

  const navigateTo = useCallback((newView: View) => {
    setView((current) => {
      if (current !== newView) {
        viewHistoryRef.current.push(current)
      }
      return newView
    })
  }, [])

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
    navigateTo('ban-detail')
  }, [navigateTo])

  const selectReport = useCallback((reportId: number) => {
    setSelectedReportId(reportId)
    navigateTo('report-detail')
  }, [navigateTo])

  const refreshPlayers = useCallback(() => {
    setPlayersRefresh((k) => k + 1)
    callLua('requestPlayers').catch(() => {})
  }, [])

  const closeConfirm = useCallback(() => setConfirm(null), [])

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

  return (
    <div className="flex w-full h-full absolute top-0 left-0">
      <aside className="glass sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="EasyAdmin" className="sidebar-logo" />
          <div>
            <h1 className="text-lg font-bold sidebar-title">EasyAdmin</h1>
            <p className="text-xs text-muted">Admin Panel</p>
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
        <header className="glass topbar">
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
          <h2 className="text-lg font-semibold">
            {getPageTitle(view, selectedPlayer, selectedBanId, selectedReportId)}
          </h2>
        </header>

        <main className="glass main-content">
          {view === 'main' && (
            <Dashboard
              onNavigate={navigateTo}
              playerCount={players.length}
              availableViews={availableViews}
            />
          )}

          {view === 'players' && (
            <PlayerListPage
              players={players}
              loading={playersRefresh === 0 && players.length === 0}
              permissions={permissions}
              onSelectPlayer={selectPlayer}
              onOpenCached={() => navigateTo('cached-players')}
              onToast={showToast}
              onRefresh={refreshPlayers}
              refreshKey={playersRefresh}
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
            <CachedPlayersPage onToast={showToast} refreshKey={playersRefresh} />
          )}

          {view === 'bans' && (
            <BanListPage
              showLicenses={settings.showLicenses}
              ipPrivacy={ipPrivacy}
              onSelectBan={selectBan}
              onToast={showToast}
              refreshKey={playersRefresh}
            />
          )}

          {view === 'ban-detail' && selectedBanId && (
            <BanDetailPage
              banId={selectedBanId}
              ipPrivacy={ipPrivacy}
              permissions={permissions}
              onBack={goBack}
              onToast={showToast}
              onUnbanned={() => navigateTo('bans')}
            />
          )}

          {view === 'reports' && (
            <ReportListPage
              onSelectReport={selectReport}
              onToast={showToast}
              refreshKey={playersRefresh}
            />
          )}

          {view === 'report-detail' && selectedReportId && (
            <ReportDetailPage
              reportId={selectedReportId}
              permissions={permissions}
              players={players}
              onOpenPlayer={(id) => {
                const p = players.find((pl) => pl.id === id)
                if (p) selectPlayer(p)
                else showToast('Player not online', 'error')
              }}
              onRemoved={() => navigateTo('reports')}
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

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant={confirm.variant}
          onConfirm={() => {
            confirm.onConfirm()
            closeConfirm()
          }}
          onCancel={closeConfirm}
        />
      )}

      {toast && <Toast message={toast.text} type={toast.type} />}
    </div>
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
