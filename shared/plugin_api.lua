------------------------------------
-- EasyAdmin Plugin Registration API (shared)
--
-- External resources register plugins at runtime via:
--
--   exports.EasyAdmin:RegisterPlugin(config)
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
-- Called on the server (via export or client-to-server event) and
-- on the client (via server-to-client event). The server is the
-- source of truth; clients mirror the server's registry.
---@param config table @Plugin definition: { id, name, version, navItems, pages, ... }
function RegisterEasyAdminPlugin(config)
  if type(config) ~= 'table' then
    error('RegisterEasyAdminPlugin: config table required')
  end
  if type(config.id) ~= 'string' or config.id == '' then
    error('RegisterEasyAdminPlugin: config.id must be a non-empty string')
  end

  -- Track the invoking resource so we can clean up on resource stop.
  -- On the server (export call): GetInvokingResource() returns the caller.
  -- On the server (client net event): nil — use resourceName passed by client.
  -- On the client (server net event): already set by the server.
  if not config.resourceName then
    local invoking = GetInvokingResource()
    if invoking then
      config.resourceName = invoking
    end
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

---Unregister a plugin (called internally when a plugin resource stops).
---@param pluginId string @The plugin id to remove
function UnregisterEasyAdminPlugin(pluginId)
  if type(pluginId) ~= 'string' then return end
  if not registeredPlugins[pluginId] then return end

  registeredPlugins[pluginId] = nil

  if IsDuplicityVersion() then
    -- Server: network unregistration to all clients
    TriggerClientEvent('EasyAdmin:Plugin:unregistered', -1, pluginId)
  else
    -- Client: notify NUI
    SendNUIMessage({ action = 'pluginUnregistered', data = { pluginId = pluginId } })
  end
end

---Get all registered plugins (client-side, for NUI sync).
---@return table
function GetRegisteredPlugins()
  return registeredPlugins
end
