/**
 * usePlugins — React hook for accessing runtime plugin contributions.
 *
 * Reads the plugin store and filters all contributions by the current
 * admin's permissions. Returns nav items, pages, player tabs, and
 * dashboard widgets ready for the App to render.
 */

import { useSyncExternalStore, useMemo } from 'react'
import type { Permissions, View } from '../types'
import type { NavItem } from '../components/Navigation'
import { getPluginsSnapshot, subscribePlugins } from './store'
import type { PluginPage, PluginPlayerTab, PluginDashboardWidget, RuntimePlugin } from './types'

export interface PluginContributions {
  /** All plugins visible to the current admin. */
  plugins: RuntimePlugin[]
  /** Nav items to merge into the sidebar. */
  navItems: NavItem[]
  /** Pages keyed by view id. */
  pages: Map<string, PluginPage>
  /** Player-detail tabs (already permission-filtered + namespaced). */
  playerDetailTabs: Array<PluginPlayerTab & { _pluginId: string }>
  /** Dashboard widgets, sorted by order (namespaced ids). */
  dashboardWidgets: Array<PluginDashboardWidget & { _pluginId: string }>
  /** All view strings contributed by plugins. */
  views: View[]
}

export function usePlugins(permissions: Permissions): PluginContributions {
  const plugins = useSyncExternalStore(subscribePlugins, getPluginsSnapshot, getPluginsSnapshot)

  return useMemo(() => {
    const navItems: NavItem[] = []
    const pages = new Map<string, PluginPage>()
    const playerDetailTabs: Array<PluginPlayerTab & { _pluginId: string }> = []
    const dashboardWidgets: Array<PluginDashboardWidget & { _pluginId: string }> = []
    const views: View[] = []

    for (const plugin of plugins) {
      // Plugin-level permission gate
      if (plugin.permission && !permissions[plugin.permission]) continue

      for (const item of plugin.navItems ?? []) {
        navItems.push({
          type: 'item' as const,
          id: item.id,
          label: item.label,
          icon: item.icon ?? plugin.icon ?? 'box',
          badge: item.badge,
          disabled: item.disabled,
        })
      }

      for (const page of plugin.pages ?? []) {
        pages.set(page.view, page)
        views.push(page.view as View)
      }

      for (const tab of plugin.playerDetailTabs ?? []) {
        if (tab.permission && !permissions[tab.permission]) continue
        playerDetailTabs.push({ ...tab, _pluginId: plugin.id })
      }

      for (const widget of plugin.dashboardWidgets ?? []) {
        dashboardWidgets.push({ ...widget, _pluginId: plugin.id })
      }
    }

    dashboardWidgets.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

    return { plugins, navItems, pages, playerDetailTabs, dashboardWidgets, views }
  }, [plugins, permissions])
}
