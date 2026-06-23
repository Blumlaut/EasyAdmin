/**
 * EasyAdmin NUI Plugin SDK — public barrel export.
 *
 * Plugin authors import everything they need from here:
 *
 * ```ts
 * import type { EasyAdminPlugin, PluginPageProps } from '../../plugins'
 * import { usePluginApi } from '../../plugins'
 * ```
 */

export type {
  EasyAdminPlugin,
  EasyAdminPluginContext,
  PluginNavItem,
  PluginPage,
  PluginPageProps,
  PlayerDetailTab,
  PlayerDetailTabProps,
  DashboardWidget,
  DashboardWidgetProps,
} from './types'

export { registerPlugin, getRegisteredPlugins, getPluginErrors } from './registry'
export { PluginApiProvider, usePluginApi, callLuaPlugin } from './api'
export { usePluginContributions } from './usePluginContributions'
export type { PluginContributions } from './usePluginContributions'
