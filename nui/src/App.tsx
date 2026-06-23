import React, { useEffect, useRef, useState, type SuspenseProps } from 'react'
import { useAppData } from './hooks/useAppData'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useWindowChrome } from './hooks/useWindowChrome'
import type { View, Player } from './types'
import { on } from './fivem'
import { useTranslation } from './lib/i18n'
import { Icon } from './components/icons'
import { Navigation } from './components/Navigation'
import { ScreenshotCapture } from './components/ScreenshotCapture'
import { ScreenshotViewer } from './components/ScreenshotViewer'
import { StreamCapture } from './components/StreamCapture'
import { StreamViewer } from './components/StreamViewer'
import { WarningOverlay } from './components/WarningOverlay'
import { Skeleton } from './components/Skeleton'
import { ModalProvider } from './ModalContext'
import { notify } from './lib/notify'
import { I18nProvider } from './lib/i18n'
import { usePluginContributions, PluginApiProvider } from './plugins'

// --- Lazy-loaded pages (route-based code-splitting) ---
// Pages use named exports; .then() adapts them to the default export React.lazy expects.

const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const PlayerListPage = React.lazy(() => import('./pages/Players/PlayerListPage').then(m => ({ default: m.PlayerListPage })))
const PlayerDetailPage = React.lazy(() => import('./pages/Players/PlayerDetailPage').then(m => ({ default: m.PlayerDetailPage })))
const CachedPlayersPage = React.lazy(() => import('./pages/Players/CachedPlayersPage').then(m => ({ default: m.CachedPlayersPage })))
const BanListPage = React.lazy(() => import('./pages/Bans/BanListPage').then(m => ({ default: m.BanListPage })))
const BanDetailPage = React.lazy(() => import('./pages/Bans/BanDetailPage').then(m => ({ default: m.BanDetailPage })))
const ReportListPage = React.lazy(() => import('./pages/Reports/ReportListPage').then(m => ({ default: m.ReportListPage })))
const ReportDetailPage = React.lazy(() => import('./pages/Reports/ReportDetailPage').then(m => ({ default: m.ReportDetailPage })))
const PlayerStatisticsPage = React.lazy(() => import('./pages/PlayerStatistics/PlayerStatisticsPage').then(m => ({ default: m.PlayerStatisticsPage })))
const ServerPage = React.lazy(() => import('./pages/Server/ServerPage').then(m => ({ default: m.ServerPage })))
const ResourceListPage = React.lazy(() => import('./pages/Resources/ResourceListPage').then(m => ({ default: m.ResourceListPage })))
const ResourceDetailPage = React.lazy(() => import('./pages/Resources/ResourceDetailPage').then(m => ({ default: m.ResourceDetailPage })))
const ProfilerPage = React.lazy(() => import('./pages/Profiler/ProfilerPage').then(m => ({ default: m.ProfilerPage })))
const SettingsPage = React.lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const NetworkMonitorPage = React.lazy(() => import('./pages/Statistics/NetworkMonitorPage').then(m => ({ default: m.NetworkMonitorPage })))

// --- Loading placeholder for lazy pages ---

function PageLoader() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="80%" />
      <Skeleton height={16} width="45%" />
      <div className="mt-4" />
      <Skeleton height={48} width="100%" />
      <Skeleton height={48} width="100%" />
      <Skeleton height={48} width="100%" />
    </div>
  )
}

function LazyPage(props: SuspenseProps) {
  return (
    <React.Suspense fallback={<PageLoader />}>
      {props.children}
    </React.Suspense>
  )
}

interface WarningData {
  title: string
  message: string
  warnedBy: string
  dismissText: string
}

