-- ea-plugin-demo client script
--
-- Demonstrates the EasyAdmin plugin system.
-- All handlers use events (FiveM exports cannot pass functions between resources).
--
-- Note: Plugin registration (RegisterPlugin) is done in server.lua.
-- The client script only registers event handlers for actions/re-renders.

-- ---------------------------------------------------------------------------
-- Shared state (persists across re-renders)
-- ---------------------------------------------------------------------------

local state = {
  toggleCount = 0,
  serverData = nil,
  lastRefresh = 0,
}

-- Receive server data from the "Get Server Data" button.
-- The server sends this via net event so the client can store it
-- before the NUI re-fetches the page.
RegisterNetEvent('ea-plugin-demo:serverData')
AddEventHandler('ea-plugin-demo:serverData', function(result)
  if result.ok then
    state.serverData = result
  end
end)

-- ---------------------------------------------------------------------------
-- Render handlers (return full page schema)
-- ---------------------------------------------------------------------------

-- Main page: realistic dashboard that keeps its layout on re-fetch
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderMainPage', function(data, cb)
  local players = GetActivePlayers()
  local playerCount = #players
  local fps = 0
  local ft = GetFrameTime()
  if ft and ft > 0 then fps = math.floor(1.0 / ft) end

  state.lastRefresh = GetGameTimer()

  cb({
    { type = 'heading', text = 'Plugin Demo — Main Page', level = 2 },
    { type = 'text', text = 'This page is rendered by a runtime plugin. The layout stays the same on re-fetch; only the data updates.', variant = 'muted' },

    { type = 'row', gap = 3, children = {
        { type = 'stat-card', label = 'Players', value = tostring(playerCount), icon = 'users', iconColor = 'var(--accent-green)', bgColor = 'var(--bg-green)' },
        { type = 'stat-card', label = 'FPS', value = tostring(fps), icon = 'gauge', iconColor = 'var(--accent-orange)', bgColor = 'var(--bg-orange)' },
        { type = 'stat-card', label = 'Toggles', value = tostring(state.toggleCount), icon = 'zap', iconColor = 'var(--accent-blue)', bgColor = 'var(--bg-blue)' },
      }},

    { type = 'divider' },

    -- Server data section (populated by "Get Server Data" button)
    { type = 'card', children = {
        { type = 'heading', text = 'Server Data', level = 4 },
        { type = 'text', text = state.serverData and 'Fetched at tick ' .. tostring(state.serverData.tick) or 'Click "Get Server Data" below to populate this section.', variant = 'muted' },
        state.serverData and {
          type = 'key-value-table',
          rows = {
            { key = 'Players', value = tostring(state.serverData.playerCount) },
            { key = 'Max Players', value = tostring(state.serverData.maxPlayers) },
            { key = 'Resources', value = tostring(state.serverData.resourceCount) },
            { key = 'Uptime', value = string.format('%.1fs', state.serverData.uptime) },
          },
        } or nil,
      }},

    { type = 'divider' },

    -- Buttons with self-describing labels
    { type = 'card', children = {
        { type = 'heading', text = 'Button Behaviours', level = 4 },
        { type = 'text', text = 'Each button demonstrates a different plugin action pattern.', variant = 'muted' },
        { type = 'row', gap = 2, children = {
            { type = 'button', label = 'Re-fetch Page', action = 'refetchPage', icon = 'refresh', variant = 'primary', size = 'sm' },
            { type = 'button', label = 'Toggle Counter', action = 'toggleCounter', icon = 'zap', variant = 'secondary', size = 'sm' },
            { type = 'button', label = 'Get Server Data', action = 'getServerData', server = true, icon = 'server', variant = 'danger', size = 'sm' },
            { type = 'button', label = 'Replace Page', action = 'replacePage', icon = 'arrow-right-arrow-left', variant = 'ghost', size = 'sm' },
          }},
      }},

    { type = 'divider' },

    { type = 'card', children = {
        { type = 'heading', text = 'Plugin Info', level = 4 },
        { type = 'key-value-table', rows = {
            { key = 'Plugin ID', value = 'ea-plugin-demo' },
            { key = 'Version', value = '1.0.0' },
            { key = 'Last Refresh', value = tostring(state.lastRefresh) },
          }},
      }},
  })
end)

-- Stats page: bar chart demo
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderStatsPage', function(data, cb)
  cb({
    { type = 'heading', text = 'Plugin Demo — Stats Page', level = 2 },
    { type = 'text', text = 'Demonstrates the bar chart component with static data.', variant = 'muted' },
    { type = 'card', children = {
        { type = 'heading', text = 'Sample Data (Last 7 Days)', level = 4 },
        { type = 'bar-chart', items = {
            { label = 'Mon', value = 12 },
            { label = 'Tue', value = 8, color = 'var(--accent-orange)' },
            { label = 'Wed', value = 15 },
            { label = 'Thu', value = 22 },
            { label = 'Fri', value = 30 },
            { label = 'Sat', value = 45 },
            { label = 'Sun', value = 38 },
          }},
      }},
    { type = 'card', children = {
        { type = 'heading', text = 'Resource Usage', level = 4 },
        { type = 'bar-chart', items = {
            { label = 'CPU', value = 65 },
            { label = 'RAM', value = 45, color = 'var(--accent-blue)' },
            { label = 'GPU', value = 30 },
            { label = 'Network', value = 20 },
          }},
      }},
  })
