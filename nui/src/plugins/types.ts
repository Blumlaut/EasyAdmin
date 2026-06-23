/**
 * Runtime plugin types — the shape of data sent from Lua to the NUI when
 * an external resource registers a plugin.
 *
 * Plugins are never compiled into the NUI. They register at runtime via
 * `exports['easyadmin']:RegisterPlugin(config)` from their own resource.
 * EasyAdmin forwards the registration to the NUI, which renders the
 * plugin's UI from a declarative schema returned by render actions.
 *
 * @see docs/nui-plugins.md
 */

import type { ComponentSchema } from './schema'

/** A sidebar nav item contributed by a runtime plugin. */
export interface PluginNavItem {
  id: string
  label: string
  icon?: string
  /** View to navigate to (defaults to `id`). Plugin views use `plugin:<pluginId>`. */
  view?: string
  badge?: string | number
  disabled?: boolean
}

/** A page that renders a schema tree fetched from a Lua handler. */
export interface PluginPage {
  view: string
  /** Action name — the NUI calls `pluginCall(pluginId, renderAction)` to get the schema. */
  renderAction: string
}

/** A tab injected into the player detail page. */
export interface PluginPlayerTab {
  id: string
  label: string
  icon?: string
  permission?: string
  /** Action name — returns the schema for this tab. */
  renderAction: string
}

/** A widget injected into the dashboard. */
export interface PluginDashboardWidget {
  id: string
  /** Action name — returns the schema for this widget. */
  renderAction: string
  /** Sort order (lower = first). Default 100. */
  order?: number
}

/** A plugin registration received from Lua at runtime. */
export interface RuntimePlugin {
  id: string
  name: string
  version: string
  author?: string
  description?: string
  icon?: string
  /** Hides all contributions if the admin lacks this permission. */
  permission?: string
  navItems?: PluginNavItem[]
  pages?: PluginPage[]
  playerDetailTabs?: PluginPlayerTab[]
  dashboardWidgets?: PluginDashboardWidget[]
}

/** Context passed to render actions so Lua knows where the schema will be shown. */
export interface PluginRenderContext {
  /** 'page' | 'widget' | 'player-tab' */
  target: 'page' | 'widget' | 'player-tab'
  /** Player id when rendering a player-detail tab. */
  playerId?: number
}

/** Response from a render action — a schema tree to render. */
export type RenderResponse = ComponentSchema[] | { schema: ComponentSchema[] }
