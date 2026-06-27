-- ea-plugin-demo server script
--
-- Plugin registration and server-side handlers.
-- Uses events (FiveM exports cannot pass functions between resources).
--
-- Plugin registration MUST happen server-side. The server is the source
-- of truth — it stores the plugin config and broadcasts to all clients.

-- ---------------------------------------------------------------------------
-- Plugin registration
-- ---------------------------------------------------------------------------

exports.EasyAdmin:RegisterPlugin({
  id = 'ea-plugin-demo',
  name = 'Plugin Demo',
  version = '1.0.0',
  icon = 'box',

  -- Permissions this plugin uses. EasyAdmin registers them server-side
  -- so they're recognised by DoesPlayerHavePermission() and the admin
  -- session handshake.
  permissions = {
    'plugin.demo',
    'plugin.demo.advanced',
  },

  navItems = {
    { id = 'plugin:ea-plugin-demo', label = 'Demo', icon = 'box' },
    {
      id = 'plugin:ea-plugin-demo:category',
      label = 'Plugin Tools',
      icon = 'layers',
      children = {
        { id = 'plugin:ea-plugin-demo:stats', label = 'Stats', icon = 'chart-bar' },
        { id = 'plugin:ea-plugin-demo:actions', label = 'Actions', icon = 'zap', permission = 'plugin.demo.advanced' },
      },
    },
  },

  pages = {
    { view = 'plugin:ea-plugin-demo', renderAction = 'renderMainPage' },
    { view = 'plugin:ea-plugin-demo:stats', renderAction = 'renderStatsPage' },
    { view = 'plugin:ea-plugin-demo:actions', renderAction = 'renderActionsPage' },
  },

  playerDetailTabs = {
    { id = 'demo-public', label = 'Demo Info', icon = 'box', renderAction = 'renderPlayerTab' },
    {
      id = 'demo-advanced',
      label = 'Advanced',
      icon = 'shield',
      permission = 'plugin.demo.advanced',
      renderAction = 'renderPlayerAdvancedTab',
    },
  },

  dashboardWidgets = {
    { id = 'demo-widget', renderAction = 'renderWidget', order = 150 },
  },
})

-- ---------------------------------------------------------------------------
-- Server handler: getServerData
-- Called by the "Get Server Data" button on the main page.
-- Returns server state that the client stores and displays on re-fetch.

AddEventHandler('EasyAdmin:Plugin:serverAction:ea-plugin-demo:getServerData', function(source, data, cb)
  if not DoesPlayerHavePermission(source, 'plugin.demo.advanced') then
    return cb({ ok = false, error = 'Requires permission: plugin.demo.advanced' })
  end

  local playerCount = #GetPlayers()
  local maxPlayers = GetConvarInt('sv_maxclients', 32)

  local result = {
    ok = true,
    tick = GetGameTimer(),
    playerCount = playerCount,
    maxPlayers = maxPlayers,
    resourceCount = #GetResources() - 1,
    uptime = GetGameTimer() / 1000,
  }

  -- Send to client so it can store the data before NUI re-fetches
  TriggerClientEvent('ea-plugin-demo:serverData', source, result)
  cb(result)
end)
