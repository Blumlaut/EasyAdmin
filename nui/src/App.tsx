import { useEffect, useRef, useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useToast } from './hooks/useToast'
import { useWindowChrome } from './hooks/useWindowChrome'
import type { View } from './types'
import { on } from './fivem'
import { Icon } from './components/icons'
import { Navigation } from './components/Navigation'
import { ScreenshotCapture } from './components/ScreenshotCapture'
import { ScreenshotViewer } from './components/ScreenshotViewer'
import { ToastContainer } from './components/ToastContainer'
import { WarningOverlay } from './components/WarningOverlay'
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
import { ServerPage } from './pages/Server/ServerPage'
import { ResourceListPage } from './pages/Resources/ResourceListPage'
import { ResourceDetailPage } from './pages/Resources/ResourceDetailPage'
import { ProfilerPage } from './pages/Profiler/ProfilerPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { NetworkMonitorPage } from './pages/Statistics/NetworkMonitorPage'

interface WarningData {
  title: string
  message: string
  warnedBy: string
  dismissText: string
}

function App() {
  const [visible, setVisible] = useState(false)
  const [hintFading, setHintFading] = useState(false)
  const [warning, setWarning] = useState<WarningData | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === Hooks ===

  const { toasts, showToast, dismissToast } = useToast()
  const data = useAppData()
  const nav = useAppNavigation({
    permissions: data.permissions,
    players: data.players,
    banDetailCache: data.banDetailCache,
    fetchReports: data.fetchReports,
    fetchCachedPlayers: data.fetchCachedPlayers,
    setLoadingReports: data.setLoadingReports,
    setLoadingCached: data.setLoadingCached,
  })
  const chrome = useWindowChrome({
    visible,
    windowPosData: data.windowPosData,
    windowSizeData: data.windowSizeData,
    sidebarMode: data.settings.sidebarMode,
    sidebarDirection: data.settings.sidebarDirection,
  })

  // === Menu toggle ===

  useEffect(() => {
    return on<{ visible: boolean }>('menuToggle', (data) => {
      setVisible(data.visible)
      if (data.visible) {
        chrome.resetWindowChrome()
        nav.setView('main')
        nav.setSelectedPlayer(null)
        nav.setSelectedBanId(null)
        nav.setSelectedReportId(null)
        nav.setSelectedResource(null)
        nav.resetHistory()
      }
    })
  }, [chrome, nav])

  // === Player warning (full-screen overlay) ===

  useEffect(() => {
    return on<WarningData>('showWarning', (data) => {
      setWarning(data)
    })
  }, [])

  // === Background hint auto-fade ===

  useEffect(() => {
    if (chrome.nuiBackground) {
      setHintFading(false)
      hintTimerRef.current = setTimeout(() => {
        setHintFading(true)
      }, 5000)
    } else {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current)
        hintTimerRef.current = null
      }
      setHintFading(false)
    }
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current)
        hintTimerRef.current = null
      }
    }
  }, [chrome.nuiBackground])

  // Player updates (selected player state pushed from Lua)
  useEffect(() => {
    return on<any>('playerUpdated', (playerData) => {
      nav.setSelectedPlayer((prev) =>
        prev && prev.id === playerData.id ? { ...prev, ...playerData } : prev,
      )
    })
  }, [nav])

  // === Derived helpers ===

  const handleGoBack = () => {
    const previousView = nav.goBack()
    // Clear detail selection when leaving a detail view
    if (previousView === 'players') nav.setSelectedPlayer(null)
    if (previousView === 'bans') nav.setSelectedBanId(null)
    if (previousView === 'reports') nav.setSelectedReportId(null)
    if (previousView === 'resources') nav.setSelectedResource(null)
  }



  // === Window classes ===

  const isHorizontalSidebar = data.settings.sidebarMode === 'horizontal'

  // Base icon points toward the content area. CSS rotates it 180° when collapsed
  // so it points toward the sidebar (expand direction). This keeps the spin animation smooth.
  const collapseIconName = (() => {
    if (isHorizontalSidebar) {
      // sidebarDirection 'up' = sidebar at bottom, 'down' = sidebar at top
      return data.settings.sidebarDirection === 'up' ? 'chevron-double-down' : 'chevron-double-up'
    }
    // sidebarDirection 'left' = sidebar at right, 'right' = sidebar at left
    return data.settings.sidebarDirection === 'left' ? 'chevron-double-right' : 'chevron-double-left'
  })()

  const windowClasses = [
    'ea-window',
    `ea-window--sidebar-${data.settings.sidebarMode}`,
    `ea-window--sidebar-${data.settings.sidebarDirection}`,
  ]
  if (data.settings.highContrast) windowClasses.push('high-contrast')
  if (chrome.contentCollapsed) windowClasses.push('ea-window--collapsed')
  if (chrome.nuiBackground) windowClasses.push('ea-window--background')

  const windowStyle: React.CSSProperties = {
    fontSize: `${data.settings.fontSize}px`,
  }

  const handleFoldIn = chrome.foldIn

  // === Navigation select handler ===

  const handleNavSelect = (id: string) => {
    const viewMap: Record<string, View> = {
      'main': 'main',
      'players': 'players',
      'bans': 'bans',
      'reports': 'reports',
      'player-statistics': 'player-statistics',
      'network-monitor': 'network-monitor',
      'server': 'server',
      'resources': 'resources',
      'profiler': 'profiler',
      'settings': 'settings',
    }
    const targetView = viewMap[id]
    if (!targetView) return

    // Auto-unfold when clicking a sidebar item while collapsed
    if (chrome.contentCollapsed) {
      chrome.toggleCollapsed()
      setTimeout(() => nav.navigateTo(targetView), 50)
      return
    }
    nav.navigateTo(targetView)
  }

  // === Render ===

  return (
    <>
      {visible && (
      <>
        <ModalProvider>
        <div
          className="ea-backdrop"
          onMouseDown={chrome.handleBackdropClick}
        />

        <div ref={chrome.windowRef} className={windowClasses.join(' ')} style={windowStyle}>
          <a className="skip-link" href="#ea-main-content">
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
                  chrome.toggleCollapsed()
                }}
                aria-label={chrome.contentCollapsed ? 'Expand main content' : 'Collapse main content'}
                title={chrome.contentCollapsed ? 'Expand main content' : 'Collapse main content'}
                disabled={chrome.nuiBackground}
              >
                <Icon
                  name={collapseIconName as 'chevron-double-left' | 'chevron-double-right' | 'chevron-double-up' | 'chevron-double-down'}
                  size="xs"
                  className="sidebar-collapse-icon"
                />
              </button>
            </div>
            <div className="sidebar-nav">
              <Navigation
                items={nav.visibleNavItems.map((item) =>
                  'id' in item && item.id === 'players'
                    ? { ...item, badge: data.players.length }
                    : item,
                )}
                activeId={nav.activeNavId}
                onSelect={handleNavSelect}
                orientation={data.settings.sidebarMode}
              />
            </div>
          </aside>

          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <header className="topbar" data-window-drag-handle>
              {nav.view !== 'main' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleGoBack}
                  aria-label="Go back"
                >
                  <Icon name="chevron-left" size="xs" />
                  Back
                </button>
              )}
              <h2
                ref={nav.titleRef}
                className="text-xl font-semibold"
                tabIndex={-1}
              >
                {nav.pageTitle}
              </h2>
              <div className="topbar-actions">
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => chrome.toggleMaximize()}
                  aria-label={chrome.maximized ? 'Restore window size' : 'Maximize window'}
                  title={chrome.maximized ? 'Restore window size' : 'Maximize window'}
                  disabled={chrome.nuiBackground}
                >
                  <Icon name={chrome.maximized ? 'minimize' : 'maximize'} size="xs" />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-close"
                  onClick={handleFoldIn}
                  aria-label="Fold in"
                  title="Fold in (press ALT to unfold)"
                  disabled={chrome.nuiBackground}
                >
                  <Icon name="x" size="xs" />
                </button>
              </div>
            </header>

            <main id="ea-main-content" className="glass main-content" role="main">
              {nav.view === 'main' && (
                <Dashboard
                  playerCount={data.players.length}
                  updateInfo={data.updateInfo}
                  onDismissUpdate={data.dismissUpdate}
                  onToast={showToast}
                  onNavigateToResources={() => nav.navigateTo('resources')}
                />
              )}

              {nav.view === 'players' && (
                <PlayerListPage
                  players={data.players}
                  loading={data.loadingPlayers}
                  permissions={data.permissions}
                  onSelectPlayer={nav.selectPlayer}
                  onOpenCached={() => nav.navigateTo('cached-players')}
                  onToast={showToast}
                  onRefresh={data.fetchPlayers}
                />
              )}

              {nav.view === 'player-detail' && nav.selectedPlayer && (
                <PlayerDetailPage
                  player={nav.selectedPlayer}
                  permissions={data.permissions}
                  ipPrivacy={data.ipPrivacy}
                  onToast={showToast}
                />
              )}

              {nav.view === 'cached-players' && (
                <CachedPlayersPage
                  cachedPlayers={data.cachedPlayers}
                  loading={data.loadingCached}
                  onToast={showToast}
                  onRefresh={data.fetchCachedPlayers}
                />
              )}

              {nav.view === 'bans' && (
                <BanListPage
                  ipPrivacy={data.ipPrivacy}
                  onSelectBan={nav.selectBan}
                  onToast={showToast}
                />
              )}

              {nav.view === 'ban-detail' && nav.selectedBanId && (
                <BanDetailPage
                  banId={nav.selectedBanId}
                  ban={data.banDetailCache[nav.selectedBanId] ?? null}
                  ipPrivacy={data.ipPrivacy}
                  permissions={data.permissions}
                  onBack={handleGoBack}
                  onToast={showToast}
                />
              )}

              {nav.view === 'reports' && (
                <ReportListPage
                  reports={data.reports}
                  loading={data.loadingReports}
                  onSelectReport={nav.selectReport}
                  onToast={showToast}
                  onRefresh={data.fetchReports}
                />
              )}

              {nav.view === 'report-detail' && nav.selectedReportId && (
                <ReportDetailPage
                  reportId={nav.selectedReportId}
                  reports={data.reports}
                  permissions={data.permissions}
                  players={data.players}
                  onOpenPlayer={(id) => {
                    const p = data.players.find((pl) => pl.id === id)
                    if (p) nav.selectPlayer(p)
                    else showToast('Player not online', 'error')
                  }}
                  onToast={showToast}
                  onClosed={() => {
                    data.setReports((prev) => prev.filter((r) => r.id !== nav.selectedReportId))
                    nav.navigateTo('reports')
                  }}
                />
              )}

              {nav.view === 'player-statistics' && (
                <PlayerStatisticsPage onToast={showToast} />
              )}

              {nav.view === 'network-monitor' && (
                <NetworkMonitorPage onToast={showToast} />
              )}

              {nav.view === 'server' && (
                <ServerPage
                  permissions={data.permissions}
                  isRedm={data.isRedm}
                  onToast={showToast}
                />
              )}

              {nav.view === 'resources' && (
                <ResourceListPage
                  permissions={data.permissions}
                  onToast={showToast}
                  onSelectResource={nav.selectResource}
                />
              )}

              {nav.view === 'resource-detail' && nav.selectedResource && (
                <ResourceDetailPage
                  resourceName={nav.selectedResource}
                  permissions={data.permissions}
                  onToast={showToast}
                />
              )}

              {nav.view === 'profiler' && (
                <ProfilerPage onToast={showToast} />
              )}

              {nav.view === 'settings' && (
                <SettingsPage
                  permissions={data.permissions}
                  settings={data.settings}
                  onChange={(patch) => data.setSettings((prev) => ({ ...prev, ...patch }))}
                  onToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      </ModalProvider>

      {chrome.nuiBackground && (
        <div
          className={`ea-background-hint${hintFading ? ' ea-background-hint--fading' : ''}`}
          role="status"
          aria-live="polite"
        >
          <kbd>ALT</kbd>
          <span>Press ALT to unfold</span>
        </div>
      )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Hidden canvas for screenshot capture — must be in visible tree for OSR */}
        <ScreenshotCapture />

        {/* Floating screenshot viewer window */}
        <ScreenshotViewer />

        <WarningOverlay
          warning={warning}
          onDismiss={() => setWarning(null)}
        />
      </>
    )}
    </>
  );
}

export default App
