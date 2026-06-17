import { useCallback, useEffect, useRef, useState } from 'react'
import { useCollapse } from './hooks/useCollapse'
import { useWindowDrag, type WindowPosition } from './hooks/useWindowDrag'
import { useWindowResize, type WindowSize } from './hooks/useWindowResize'
import type {
  AppSettings,
  BanEntry,
  CachedPlayer,
  CleanupType,
  Notification,
  Permissions,
  Player,
  ReasonShortcut,
  Report,
  View,
} from './types'
import { DEFAULT_WINDOW_SIZE } from './types'
import { on, callLua, setResourceKvp } from './fivem'
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
import { PlayerStatisticsPage } from './pages/PlayerStatistics/PlayerStatisticsPage'
import { ServerMetricsPage } from './pages/ServerMetrics/ServerMetricsPage'
import { ServerPage } from './pages/Server/ServerPage'
import { ResourcesPage } from './pages/Resources/ResourcesPage'
import { SettingsPage } from './pages/Settings/SettingsPage'

const NAV_ITEMS: NavItem[] = [
  { id: 'main', label: 'Dashboard', icon: 'home' },
  { id: 'players', label: 'Players', icon: 'users' },
  { id: 'bans', label: 'Ban List', icon: 'ban' },
  { id: 'reports', label: 'Reports', icon: 'flag' },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: 'chart-bar',
    children: [
      { id: 'player-statistics', label: 'Player Statistics', icon: 'users' },
      { id: 'server-metrics', label: 'Server Metrics', icon: 'activity' },
    ],
  },
  { id: 'server', label: 'Server', icon: 'server' },
  { id: 'resources', label: 'Resources', icon: 'layers' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const DEFAULT_SETTINGS: AppSettings = {
  anonymous: false,
  highContrast: false,
  fontSize: 100,
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
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
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
  const [shortcuts, setShortcuts] = useState<ReasonShortcut[]>([])

  // Window chrome: position, size, fold state, background mode.
  // - windowPos: absolute left/top edge of the window in viewport pixels.
  //   Stored as absolute position so width changes (collapse/expand) don't
  //   invalidate the drag offset — the left edge stays pinned.
  // - windowSize: width/height of the window, user-resizable from edges.
  // - contentCollapsed: when true, the main content area is hidden and
  //   the window shrinks to just the sidebar width.
  // - nuiBackground: when true, the NUI is visible but has no input
  //   focus (the game has focus). The user can re-hook by holding ALT.
  const [windowPos, setWindowPos] = useState<WindowPosition>({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_WINDOW_SIZE)
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [nuiBackground, setNuiBackground] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const windowPosLoadedRef = useRef(false)
  const windowSizeLoadedRef = useRef(false)

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
        // Reset window chrome state every time the menu opens. The
        // window is always centered, the main content is unfolded, and
        // the NUI starts in focused mode.
        // Compute the centered position here (not in a separate effect)
        // so the first render already has the correct position — avoids
        // a one-frame flash at (0, 0) before an effect-based centering
        // could correct it.
        setWindowSize(DEFAULT_WINDOW_SIZE)
        setWindowPos({
          x: Math.round(window.innerWidth / 2 - DEFAULT_WINDOW_SIZE.width / 2),
          y: Math.round(window.innerHeight / 2 - DEFAULT_WINDOW_SIZE.height / 2),
        })
        setContentCollapsed(false)
        setNuiBackground(false)
        // Clear any inline styles left by collapse/resize animations
        const el = windowRef.current
        el?.style.removeProperty('width')
        el?.style.removeProperty('height')
        el?.classList.remove('ea-window--collapsed')
      }
    })
  }, [])

  // Focus sync from Lua. The `+ea_setFocused` keybind handler in
  // client/nui/core.lua sends `nuiRehook` when it regains focus and
  // `nuiUnhook` when focus is lost. We mirror that state here so the
  // NUI can dim itself and show the "Hold ALT to interact" hint.
  useEffect(() => {
    return on('nuiRehook', () => {
      setNuiBackground(false)
    })
  }, [])

  useEffect(() => {
    return on('nuiUnhook', () => {
      setNuiBackground(true)
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

  // Settings init
  useEffect(() => {
    return on<AppSettings>('initSettings', (data) => {
      setSettings((prev) => ({ ...prev, ...data }))
    })
  }, [])

  // Restore saved window position from KVP
  useEffect(() => {
    return on<WindowPosition>('initWindowPos', (data) => {
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        windowPosLoadedRef.current = true
        setWindowPos(data)
      }
    })
  }, [])

  // Restore saved window size from KVP
  useEffect(() => {
    return on<WindowSize>('initWindowSize', (data) => {
      if (data && typeof data.width === 'number' && typeof data.height === 'number') {
        windowSizeLoadedRef.current = true
        setWindowSize(data)
      }
    })
  }, [])

  // Center the window on first open (before KVP data arrives).
  // KVP restore will override this if a saved position exists.
  // Uses the windowSize ref instead of measuring the DOM — the element
  // may not have its inline width/height applied yet (applyWindowChrome
  // runs in a separate RAF), so measuring offsetWidth would give wrong
  // dimensions and offset the centering.
  useEffect(() => {
    if (!visible || windowPosLoadedRef.current) return
    const size = windowSizeRef.current
    setWindowPos({
      x: Math.round(window.innerWidth / 2 - size.width / 2),
      y: Math.round(window.innerHeight / 2 - size.height / 2),
    })
  }, [visible])

  // Reason shortcuts from server (ea_addShortcut)
  useEffect(() => {
    return on<{ shortcuts: ReasonShortcut[] }>('updateShortcuts', (data) => {
      setShortcuts(data.shortcuts ?? [])
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
      // Clear detail selection when leaving a detail view
      if (previous === 'players') setSelectedPlayer(null)
      if (previous === 'bans') setSelectedBanId(null)
      if (previous === 'reports') setSelectedReportId(null)
      if (previous === 'resources') setSelectedResource(null)
      setView(previous)
    } else {
      setView('main')
      setSelectedPlayer(null)
      setSelectedBanId(null)
      setSelectedReportId(null)
      setSelectedResource(null)
    }
  }, [])

  // === Derived state ===

  const activeNavId: string = (() => {
    if (view === 'player-detail' || view === 'cached-players') return 'players'
    if (view === 'ban-detail') return 'bans'
    if (view === 'report-detail') return 'reports'
    if (view === 'resource-detail') return 'resources'
    if (view === 'player-statistics' || view === 'server-metrics') return view
    return view
  })()

  // Permission gating for nav items
  const visibleNavItems = NAV_ITEMS.map((item) => {
    let disabled = false
    if (item.id === 'bans' && !permissions['player.ban.view']) disabled = true
    if (item.id === 'reports' && !permissions['player.reports.view']) disabled = true
    if (item.id === 'statistics') {
      // Statistics dropdown: disable if the user can't access any child
      disabled = !permissions['server.statistics.view']
      // Also gate children individually
      const children = item.children?.map((child) => {
        let childDisabled = false
        if (child.id === 'player-statistics' && !permissions['server.statistics.view']) childDisabled = true
        if (child.id === 'server-metrics' && !permissions['server.statistics.view']) childDisabled = true
        return { ...child, disabled: childDisabled }
      })
      return { ...item, disabled, children: children?.length ? children : undefined }
    }
    if (
      item.id === 'server' &&
      !permissions['server.announce'] &&
      !permissions['server.convars'] &&
      !permissions['player.ban.view']
    ) {
      disabled = true
    }
    if (
      item.id === 'resources' &&
      !permissions['server.resources.start'] &&
      !permissions['server.resources.stop']
    ) {
      disabled = true
    }
    return { ...item, disabled }
  })

  const availableViews: View[] = ['main', 'players']
  if (permissions['player.ban.view']) availableViews.push('bans')
  if (permissions['player.reports.view']) availableViews.push('reports')
  if (permissions['server.statistics.view']) availableViews.push('player-statistics', 'server-metrics')
  if (
    permissions['server.announce'] ||
    permissions['server.convars'] ||
    permissions['player.ban.view']
  ) {
    availableViews.push('server')
  }
  if (
    permissions['server.resources.start'] ||
    permissions['server.resources.stop']
  ) {
    availableViews.push('resources', 'resource-detail')
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

  // Focus the page title on navigation (screen reader + keyboard users)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const initialViewRef = useRef(view)

  useEffect(() => {
    if (visible && view !== initialViewRef.current && titleRef.current) {
      titleRef.current.focus()
      initialViewRef.current = view
    }
  }, [view, visible])

  // === Window chrome: drag, fold, background-mode handlers ===

  const handlePositionChange = useCallback((pos: WindowPosition) => {
    setWindowPos(pos)
  }, [])

  // Persist window position to KVP (throttled to 500ms).
  // KVP writes are expensive so we avoid spamming them during rapid
  // drag/expand operations.
  const lastWindowPosSaveRef = useRef(0)
  const saveWindowPosition = useCallback((pos: WindowPosition) => {
    const now = Date.now()
    if (now - lastWindowPosSaveRef.current < 500) return
    lastWindowPosSaveRef.current = now
    setResourceKvp('ixWindowPos', String(pos.x))
    setResourceKvp('iyWindowPos', String(pos.y))
  }, [])

  // Called once per drag when the user releases the mouse.
  const handleDragEnd = useCallback((pos: WindowPosition) => {
    saveWindowPosition(pos)
  }, [saveWindowPosition])

  // Window dragging
  const dragEnabled = visible && !nuiBackground

  useWindowDrag({
    enabled: dragEnabled,
    position: windowPos,
    onPositionChange: handlePositionChange,
    onDragEnd: handleDragEnd,
  })

  // Window resizing from edges
  const saveWindowSize = useCallback((size: WindowSize) => {
    setResourceKvp('iwSizeW', String(size.width))
    setResourceKvp('iwSizeH', String(size.height))
  }, [])

  useWindowResize({
    enabled: visible && !nuiBackground,
    size: windowSize,
    onSizeChange: (next) => {
      setWindowSize(next)
    },
    onResizeEnd: saveWindowSize,
    onPositionChange: (next) => {
      setWindowPos(next)
    },
    applyStyles: (w, h, x, y) => {
      const el = windowRef.current
      if (!el) return
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      if (x !== undefined) {
        el.style.setProperty('--ea-left', `${x}px`)
        windowPosRef.current = { ...windowPosRef.current, x }
      }
      if (y !== undefined) {
        el.style.setProperty('--ea-top', `${y}px`)
        windowPosRef.current = { ...windowPosRef.current, y }
      }
      windowSizeRef.current = { width: w, height: h }
      console.log('[resize] applied', { w, h, actualW: el.offsetWidth, actualH: el.offsetHeight, inlineW: el.style.width, inlineH: el.style.height })
    },
  })

  // After the collapse/expand animation finishes, ensure the window
  // is fully on-screen. On expand the width grows and the right edge
  // may extend past the viewport — bump the position left to compensate.
  // Uses a ref for windowPos so the async callback always reads the
  // latest value (closures capture stale state).
  const windowPosRef = useRef(windowPos)
  const windowSizeRef = useRef(windowSize)
  windowPosRef.current = windowPos
  windowSizeRef.current = windowSize

  const handleCollapseAnimationFinish = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const ww = el.offsetWidth
    const vw = window.innerWidth
    const pos = windowPosRef.current
    const rightEdge = Math.round(vw / 2 - ww / 2 + pos.x)
    if (rightEdge > vw) {
      // Bump left so the right edge sits at the viewport edge
      setWindowPos((prev) => {
        const adjusted = { ...prev, x: prev.x - (rightEdge - vw) }
        saveWindowPosition(adjusted)
        return adjusted
      })
    }
  }, [saveWindowPosition])

  const toggleCollapsed = useCollapse(
    windowRef,
    contentCollapsed,
    setContentCollapsed,
    () => windowSize.width,
    handleCollapseAnimationFinish,
  )

  // The user clicked the area outside the window. Tell Lua to release
  // NUI focus so the game can receive input again, and optimistically
  // mark the NUI as in background mode so the dimmed state shows up
  // immediately rather than waiting for the Lua round-trip.
  const handleBackdropClick = useCallback(() => {
    if (nuiBackground) return
    setNuiBackground(true)
    callLua('releaseFocus').catch(() => {
      // If the callback failed for some reason, leave the state as-is
      // (the game already has focus when the NUI doesn't).
    })
  }, [nuiBackground])

  // Apply window position + size as inline styles.
  // Uses refs inside RAF so it always reads latest values even when
  // multiple state updates are batched across frames.
  const applyWindowChrome = useCallback(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const raf = window.requestAnimationFrame(() => {
      const pos = windowPosRef.current
      const size = windowSizeRef.current
      el.style.setProperty('--ea-left', `${pos.x}px`)
      el.style.setProperty('--ea-top', `${pos.y}px`)
      el.style.width = `${size.width}px`
      el.style.height = `${size.height}px`
      // window chrome applied (quiet — only log during debugging)
      console.log('[chrome]', { x: pos.x, y: pos.y, w: size.width, h: size.height })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [visible])

  useEffect(() => {
    return applyWindowChrome()
  }, [visible, windowPos, windowSize])

  // Clamp position to viewport bounds on resize so the window
  // never ends up off-screen if the viewport shrinks.
  useEffect(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const onResize = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const clampedX = Math.max(0, Math.min(window.innerWidth - w, windowPos.x))
      const clampedY = Math.max(0, Math.min(window.innerHeight - h, windowPos.y))
      el.style.setProperty('--ea-left', `${clampedX}px`)
      el.style.setProperty('--ea-top', `${clampedY}px`)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [visible, windowPos])

  if (!visible) return null

  const closeMenu = () => callLua('closeMenu').catch(() => {})

  // Build accessibility classes
  const windowClasses = ['ea-window']
  if (settings.highContrast) windowClasses.push('high-contrast')
  if (settings.fontSize !== 100) windowClasses.push(`font-size-${settings.fontSize}`)
  if (contentCollapsed) windowClasses.push('ea-window--collapsed')
  if (nuiBackground) windowClasses.push('ea-window--background')

  return (
    <>
      <ModalProvider
        cleanupTypes={CLEANUP_TYPES}
        onToast={showToast}
        onPlayersUpdated={fetchPlayers}
      >
        {/* Backdrop sits behind the window (lower z-index). Using
            onMouseDown so it only fires when the mouse is actually
            pressed outside the window — prevents false triggers from
            drag operations that start outside and end inside. */}
        <div
          className="ea-backdrop"
          onMouseDown={handleBackdropClick}
        />

        <div ref={windowRef} className={windowClasses.join(' ')}>
          {/* Skip link — first focusable element, visible on :focus */}
          <a
            className="skip-link"
            href="#ea-main-content"
          >
            Skip to main content
          </a>

          <aside className="sidebar">
            <div className="sidebar-header" data-window-drag-handle>
              <img src="./logo.png" alt="EasyAdmin" className="sidebar-logo" />
              <div>
                <h1 className="text-xl font-bold sidebar-title text-gradient">EasyAdmin</h1>
                <p className="text-xs text-muted sidebar-subtitle">Admin Panel</p>
              </div>
              <button
                className="btn btn-ghost btn-icon sidebar-collapse-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCollapsed()
                }}
                aria-label={contentCollapsed ? 'Expand main content' : 'Collapse main content'}
                title={contentCollapsed ? 'Expand main content' : 'Collapse main content'}
                disabled={nuiBackground}
              >
                <Icon
                  name="chevron-double-left"
                  size="xs"
                  className="sidebar-collapse-icon"
                />
              </button>
            </div>
            <div className="sidebar-nav">
              <Navigation
                items={visibleNavItems.map((item) => ({
                  ...item,
                  badge: item.id === 'players' ? players.length : item.badge,
                }))}
                activeId={activeNavId}
                onSelect={(id) => {
                  const viewMap: Record<string, View> = {
                    'main': 'main',
                    'players': 'players',
                    'bans': 'bans',
                    'reports': 'reports',
                    'player-statistics': 'player-statistics',
                    'server-metrics': 'server-metrics',
                    'server': 'server',
                    'resources': 'resources',
                    'settings': 'settings',
                  }
                  const targetView = viewMap[id]
                  if (!targetView) return

                  // Auto-unfold when clicking a sidebar item while collapsed,
                  // but delay navigation so the animation isn't interrupted
                  if (contentCollapsed) {
                    toggleCollapsed()
                    setTimeout(() => navigateTo(targetView), 50)
                    return
                  }
                  navigateTo(targetView)
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
            <header className="topbar" data-window-drag-handle>
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
              <h2
                ref={titleRef}
                className="text-xl font-semibold"
                tabIndex={-1}
              >
                {getPageTitle(view, selectedPlayer, selectedBanId, selectedReportId)}
              </h2>
              <div className="topbar-actions">
                <button
                  className="btn btn-ghost btn-icon btn-close"
                  onClick={closeMenu}
                  aria-label="Close"
                >
                  <Icon name="x" size="xs" />
                </button>
              </div>
            </header>

            <main id="ea-main-content" className="glass main-content" role="main">
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
                  shortcuts={shortcuts}
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
                    if (selectedBanId) {
                      setBanDetailCache((prev) => {
                        const entries = Object.entries(prev)
                            .filter(([key]) => key !== selectedBanId)
                        return Object.fromEntries(entries)
                      })
                    }
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

              {view === 'player-statistics' && (
                <PlayerStatisticsPage
                  onToast={showToast}
                />
              )}

              {view === 'server-metrics' && (
                <ServerMetricsPage
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

              {view === 'resources' && (
                <ResourcesPage
                  permissions={permissions}
                  onToast={showToast}
                  onSelectResource={(name) => {
                    setSelectedResource(name)
                    navigateTo('resource-detail')
                  }}
                  selectedResource={selectedResource}
                />
              )}

              {view === 'resource-detail' && selectedResource && (
                <ResourcesPage
                  permissions={permissions}
                  onToast={showToast}
                  onSelectResource={(name) => {
                    setSelectedResource(name)
                    navigateTo('resource-detail')
                  }}
                  selectedResource={selectedResource}
                />
              )}

              {view === 'settings' && (
                <SettingsPage
                  permissions={permissions}
                  settings={settings}
                  onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
                  onToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      </ModalProvider>

      {toast && <Toast message={toast.text} type={toast.type} />}

      {/*
        Background-mode hint. Shown when the NUI is visible but the
        game has focus. The user re-engages with EasyAdmin by holding
        the +ea_setFocused keybind (default Left Alt, rebindable in
        FiveM settings). The hint is `pointer-events: none` so it
        never interferes with clicks.
      */}
      {nuiBackground && (
        <div className="ea-background-hint" role="status" aria-live="polite">
          <kbd>ALT</kbd>
          <span>Hold to interact with EasyAdmin</span>
        </div>
      )}
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
  if (view === 'player-statistics') return 'Player Statistics'
  if (view === 'server-metrics') return 'Server Metrics'
  if (view === 'server') return 'Server Management'
  if (view === 'resources') return 'Resource Management'
  if (view === 'resource-detail') return 'Resource Details'
  if (view === 'settings') return 'Settings'
  return 'EasyAdmin'
}

export default App
