------------------------------------
-- EasyAdmin Plugin Registration API (client)
--
-- Receives plugin registrations broadcast from the server and
-- pushes them to the NUI.
--
-- Plugins register server-side via exports.EasyAdmin:RegisterPlugin().
-- The server broadcasts to all clients, which store locally and
-- push to the NUI. Client scripts in plugin resources only need
-- to register event handlers for actions/re-renders.
------------------------------------

-- ── Receive server-networked registrations ──────────────────
-- The server broadcasts this after any registration. Clients
-- store locally and push to NUI.
RegisterNetEvent('EasyAdmin:Plugin:registered')
AddEventHandler('EasyAdmin:Plugin:registered', function(config)
  if type(config) ~= 'table' then return end
  RegisterEasyAdminPlugin(config)
  SendNUIMessage({ action = 'pluginRegistered', data = config })
end)

-- ── Receive server-networked unregistrations ─────────────────
RegisterNetEvent('EasyAdmin:Plugin:unregistered')
AddEventHandler('EasyAdmin:Plugin:unregistered', function(pluginId)
  if type(pluginId) ~= 'string' then return end
  UnregisterEasyAdminPlugin(pluginId)
  SendNUIMessage({ action = 'pluginUnregistered', data = { pluginId = pluginId } })
end)

-- ── Sync all plugins to NUI when menu opens ─────────────────
RegisterNetEvent('EasyAdmin:syncPluginsToNUI')
AddEventHandler('EasyAdmin:syncPluginsToNUI', function()
  local dict = GetRegisteredPlugins()
  local list = {}
  for _, plugin in pairs(dict) do
    list[#list + 1] = plugin
  end
  SendNUIMessage({ action = 'pluginsRegistered', data = { plugins = list } })
end)
