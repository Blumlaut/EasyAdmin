------------------------------------
-- EasyAdmin Plugin Registration API (client)
--
-- Registers the client-side export for external resources to call.
-- The shared logic (RegisterEasyAdminPlugin, registeredPlugins) is
-- defined in shared/plugin_api.lua and loaded first.
------------------------------------

-- Export for external resources
exports('RegisterPlugin', function(config)
  return RegisterEasyAdminPlugin(config)
end)

-- ── Receive server-networked registrations ──────────────────
RegisterNetEvent('EasyAdmin:Plugin:registered')
AddEventHandler('EasyAdmin:Plugin:registered', function(config)
  if type(config) ~= 'table' then return end
  RegisterEasyAdminPlugin(config)
  SendNUIMessage({ action = 'pluginRegistered', data = config })
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
