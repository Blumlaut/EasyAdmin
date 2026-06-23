/**
 * EasyAdmin NUI Plugin SDK — Type Definitions
 *
 * A plugin extends the EasyAdmin UI by contributing navigation items,
 * pages, player-detail tabs, and dashboard widgets. Plugins also get
 * a context API for talking to the Lua backend, checking permissions,
 * translating strings, and showing notifications.
 *
 * @see docs/nui-plugins.md for the full authoring guide.
 */

import type { ComponentType } from 'react'
import type { Player, Permissions } from '../types'
import type { NavItemBase } from '../components/Navigation'

// ---------------------------------------------------------------------------
// Contribution types
// ---------------------------------------------------------------------------

/**
 * A sidebar navigation item contributed by a plugin.
 *
 * `view` is the View string navigated to when the item is clicked.
 * Defaults to the item `id`. Plugin views use the convention
 * `plugin:<pluginId>` or `plugin:<pluginId>:<pageId>`.
 */
export interface PluginNavItem extends NavItemBase {
  /** View to navigate to (defaults to `id`). */
  view?: string
}

/**
 * Props passed to a plugin page component.
 */
export interface PluginPageProps {
  /** The id of the plugin that owns this page. */
  pluginId: string
}

/**
 * A full-page contribution rendered in the main content area.
 *
 * The `view` must match the `view` (or `id`) of a {@link PluginNavItem}
 * so navigation can route to it.
 */
export interface PluginPage {
  /** Unique view id, e.g. `plugin:myplugin:main`. */
  view: string
  /** React component rendered when this view is active. */
  component: ComponentType<PluginPageProps>
}

/**
 * Props passed to a player-detail tab component.
 */
export interface PlayerDetailTabProps {
  player: Player
  permissions: Permissions
}

/**
 * A tab injected into the player detail page.
 */
export interface PlayerDetailTab {
  /** Unique tab id (scoped to the plugin). */
  id: string
  /** Tab label text. */
  label: string
  /** Optional icon name from the EasyAdmin icon set. */
  icon?: string
  /** Permission required to see this tab. Omit for always-visible. */
  permission?: string
  /** React component rendered inside the tab. */
  component: ComponentType<PlayerDetailTabProps>
}

/**
 * Props passed to a dashboard widget component.
 */
export interface DashboardWidgetProps {
  pluginId: string
}

/**
 * A widget injected into the dashboard.
 */
export interface DashboardWidget {
  /** Unique widget id (scoped to the plugin). */
  id: string
  /** React component rendered on the dashboard. */
  component: ComponentType<DashboardWidgetProps>
  /** Sort order — lower renders first. Defaults to 100. */
  order?: number
}

// ---------------------------------------------------------------------------
// Plugin context API
// ---------------------------------------------------------------------------

/**
 * The API surface exposed to a plugin.
 *
 * Passed to {@link EasyAdminPlugin.onActivate} and available inside plugin
 * components via the `usePluginApi()` hook.
 */
export interface EasyAdminPluginContext {
  /** The id of the plugin this context belongs to. */
  pluginId: string

  /**
   * Call a Lua handler registered for this plugin.
   *
   * By default calls a client-side handler registered via
   * `RegisterEasyAdminPluginHandler(pluginId, action, fn)`.
   *
   * Pass `server: true` to route to a server-side handler registered via
   * `RegisterEasyAdminPluginServerHandler(pluginId, action, fn)` instead.
   * The request is forwarded to the server and the response relayed back.
   *
   * Resolves with whatever the Lua handler returns.
   */
  callLua: <T = unknown>(action: string, data?: unknown, server?: boolean) => Promise<T>

  /**
   * Subscribe to a server-pushed NUI message.
   * Returns an unsubscribe function.
   */
  on: <T = unknown>(action: string, handler: (data: T) => void) => () => void

  /** Check whether the current admin holds a permission. */
  hasPermission: (perm: string) => boolean

  /** Translate a string through the EasyAdmin i18n system. */
  t: (key: string, params?: Record<string, string | number>) => string

  /** Show a native GTA/RedM notification. */
  notify: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

/**
 * The plugin definition exported as the default export of a plugin module.
 *
 * @example
 * ```ts
 * const myPlugin: EasyAdminPlugin = {
 *   id: 'my-plugin',
 *   name: 'My Plugin',
 *   version: '1.0.0',
 *   navItems: [{ id: 'plugin:my-plugin', label: 'My Plugin', icon: 'box' }],
 *   pages: [{ view: 'plugin:my-plugin', component: MyPage }],
 * }
 * export default myPlugin
 * ```
 */
export interface EasyAdminPlugin {
  /** Unique, machine-readable id (kebab-case). */
  id: string
  /** Human-readable display name. */
  name: string
  /** Semantic version string (e.g. `1.0.0`). */
  version: string
  /** Optional author credit. */
  author?: string
  /** Optional short description. */
  description?: string
  /** Optional default icon (used for nav items that don't specify one). */
  icon?: string
  /**
   * Permission required to see ANY of this plugin's contributions.
   * Individual nav items and tabs may declare their own `permission`.
   */
  permission?: string

  /** Sidebar navigation items to add. */
  navItems?: PluginNavItem[]
  /** Full pages rendered in the main content area. */
  pages?: PluginPage[]
  /** Tabs injected into the player detail page. */
  playerDetailTabs?: PlayerDetailTab[]
  /** Widgets injected into the dashboard. */
  dashboardWidgets?: DashboardWidget[]

  /**
   * Called once when the plugin is activated (menu first shown).
   * May return a cleanup function called on unmount.
   *
   * Use this to subscribe to server-pushed events.
   */
  onActivate?: (ctx: EasyAdminPluginContext) => (() => void) | undefined
}
