/**
 * EasyInfo — Example EasyAdmin NUI Plugin
 *
 * A complete, installable example plugin demonstrating every contribution
 * type the plugin system supports:
 *
 *  - A sidebar nav item ("Server Info") → routes to a custom page
 *  - A full page (ServerInfoPage) that calls a Lua handler
 *  - A player-detail tab ("Plugin Notes") injected into the player page
 *  - A dashboard widget (status card)
 *  - An `onActivate` lifecycle hook
 *  - Permission gating
 *
 * The matching Lua handlers live in `plugins/easyinfo/easyinfo_client.lua`.
 *
 * @see docs/nui-plugins.md for the authoring guide.
 */

import type { EasyAdminPlugin } from '../index'
import './example.css'
import { ServerInfoPage } from './ServerInfoPage'
import { PlayerNotesTab } from './PlayerNotesTab'
import { PluginStatusWidget } from './PluginStatusWidget'

const PLUGIN_VIEW = 'plugin:easyinfo'

const easyInfoPlugin: EasyAdminPlugin = {
  id: 'easyinfo',
  name: 'EasyInfo',
  version: '1.0.0',
  author: 'EasyAdmin Team',
  description: 'Example plugin showcasing the EasyAdmin NUI plugin system.',
  icon: 'info',

  // No plugin-level `permission` → visible to all admins by default.
  // To gate the whole plugin, set `permission: 'plugin.easyinfo'` and grant
  // the `easyadmin.plugin.easyinfo` ACE. See docs/nui-plugins.md.

  navItems: [
    {
      id: PLUGIN_VIEW,
      view: PLUGIN_VIEW,
      label: 'Server Info',
      icon: 'info',
    },
  ],

  pages: [
    {
      view: PLUGIN_VIEW,
      component: ServerInfoPage,
    },
  ],

  playerDetailTabs: [
    {
      id: 'notes',
      label: 'Plugin Notes',
      icon: 'book-open',
      component: PlayerNotesTab,
    },
  ],

  dashboardWidgets: [
    {
      id: 'status',
      component: PluginStatusWidget,
      order: 200,
    },
  ],

  onActivate(ctx) {
    // Subscribe to a server-pushed event for this plugin.
    const unsubscribe = ctx.on<{ message: string }>('easyinfo:broadcast', (data) => {
      ctx.notify(data.message, 'info')
    })
    return unsubscribe
  },
}

export default easyInfoPlugin
