------------------------------------
-- EasyAdmin Plugin Registration API (shared)
--
-- External resources register plugins at runtime via:
--
--   exports['easyadmin']:RegisterPlugin(config)
--
-- This file runs on both client and server (shared/). On the server,
-- registrations are networked to all clients. On the client, registrations
-- are stored locally and pushed to the NUI when the menu opens.
--
-- Plugins are NEVER compiled into EasyAdmin. They live in their own
-- resources and communicate exclusively through this API + the pluginCall
-- NUI bridge.
--
-- @see docs/nui-plugins.md
------------------------------------

-- Plugin registry (shared — server stores, client mirrors)
local registeredPlugins = {}

---Register a plugin from an external resource.
---@param config table @Plugin definition: { id, name, version, navItems, pages, ... }
function RegisterEasyAdminPlugin(config)
  if type(config) ~= 'table' then
    error('RegisterEasyAdminPlugin: config table required')
  end
  if type(config.id) ~= 'string' or config.id == '' then
    error('RegisterEasyAdminPlugin: config.id must be a non-empty string')
  end

  registeredPlugins[config.id] = config

  if IsDuplicityVersion() then
    -- Server: network to all clients
    TriggerClientEvent('EasyAdmin:Plugin:registered', -1, config)
  else
    -- Client: push to NUI immediately
    SendNUIMessage({ action = 'pluginRegistered', data = config })
  end
end

---Get all registered plugins (client-side, for NUI sync).
---@return table
function GetRegisteredPlugins()
  return registeredPlugins
end