end)

-- Actions page: explains the plugin system
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderActionsPage', function(data, cb)
  cb({
    { type = 'heading', text = 'Plugin Demo — How It Works', level = 2 },
    { type = 'text', text = 'This page explains the plugin architecture.', variant = 'muted' },
    { type = 'card', children = {
        { type = 'heading', text = 'Registration', level = 4 },
        { type = 'text', text = 'Plugins register via exports.EasyAdmin:RegisterPlugin(config). The config defines nav items, pages, tabs, and widgets.' },
      }},
    { type = 'card', children = {
        { type = 'heading', text = 'Handlers', level = 4 },
        { type = 'text', text = 'FiveM exports cannot pass functions between resources. Handlers use AddEventHandler instead. EasyAdmin triggers an event and the plugin responds via cb(result).' },
      }},
    { type = 'card', children = {
        { type = 'heading', text = 'Button Actions', level = 4 },
        { type = 'text', text = 'When a button is clicked, pluginCall routes to the matching event handler. If the handler returns a schema array, the page is replaced. If it returns anything else, the original render action is re-fetched.' },
      }},
    { type = 'card', children = {
        { type = 'heading', text = 'Server Actions', level = 4 },
        { type = 'text', text = 'Buttons with server = true are forwarded to the server. The server triggers an event, the plugin responds, and the result is relayed back to the NUI.' },
      }},
  })
end)

-- Player detail tab
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderPlayerTab', function(data, cb)
  local playerId = data.context.playerId
  local name = 'Unknown'
  if playerId and playerId > 0 then
    name = GetPlayerName(playerId)
  end

  cb({
    { type = 'heading', text = 'Demo Info Tab', level = 3 },
    { type = 'text', text = 'Injected into the player detail page by a runtime plugin.', variant = 'muted' },
    { type = 'key-value-table', rows = {
        { key = 'Player ID', value = playerId and tostring(playerId) or 'N/A' },
        { key = 'Name', value = name },
        { key = 'License', value = playerId and 'license:' .. playerId or 'N/A', mono = true },
        { key = 'Identifiers', value = playerId and 'license:' .. playerId .. ', ip:127.0.0.1' or 'N/A', mono = true },
      }},
  })
end)

-- Advanced player tab
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderPlayerAdvancedTab', function(data, cb)
  local playerId = data.context.playerId

  cb({
    { type = 'heading', text = 'Advanced Tab', level = 3 },
    { type = 'alert', variant = 'warning', title = 'Permission-gated', children = {
        { type = 'text', text = 'This tab requires "plugin.demo.advanced". It is hidden from admins without that permission.', variant = 'muted' },
      }},
    { type = 'key-value-table', rows = {
        { key = 'Player ID', value = playerId and tostring(playerId) or 'N/A' },
        { key = 'Ping', value = playerId and tostring(math.random(10, 100)) .. 'ms' or 'N/A' },
        { key = 'Permission', value = 'plugin.demo.advanced' },
      }},
  })
end)

-- Dashboard widget
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:renderWidget', function(data, cb)
  local players = GetActivePlayers()

  cb({
    { type = 'card', children = {
        { type = 'row', gap = 2, children = {
            { type = 'icon', name = 'users', size = 'md' },
            { type = 'col', gap = 0, children = {
                { type = 'text', text = 'Players Online', variant = 'small' },
                { type = 'text', text = tostring(#players), variant = 'muted' },
              }},
          }},
      }},
  })
end)

-- ---------------------------------------------------------------------------
-- Action handlers (called by buttons)
-- ---------------------------------------------------------------------------

-- Re-fetch page: returns non-schema data, triggers re-fetch of renderMainPage
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:refetchPage', function(data, cb)
  cb({ ok = true, message = 'Re-fetching page' })
end)

-- Toggle counter: increments state, returns non-schema to re-fetch
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:toggleCounter', function(data, cb)
  state.toggleCount = state.toggleCount + 1
  cb({ ok = true, count = state.toggleCount })
end)

-- Replace page: returns a schema array, replaces the entire page
AddEventHandler('EasyAdmin:Plugin:action:ea-plugin-demo:replacePage', function(data, cb)
  cb({
    { type = 'heading', text = 'Page Replaced', level = 2 },
    { type = 'text', text = 'This entire page was returned by the "replacePage" action handler. The original layout is gone until you navigate away and back.', variant = 'muted' },
    { type = 'alert', variant = 'info', title = 'How it works', children = {
        { type = 'text', text = 'When a button handler returns an array of schema components, the page is replaced with that schema. Non-schema responses trigger a re-fetch of the original render action instead.' },
      }},
    { type = 'badge', text = 'Replaced', variant = 'online', icon = 'check-circle' },
  })
end)
