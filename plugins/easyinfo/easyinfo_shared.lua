-- EasyInfo example plugin — shared setup
-- Adds the plugin's permission to the EasyAdmin permissions table.
--
-- This file runs on both client and server (loaded via plugins/**/*_shared.lua).
-- Permissions registered here are sent to the client during the admin session
-- handshake and can be checked with DoesPlayerHavePermission().

Citizen.CreateThread(function()
  -- Register a plugin-specific permission. Defaults to false (must be granted via ACL).
  permissions["plugin.easyinfo"] = false
end)
