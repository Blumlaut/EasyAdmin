------------------------------------
-- EasyAdmin Plugin Registration API (server)
--
-- Registers the server-side export for external resources to call.
-- The shared logic (RegisterEasyAdminPlugin, registeredPlugins) is
-- defined in shared/plugin_api.lua and loaded first.
--
-- Plugins MUST register via the server export only. The server is the
-- source of truth — it stores the plugin and broadcasts to all clients.
-- Client-to-server registration events have been removed for security
-- (GetInvokingResource() cannot be trusted for client-triggered events).
------------------------------------

-- Export for external resources (server-side callers only).
-- GetInvokingResource() is trustworthy for server-to-server exports,
-- so the calling resource is properly captured.
exports('RegisterPlugin', function(config)
  return RegisterEasyAdminPlugin(config)
end)

-- ── Sync all registered plugins to a requesting client ────────
-- Called by the client when the admin menu opens. The server is the
-- source of truth — it pushes its full plugin list so that clients
-- who connected after plugins registered still see them.
RegisterNetEvent('EasyAdmin:syncPluginsFromServer')
AddEventHandler('EasyAdmin:syncPluginsFromServer', function()
  local src = source
  local dict = GetRegisteredPlugins()
  local list = {}
  for _, plugin in pairs(dict) do
    list[#list + 1] = plugin
  end
  -- Replays each registration so the client-side registry is populated,
  -- then sends the full list to the NUI in one shot.
  for _, plugin in ipairs(list) do
    TriggerClientEvent('EasyAdmin:Plugin:registered', src, plugin)
  end
  TriggerClientEvent('EasyAdmin:syncPluginsToNUI', src)
end)

-- ── Cleanup when a plugin resource is stopped ──────────────────
-- If a plugin that registered via the server export is stopped,
-- clean it up automatically.
AddEventHandler('onResourceStop', function(resourceName)
  for _, plugin in pairs(GetRegisteredPlugins()) do
    if plugin.resourceName == resourceName then
      UnregisterEasyAdminPlugin(plugin.id)
    end
  end
end)
