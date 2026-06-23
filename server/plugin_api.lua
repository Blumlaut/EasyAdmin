------------------------------------
-- EasyAdmin Plugin Registration API (server)
--
-- Registers the server-side export for external resources to call.
-- The shared logic (RegisterEasyAdminPlugin, registeredPlugins) is
-- defined in shared/plugin_api.lua and loaded first.
------------------------------------

-- Export for external resources
exports('RegisterPlugin', RegisterEasyAdminPlugin)
