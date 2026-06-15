import { useState, useCallback, useEffect, useRef } from 'react'
import type { Player, Permissions, Notification } from './types'
import { on, callLua } from './fivem'
import { Navigation } from './components/Navigation'
import { PlayerList } from './components/PlayerList'
import { PlayerActions } from './components/PlayerActions'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'

type View = 'main' | 'players' | 'player-detail'

interface ConfirmRequest {
  title: string
  message: string
  onConfirm: () => void
}

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
    // Reset fetched state when leaving players view
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

  if (!visible) return null

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      position: 'absolute',
      top: 0,
      left: 0,
    }}>
      {/* Sidebar */}
      <div style={{
        width: 260,
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <h1 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            EasyAdmin
          </h1>
          <p style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginTop: 2,
          }}>
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <Navigation
          currentView={view}
          onNavigate={navigateTo}
          playerCount={players.length}
        />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        height: '100vh',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          height: 48,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          background: 'var(--bg-secondary)',
        }}>
          {view !== 'main' && (
            <button
              className="btn btn-sm"
              onClick={goBack}
              style={{ padding: '4px 10px' }}
            >
              ← Back
            </button>
          )}
          <h2 style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {view === 'main' && 'Dashboard'}
            {view === 'players' && 'Player Management'}
            {view === 'player-detail' && selectedPlayer && `[${selectedPlayer.id}] ${selectedPlayer.name}`}
          </h2>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
        }}>
          {view === 'main' && <DashboardView onSelectPlayers={() => navigateTo('players')} />}
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
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
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

// Dashboard view (main screen)
function DashboardView({ onSelectPlayers }: { onSelectPlayers: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 600,
    }}>
      <div style={{
        padding: 20,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Welcome to EasyAdmin
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          Select an option from the sidebar to get started.
        </p>
      </div>

      <button
        className="btn btn-primary"
        onClick={onSelectPlayers}
        style={{
          padding: '12px 20px',
          fontSize: 14,
          width: '100%',
        }}
      >
        👥 Player Management
      </button>

      <div style={{
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        opacity: 0.6,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          Server Management
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Coming in a future update
        </p>
      </div>

      <div style={{
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        opacity: 0.6,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          Settings
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Coming in a future update
        </p>
      </div>
    </div>
  )
}

export default App
