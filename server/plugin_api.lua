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
