------------------------------------
-- EasyAdmin Plugin Registration API (shared)
--
-- External resources register plugins at runtime via:
--
--   exports.EasyAdmin:RegisterPlugin(config)
--
-- This file runs on both client and server (shared/). Plugins MUST
-- register via the server export only — the server is the source of
-- truth and broadcasts registrations to all clients.
--
-- On the server: registrations are stored and networked to all clients.
-- On the client: registrations are received from the server broadcast,
-- stored locally, and pushed to the NUI by client/plugin_api.lua.
--
-- Plugins are NEVER compiled into EasyAdmin. They live in their own
-- resources and communicate exclusively through this API + the pluginCall
-- NUI bridge.
--
-- @see docs/nui-plugins.md
------------------------------------

-- Plugin registry (shared — server stores, client mirrors)
local registeredPlugins = {}

---Register permissions declared by a plugin.
-- Adds them to the global permissions table so that:
--   1. DoesPlayerHavePermission() can check them
--   2. The admin session handshake (EasyAdmin:amiadmin) exposes them to clients
--   3. ACL grants (easyadmin.<perm>) work as expected
-- Only runs server-side (IsDuplicityVersion()).
---@param perms string[] @Array of permission strings (e.g. {"plugin.demo", "plugin.demo.advanced"})
local function registerPluginPermissions(perms)
  if type(perms) ~= 'table' then return end
  for i = 1, #perms do
    local perm = perms[i]
    if type(perm) == 'string' and perm ~= '' then
      permissions[perm] = false
    end
  end
end

---Remove permissions that were registered by a plugin.
-- Only runs server-side (IsDuplicityVersion()).
---@param perms string[] @Array of permission strings to remove
local function unregisterPluginPermissions(perms)
  if type(perms) ~= 'table' then return end
  for i = 1, #perms do
    local perm = perms[i]
    if type(perm) == 'string' and permissions[perm] ~= nil then
      permissions[perm] = nil
    end
  end
end

---Register a plugin from an external resource.
-- Called on the server (via export) and on the client (via server
-- broadcast event). The server is the source of truth; clients
-- mirror the server's registry.
--
-- Config shape:
--   { id, name, version, icon,
--     permissions?,        -- string[] of permission keys this plugin uses
--     navItems?,           -- sidebar entries (each may have a permission gate)
--     pages?,              -- view → renderAction mappings
--     playerDetailTabs?,   -- tabs injected into player detail
--     dashboardWidgets?    -- widgets on the dashboard
--   }
---@param config table @Plugin definition
function RegisterEasyAdminPlugin(config)
  if type(config) ~= 'table' then
    error('RegisterEasyAdminPlugin: config table required')
  end
  if type(config.id) ~= 'string' or config.id == '' then
    error('RegisterEasyAdminPlugin: config.id must be a non-empty string')
  end

  -- Track the invoking resource so we can clean up on resource stop.
  -- On the server (export call): GetInvokingResource() returns the caller.
  -- On the client (server broadcast event): already set by the server.
  if not config.resourceName then
    local invoking = GetInvokingResource()
    if invoking then
      config.resourceName = invoking
    end
  end

  registeredPlugins[config.id] = config

  if IsDuplicityVersion() then
    -- Server: register plugin permissions so they're recognised by
    -- DoesPlayerHavePermission() and the admin session handshake.
    if config.permissions then
      registerPluginPermissions(config.permissions)
    end

    -- Network to all clients
    TriggerClientEvent('EasyAdmin:Plugin:registered', -1, config)
  end
  -- Client: NUI push is handled by the event handler in client/plugin_api.lua
end

---Unregister a plugin (called internally when a plugin resource stops).
-- Also removes any permissions the plugin registered.
---@param pluginId string @The plugin id to remove
function UnregisterEasyAdminPlugin(pluginId)
  if type(pluginId) ~= 'string' then return end
  local plugin = registeredPlugins[pluginId]
  if not plugin then return end

  if IsDuplicityVersion() and plugin.permissions then
    unregisterPluginPermissions(plugin.permissions)
  end

  registeredPlugins[pluginId] = nil

  if IsDuplicityVersion() then
    -- Server: network unregistration to all clients
    TriggerClientEvent('EasyAdmin:Plugin:unregistered', -1, pluginId)
  end
  -- Client: NUI push is handled by the event handler in client/plugin_api.lua
end

---Get all registered plugins (client-side, for NUI sync).
---@return table
function GetRegisteredPlugins()
  return registeredPlugins
end
