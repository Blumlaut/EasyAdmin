------------------------------------
-- EasyAdmin Plugin Registration API (client)
--
-- Registers the client-side export for external resources to call.
-- The shared logic (RegisterEasyAdminPlugin, registeredPlugins) is
-- defined in shared/plugin_api.lua and loaded first.
------------------------------------

-- Export for external resources (client-side callers).
-- Forwards registration to the server, which is the source of truth
-- and broadcasts to all clients.
exports('RegisterPlugin', function(config)
  if type(config) ~= 'table' then return end
  -- Capture the resource name before sending to server
  if not config.resourceName then
    local invoking = GetInvokingResource()
    if invoking then
      config.resourceName = invoking
    end
  end
  TriggerServerEvent('EasyAdmin:Plugin:registerFromClient', config)
end)

-- ── Receive server-networked registrations ──────────────────
-- The server broadcasts this after any registration (server export
-- or client-to-server). Clients store locally and push to NUI.
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

-- ── Cleanup when a plugin resource is stopped ──────────────────
-- Client-side: detect resource stop and ask server to unregister.
AddEventHandler('onResourceStop', function(resourceName)
  for _, plugin in pairs(GetRegisteredPlugins()) do
    if plugin.resourceName == resourceName then
      TriggerServerEvent('EasyAdmin:Plugin:unregisterFromClient', plugin.id)
      break
    end
  end
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