function App() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [hintFading, setHintFading] = useState(false)
  const [warning, setWarning] = useState<WarningData | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === Hooks ===

  const data = useAppData()
  const pluginContrib = usePluginContributions(data.permissions)
  const _nav = useAppNavigation({
    permissions: data.permissions,
    players: data.players,
    banDetailCache: data.banDetailCache,
    fetchReports: data.fetchReports,
    fetchCachedPlayers: data.fetchCachedPlayers,
    setLoadingReports: data.setLoadingReports,
    setLoadingCached: data.setLoadingCached,
    pluginNavItems: pluginContrib.navItems,
  })
  // Extract ref so the remaining object is plain state (avoids react-hooks/refs false positives)
  const { titleRef: _titleRef, ...nav } = _nav
  const _chrome = useWindowChrome({
    visible,
    windowPosData: data.windowPosData,
    windowSizeData: data.windowSizeData,
    sidebarMode: data.settings.sidebarMode,
    sidebarDirection: data.settings.sidebarDirection,
  })
  // Extract ref so the remaining object is plain state (avoids react-hooks/refs false positives)
  const { windowRef: _windowRef, ...chrome } = _chrome

  // === Menu toggle ===

  useEffect(() => {
    return on<{ visible: boolean }>('menuToggle', (data) => {
      setVisible(data.visible)
      if (data.visible) {
        _chrome.resetWindowChrome()
        _nav.setView('main')
        _nav.setSelectedPlayer(null)
        _nav.setSelectedBanId(null)
        _nav.setSelectedReportId(null)
        _nav.setSelectedResource(null)
        _nav.resetHistory()
      }
    })
  }, [_chrome, _nav])

  // === Player warning (full-screen overlay) ===

  useEffect(() => {
    return on<WarningData>('showWarning', (data) => {
      setWarning(data)
    })
  }, [])

  // === Global NUI background class for floating windows ===

  useEffect(() => {
    const unhook = () => document.body.classList.add('ea-nui-background')
    const rehook = () => document.body.classList.remove('ea-nui-background')
    const unsubUnhook = on('nuiUnhook', unhook)
    const unsubRehook = on('nuiRehook', rehook)
    return () => {
      unsubUnhook()
      unsubRehook()
    }
  }, [])

  // === Background hint auto-fade ===

  useEffect(() => {
    if (chrome.nuiBackground) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hint fade state with NUI background visibility; timer-based animation requires effect
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
    return on<Player>('playerUpdated', (playerData) => {
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

  // Build a map from plugin nav-item id → view (defaults to the id itself).
  const pluginViewMap: Record<string, string> = {}
  for (const item of pluginContrib.navItems) {
    if ('id' in item && !('type' in item && item.type !== 'item')) {
      pluginViewMap[item.id] = (item as { view?: string }).view ?? item.id
    }
  }

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
    // Built-in lookup, then plugin lookup.
    const targetView = (viewMap[id] ?? pluginViewMap[id]) as View | undefined
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
        <I18nProvider>
        <PluginApiProvider permissions={data.permissions}>
        <ModalProvider>
        <div
          className="ea-backdrop"
          onMouseDown={chrome.handleBackdropClick}
        />

        <div ref={_windowRef} className={windowClasses.join(' ')} style={windowStyle}>
          <a className="skip-link" href="#ea-main-content">
            Skip to main content
          </a>

          <aside className="sidebar">
            <div className="sidebar-header" data-window-drag-handle>
              <img src="./logo.png" alt="EasyAdmin" className="sidebar-logo" />
              <div>
                <h1 className="sidebar-title text-gradient text-xl font-bold">EasyAdmin</h1>
                <p className="sidebar-subtitle text-xs text-fg-muted">{t("Admin Panel")}</p>
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

          <div className="flex h-full flex-1 flex-col overflow-hidden">
            <header className="topbar" data-window-drag-handle>
              {nav.view !== 'main' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleGoBack}
                  aria-label={t("Go back")}
                >
                  <Icon name="chevron-left" size="xs" />
                  Back
                </button>
              )}
              <h2
                ref={_titleRef}
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
                  aria-label={t("Fold in")}
                  title={t("Fold in (press ALT to unfold)")}
                  disabled={chrome.nuiBackground}
                >
                  <Icon name="x" size="xs" />
                </button>
              </div>
            </header>

            <main id="ea-main-content" className="glass main-content" role="main">
              {nav.view === 'main' && (
                <LazyPage>
                  <Dashboard
                    playerCount={data.players.length}
                    updateInfo={data.updateInfo}
                    onDismissUpdate={data.dismissUpdate}
                    onNavigateToResources={() => nav.navigateTo('resources')}
                    pluginWidgets={pluginContrib.dashboardWidgets}
                  />
                </LazyPage>
              )}

              {nav.view === 'players' && (
                <LazyPage>
                  <PlayerListPage
                    players={data.players}
                    loading={data.loadingPlayers}
                    permissions={data.permissions}
                    onSelectPlayer={nav.selectPlayer}
                    onOpenCached={() => nav.navigateTo('cached-players')}
                    onRefresh={data.fetchPlayers}
                  />
                </LazyPage>
              )}

              {nav.view === 'player-detail' && nav.selectedPlayer && (
                <LazyPage>
                  <PlayerDetailPage
                    player={nav.selectedPlayer}
                    permissions={data.permissions}
                    ipPrivacy={data.ipPrivacy}
                    pluginTabs={pluginContrib.playerDetailTabs}
                  />
                </LazyPage>
              )}

              {nav.view === 'cached-players' && (
                <LazyPage>
                  <CachedPlayersPage
                    cachedPlayers={data.cachedPlayers}
                    loading={data.loadingCached}
                    onRefresh={data.fetchCachedPlayers}
                  />
                </LazyPage>
              )}

              {nav.view === 'bans' && (
                <LazyPage>
                  <BanListPage
                    ipPrivacy={data.ipPrivacy}
                    onSelectBan={nav.selectBan}
                  />
                </LazyPage>
              )}

              {nav.view === 'ban-detail' && nav.selectedBanId && (
                <LazyPage>
                  <BanDetailPage
                    banId={nav.selectedBanId}
                    ban={data.banDetailCache[nav.selectedBanId] ?? null}
                    ipPrivacy={data.ipPrivacy}
                    permissions={data.permissions}
                    onBack={handleGoBack}
                  />
                </LazyPage>
              )}

              {nav.view === 'reports' && (
                <LazyPage>
                  <ReportListPage
                    reports={data.reports}
                    loading={data.loadingReports}
                    onSelectReport={nav.selectReport}
                    onRefresh={data.fetchReports}
                  />
                </LazyPage>
              )}

              {nav.view === 'report-detail' && nav.selectedReportId && (
                <LazyPage>
                  <ReportDetailPage
                    reportId={nav.selectedReportId}
                    reports={data.reports}
                    permissions={data.permissions}
                    players={data.players}
                    onOpenPlayer={(id) => {
                      const p = data.players.find((pl) => pl.id === id)
                      if (p) nav.selectPlayer(p)
                      else notify('Player not online', 'error')
                    }}
                    onClosed={() => {
                      data.setReports((prev) => prev.filter((r) => r.id !== nav.selectedReportId))
                      nav.navigateTo('reports')
                    }}
                  />
                </LazyPage>
              )}

              {nav.view === 'player-statistics' && (
                <LazyPage>
                  <PlayerStatisticsPage />
                </LazyPage>
              )}

              {nav.view === 'network-monitor' && (
                <LazyPage>
                  <NetworkMonitorPage />
                </LazyPage>
              )}

              {nav.view === 'server' && (
                <LazyPage>
                  <ServerPage
                    permissions={data.permissions}
                    isRedm={data.isRedm}
                  />
                </LazyPage>
              )}

              {nav.view === 'resources' && (
                <LazyPage>
                  <ResourceListPage
                    permissions={data.permissions}
                    onSelectResource={nav.selectResource}
                  />
                </LazyPage>
              )}

              {nav.view === 'resource-detail' && nav.selectedResource && (
                <LazyPage>
                  <ResourceDetailPage
                    resourceName={nav.selectedResource}
                    permissions={data.permissions}
                  />
                </LazyPage>
              )}

              {nav.view === 'profiler' && (
                <LazyPage>
                  <ProfilerPage />
                </LazyPage>
              )}

              {nav.view === 'settings' && (
                <LazyPage>
                  <SettingsPage
                    permissions={data.permissions}
                    settings={data.settings}
                    onChange={(patch) => data.setSettings((prev) => ({ ...prev, ...patch }))}
                  />
                </LazyPage>
              )}

                           {/* Plugin-contributed pages */}
              {typeof nav.view === 'string' && nav.view.startsWith('plugin:') &&
                (() => {
                  const page = pluginContrib.pages.get(nav.view)
                  if (!page) return null
                  const PluginPageComponent = page.component
                  const pluginId = nav.view.split(':')[1] ?? ''
                  return (
                    <LazyPage>
                      <PluginPageComponent pluginId={pluginId} />
                    </LazyPage>
                  )
                })()
              }
            </main>
          </div>
        </div>
      </ModalProvider>
      </PluginApiProvider>

      {chrome.nuiBackground && (
        <div
          className={`ea-background-hint${hintFading ? ' ea-background-hint--fading' : ''}`}
          role="status"
          aria-live="polite"
        >
          <kbd>ALT</kbd>
          <span>{t("Press ALT to unfold")}</span>
        </div>
      )}

        {/* Hidden canvas for screenshot capture — must be in visible tree for OSR */}
        <ScreenshotCapture />

        {/* Hidden canvas for stream capture — must be in visible tree for OSR */}
        <StreamCapture />

        {/* Floating screenshot viewer window */}
        <ScreenshotViewer />

        {/* Floating stream viewer window */}
        <StreamViewer />

        <WarningOverlay
          warning={warning}
          onDismiss={() => setWarning(null)}
        />
        </I18nProvider>
      </>
    )}
    </>
  );
}

export default App
