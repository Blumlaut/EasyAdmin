import { useCallback, useEffect, useRef, useState } from 'react'
import type { View, Permissions, Player, BanEntry } from '../types'
import type { NavItem } from '../components/Navigation'
import { callLua } from '../fivem'

export interface UseAppNavigationOptions {
  permissions: Permissions
  players: Player[]
  banDetailCache: Record<string, BanEntry>
  fetchReports: () => void
  fetchCachedPlayers: () => void
  setLoadingReports: (v: boolean) => void
  setLoadingCached: (v: boolean) => void
}

export interface UseAppNavigationResult {
  view: View
  setView: (v: View) => void
  resetHistory: () => void
  viewHistory: View[]
  activeNavId: string
  pageTitle: string
  visibleNavItems: NavItem[]
  availableViews: View[]
  selectedPlayer: Player | null
  setSelectedPlayer: React.Dispatch<React.SetStateAction<Player | null>>
  selectedBanId: string | null
  setSelectedBanId: React.Dispatch<React.SetStateAction<string | null>>
  selectedReportId: number | null
  setSelectedReportId: React.Dispatch<React.SetStateAction<number | null>>
  selectedResource: string | null
  setSelectedResource: React.Dispatch<React.SetStateAction<string | null>>
  navigateTo: (newView: View) => void
  goBack: () => View
  selectPlayer: (player: Player) => void
  selectBan: (banId: string) => void
  selectReport: (reportId: number) => void
  titleRef: React.RefObject<HTMLHeadingElement | null>
}

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

export function useAppNavigation({
  permissions,
  players,
  banDetailCache,
  fetchReports,
  fetchCachedPlayers,
  setLoadingReports,
  setLoadingCached,
}: UseAppNavigationOptions): UseAppNavigationResult {
  const [view, setView] = useState<View>('main')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedBanId, setSelectedBanId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  const viewRef = useRef(view)
  viewRef.current = view
  const viewHistoryRef = useRef<View[]>([])
  const playersRef = useRef(players)
  playersRef.current = players
  const banDetailCacheRef = useRef(banDetailCache)
  banDetailCacheRef.current = banDetailCache

  // navigateTo is stable — uses refs for current values
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
      return previous
    } else {
      setView('main')
      return 'main'
    }
  }, [])

  const resetHistory = useCallback(() => {
    viewHistoryRef.current = []
  }, [])

  // activeNavId: maps detail views to their parent nav section
  const activeNavId = (() => {
    if (view === 'player-detail' || view === 'cached-players') return 'players'
    if (view === 'ban-detail') return 'bans'
    if (view === 'report-detail') return 'reports'
    if (view === 'resource-detail') return 'resources'
    if (view === 'player-statistics' || view === 'server-metrics') return view
    return view
  })()

  // Page title for the topbar
  const pageTitle = (() => {
    if (view === 'main') return 'Dashboard'
    if (view === 'players') return 'Player Management'
    if (view === 'player-detail' && selectedPlayer) return selectedPlayer.name
    if (view === 'cached-players') return 'Cached Players'
    if (view === 'bans') return 'Ban List'
    if (view === 'ban-detail' && selectedBanId) return `Ban ${selectedBanId}`
    if (view === 'reports') return 'Reports'
    if (view === 'report-detail' && selectedReportId !== null) return `Report #${selectedReportId}`
    if (view === 'player-statistics') return 'Player Statistics'
    if (view === 'server-metrics') return 'Server Metrics'
    if (view === 'server') return 'Server Management'
    if (view === 'resources') return 'Resource Management'
    if (view === 'resource-detail') return 'Resource Details'
    if (view === 'settings') return 'Settings'
    return 'EasyAdmin'
  })()

  // Permission gating for nav items
  const visibleNavItems: NavItem[] = NAV_ITEMS.map((item) => {
    let disabled = false
    if (item.id === 'bans' && !permissions['player.ban.view']) disabled = true
    if (item.id === 'reports' && !permissions['player.reports.view']) disabled = true
    if (item.id === 'statistics') {
      disabled = !permissions['server.statistics.view']
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

  // Selection handlers — stable because navigateTo is stable
  const selectPlayer = useCallback((player: Player) => {
    setSelectedPlayer(player)
    navigateTo('player-detail')
  }, [navigateTo])

  const selectBan = useCallback((banId: string) => {
    setSelectedBanId(banId)
    if (!banDetailCacheRef.current[banId]) {
      callLua('getBanById', { banid: banId }).catch(() => {})
    }
    navigateTo('ban-detail')
  }, [navigateTo])

  const selectReport = useCallback((reportId: number) => {
    setSelectedReportId(reportId)
    navigateTo('report-detail')
  }, [navigateTo])

  // Track which data sets have already been fetched (lazy-load once)
  const fetchedRef = useRef({ reports: false, cachedPlayers: false })

  // Trigger lazy data fetch on navigation
  useEffect(() => {
    if (view === 'reports' && !fetchedRef.current.reports) {
      fetchedRef.current.reports = true
      setLoadingReports(true)
      queueMicrotask(() => fetchReports())
    }
    if (view === 'cached-players' && !fetchedRef.current.cachedPlayers) {
      fetchedRef.current.cachedPlayers = true
      setLoadingCached(true)
      queueMicrotask(() => fetchCachedPlayers())
    }
  }, [view, fetchReports, fetchCachedPlayers, setLoadingReports, setLoadingCached])

  // ESC closes the menu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callLua('closeMenu').catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Focus the page title on navigation (screen reader + keyboard users)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const initialViewRef = useRef(view)

  useEffect(() => {
    if (view !== initialViewRef.current && titleRef.current) {
      titleRef.current.focus()
      initialViewRef.current = view
    }
  }, [view])

  return {
    view,
    setView,
    resetHistory,
    viewHistory: viewHistoryRef.current,
    activeNavId,
    pageTitle,
    visibleNavItems,
    availableViews,
    selectedPlayer,
    setSelectedPlayer,
    selectedBanId,
    setSelectedBanId,
    selectedReportId,
    setSelectedReportId,
    selectedResource,
    setSelectedResource,
    navigateTo,
    goBack,
    selectPlayer,
    selectBan,
    selectReport,
    titleRef,
  }
}
