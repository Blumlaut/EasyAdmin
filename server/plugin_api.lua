------------------------------------
-- EasyAdmin Plugin Registration API (server)
--
-- Registers the server-side export for external resources to call.
-- The shared logic (RegisterEasyAdminPlugin, registeredPlugins) is
-- defined in shared/plugin_api.lua and loaded first.
------------------------------------

-- Export for external resources (server-side callers)
exports('RegisterPlugin', function(config)
  return RegisterEasyAdminPlugin(config)
end)

-- ── Receive plugin registrations from clients ──────────────────
-- When a plugin calls exports.EasyAdmin:RegisterPlugin() from a
-- client script, the client export forwards it here. The server
-- is the source of truth — it stores the plugin and broadcasts
-- to all clients.
RegisterNetEvent('EasyAdmin:Plugin:registerFromClient')
AddEventHandler('EasyAdmin:Plugin:registerFromClient', function(config)
  if type(config) ~= 'table' then return end
  RegisterEasyAdminPlugin(config)
end)

-- ── Receive unregistration requests from clients ───────────────
-- When a plugin resource stops, the client detects it and asks
-- the server to unregister. The server broadcasts to all clients.
RegisterNetEvent('EasyAdmin:Plugin:unregisterFromClient')
AddEventHandler('EasyAdmin:Plugin:unregisterFromClient', function(pluginId)
  if type(pluginId) ~= 'string' then return end
  UnregisterEasyAdminPlugin(pluginId)
end)

-- ── Cleanup when a plugin resource is stopped ──────────────────
-- Server-side safety net: if a plugin that registered via the
-- server export is stopped, clean it up even if the client
-- didn't notify us.
AddEventHandler('onResourceStop', function(resourceName)
  for _, plugin in pairs(GetRegisteredPlugins()) do
    if plugin.resourceName == resourceName then
      UnregisterEasyAdminPlugin(plugin.id)
    end
  end
end)
