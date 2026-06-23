/**
 * EasyAdmin NUI Plugin System — runtime, schema-driven.
 *
 * Plugins are external FiveM resources that register via Lua exports.
 * The NUI renders their UI from declarative schema trees using only
 * built-in EasyAdmin components. No plugin code is compiled into the NUI.
 *
 * @see docs/nui-plugins.md
 */

// Store + hooks
export { setPlugins, getPlugins, subscribePlugins } from './store'
export { usePlugins, type PluginContributions } from './usePlugins'
export { usePluginSchema } from './usePluginSchema'

// Renderer
export { SchemaRenderer, type SchemaRendererProps } from './SchemaRenderer'

// Host components
export { PluginPageHost, PluginWidgetHost, PluginTabHost } from './hosts'

// Lua bridge
export { pluginCall, type PluginCallResult } from './bridge'

// Types
export type {
  RuntimePlugin,
  PluginNavItem,
  PluginPage,
  PluginPlayerTab,
  PluginDashboardWidget,
  PluginRenderContext,
  RenderResponse,
} from './types'
export type { ComponentSchema } from './schema'
