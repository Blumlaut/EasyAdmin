import { useState, useCallback, useEffect, useRef } from 'react'
import type { Player, Permissions, Notification } from './types'
import { on, callLua } from './fivem'
import { Icon } from './components/icons'
import { Navigation, type NavItem } from './components/Navigation'
import { PlayerList } from './components/PlayerList'
import { PlayerActions } from './components/PlayerActions'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'

type View = 'main' | 'players' | 'player-detail'

interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
}

const NAV_ITEMS: NavItem[] = [
  { id: 'main', label: 'Dashboard', icon: 'home' },
  { id: 'players', label: 'Players', icon: 'users' },
  { id: 'bans', label: 'Ban List', icon: 'ban', disabled: true },
  { id: 'reports', label: 'Reports', icon: 'alert-triangle', disabled: true },
  { id: 'server', label: 'Server', icon: 'server', disabled: true },
  { id: 'settings', label: 'Settings', icon: 'settings', disabled: true },
]

function App() {
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<View>('main')
  const [players, setPlayers] = useState<Player[]>([])
  const [permissions, setPermissions] = useState<Permissions>({})
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [playersFetched, setPlayersFetched] = useState(false)
  const loading = view === 'players' && !playersFetched
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [toast, setToast] = useState<Notification | null>(null)
  const viewHistoryRef = useRef<View[]>([])

  // Listen for menu open/close
  useEffect(() => {
    on<{ visible: boolean }>('menuToggle', (data) => {
      setVisible(data.visible)
      if (data.visible) {
        setView('main')
        setSelectedPlayer(null)
        setSearchQuery('')
        viewHistoryRef.current = []
      }
    })
  }, [])

  // Listen for player list updates
  useEffect(() => {
    on<{ players: Player[]; permissions: Permissions }>('updatePlayers', (data) => {
      setPlayers(data.players)
      setPermissions(data.permissions)
      setPlayersFetched(true)
    })
  }, [])

  // Listen for notifications from Lua
  useEffect(() => {
    on<Notification>('notification', (data) => {
      setToast(data)
      setTimeout(() => setToast(null), 3000)
    })
  }, [])

  // Listen for single player updates (frozen/muted state changed)
  useEffect(() => {
    on<Player>('playerUpdated', (data) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))
      )
      if (selectedPlayer?.id === data.id) {
        setSelectedPlayer((prev) => (prev ? { ...prev, ...data } : null))
      }
    })
  }, [selectedPlayer?.id])

  const showToast = useCallback((text: string, type: Notification['type'] = 'info') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const navigateTo = useCallback((newView: View) => {
    if (view !== 'main') {
      viewHistoryRef.current.push(view)
    }
    setView(newView)
    if (newView !== 'players') {
      setPlayersFetched(false)
    }
  }, [view])

  const goBack = useCallback(() => {
    const previous = viewHistoryRef.current.pop()
    if (previous) {
      setView(previous)
    } else {
      setView('main')
      setSelectedPlayer(null)
    }
  }, [])

  const selectPlayer = useCallback((player: Player) => {
    setSelectedPlayer(player)
    navigateTo('player-detail')
  }, [navigateTo])

  const openConfirm = useCallback((title: string, message: string, onConfirmFn: () => void) => {
    setConfirm({ title, message, onConfirm: onConfirmFn })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirm(null)
  }, [])

  // Request player list when navigating to players view
  useEffect(() => {
    if (view === 'players' && players.length === 0) {
      callLua('requestPlayers').finally(() => setPlayersFetched(true))
    }
  }, [view, players.length])

  // Handle ESC key to close menu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        callLua('closeMenu').catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible])

  // Derive active nav ID from current view
  const activeNavId = view === 'player-detail' ? 'players' : view

  if (!visible) return null

  return (
    <div className="flex w-full h-full absolute top-0 left-0">
      {/* Sidebar */}
      <aside className="glass sidebar">
        {/* Logo header */}
        <div className="sidebar-header">
          <img src="/logo.png" alt="EasyAdmin" className="sidebar-logo" />
          <div>
            <h1 className="text-lg font-bold sidebar-title">
              EasyAdmin
            </h1>
            <p className="text-xs text-muted">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <Navigation
            items={[
              ...NAV_ITEMS.map((item) => ({
                ...item,
                badge: item.id === 'players' ? players.length : item.badge,
              })),
            ]}
            activeId={activeNavId}
            onSelect={(id) => {
              if (id === 'players') {
                navigateTo('players')
              } else if (id === 'main') {
                navigateTo('main')
              }
            }}
          />
        </div>

        {/* Sidebar footer */}
        <div className="sidebar-footer">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Icon name="shield" size="xs" />
            <span>
              {Object.entries(permissions).filter(([, v]) => v).length} permissions active
            </span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top bar */}
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
            {getPageTitle(view, selectedPlayer)}
          </h2>
        </header>

        {/* Content */}
        <main className="glass main-content">
          {view === 'main' && (
            <DashboardView
              onNavigate={navigateTo}
              playerCount={players.length}
            />
          )}
          {view === 'players' && (
            <PlayerList
              players={players}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectPlayer={selectPlayer}
            />
          )}
          {view === 'player-detail' && selectedPlayer && (
            <PlayerActions
              player={selectedPlayer}
              permissions={permissions}
              onConfirm={openConfirm}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Confirmation dialog */}
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

      {/* Toast notification */}
      {toast && <Toast message={toast.text} type={toast.type} />}
    </div>
  )
}

function getPageTitle(view: View, player: Player | null): string {
  if (view === 'main') return 'Dashboard'
  if (view === 'players') return 'Player Management'
  if (view === 'player-detail' && player) return player.name
  return 'Dashboard'
}

// Dashboard view (main screen)
function DashboardView({
  onNavigate,
  playerCount,
}: {
  onNavigate: (view: 'main' | 'players' | 'player-detail') => void
  playerCount: number
}) {
  return (
    <div className="page-container max-w-lg">
      {/* Welcome card */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Icon name="shield" size="lg" className="text-accent-blue" />
          <div>
            <h3 className="text-xl font-semibold">Welcome to EasyAdmin</h3>
            <p className="text-sm text-secondary mt-1">
              Select an option from the sidebar to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => onNavigate('players')}
          >
            <Icon name="users" size="sm" />
            Player Management
            {playerCount > 0 && (
              <span className="badge badge-online">{playerCount} online</span>
            )}
          </button>
        </div>
      </div>

      {/* Coming soon sections */}
      <div className="flex flex-col gap-2">
        <ComingSoonCard icon="server" title="Server Management" />
        <ComingSoonCard icon="ban" title="Ban List" />
        <ComingSoonCard icon="settings" title="Settings" />
      </div>
    </div>
  )
}

function ComingSoonCard({ icon, title }: { icon: IconName; title: string }) {
  return (
    <div className="card coming-soon">
      <div className="flex items-center gap-3">
        <Icon name={icon} size="sm" className="text-muted" />
        <span className="text-sm text-muted">{title}</span>
        <span className="badge badge-default ml-auto">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

import type { IconName } from './components/icons'

export default App
