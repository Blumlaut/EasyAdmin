/**
 * EasyAdmin NUI Plugin Contributions Hook
 *
 * Reads the plugin registry and filters contributions by the current
 * admin's permissions. No provider required — pass `permissions` directly.
 */

import { useMemo } from 'react'
import type { Permissions } from '../types'
import type { NavItem } from '../components/Navigation'
import { getRegisteredPlugins } from './registry'
import type { PluginPage, PlayerDetailTab, DashboardWidget } from './types'

export interface PluginContributions {
  /** All plugins visible to the current admin (after permission filtering). */
  plugins: ReturnType<typeof getRegisteredPlugins>
  /** Nav items to merge into the sidebar (already permission-filtered). */
  navItems: NavItem[]
  /** Pages keyed by view id. */
  pages: Map<string, PluginPage>
  /** Player-detail tabs (already permission-filtered). */
  playerDetailTabs: PlayerDetailTab[]
  /** Dashboard widgets, sorted by `order`. */
  dashboardWidgets: DashboardWidget[]
}

/**
 * Collect and permission-filter all plugin contributions.
 *
 * Call this anywhere in the App with the current `permissions` object.
 */
export function usePluginContributions(permissions: Permissions): PluginContributions {
  return useMemo(() => {
    const plugins = getRegisteredPlugins()
    const navItems: NavItem[] = []
    const pages = new Map<string, PluginPage>()
    const playerDetailTabs: PlayerDetailTab[] = []
    const dashboardWidgets: DashboardWidget[] = []

    for (const plugin of plugins) {
      // Plugin-level permission gate — skip everything if the admin lacks it.
      if (plugin.permission && !permissions[plugin.permission]) continue

      for (const item of plugin.navItems ?? []) {
        // Item-level permission gate.
        if (item.disabled) continue
        navItems.push({ type: 'item', ...item })
      }

      for (const page of plugin.pages ?? []) {
        pages.set(page.view, page)
      }

      for (const tab of plugin.playerDetailTabs ?? []) {
        if (tab.permission && !permissions[tab.permission]) continue
        playerDetailTabs.push({ ...tab, id: `${plugin.id}:${tab.id}` })
      }

      for (const widget of plugin.dashboardWidgets ?? []) {
        dashboardWidgets.push({ ...widget, id: `${plugin.id}:${widget.id}` })
      }
    }

    dashboardWidgets.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

    return { plugins, navItems, pages, playerDetailTabs, dashboardWidgets }
  }, [permissions])
}
