------------------------------------
-- EasyAdmin Server: Plugin bridge
--
-- Server-side counterpart to client/nui/plugins.lua.
--
-- Plugins register server-side handlers via RegisterEasyAdminPluginServerHandler.
-- The client forwards `pluginCall` requests with `server = true` to the
-- `EasyAdmin:Plugin:serverCall` event, which dispatches here and relays
-- the response back to the client.
--
-- @see docs/nui-plugins.md
------------------------------------

-- Server handler registry: keyed by "pluginId:action"
local serverPluginHandlers = {}

---Register a server-side Lua handler for a plugin action.
---@param pluginId string @The plugin id (kebab-case, matches the NUI plugin)
---@param action string @The action name
---@param fn function @`function(source, data) -> any` — return value is relayed to the NUI
function RegisterEasyAdminPluginServerHandler(pluginId, action, fn)
  if type(pluginId) ~= 'string' or type(action) ~= 'string' or type(fn) ~= 'function' then
    error('RegisterEasyAdminPluginServerHandler(pluginId, action, fn) — all arguments required')
  end
  serverPluginHandlers[pluginId .. ':' .. action] = fn
end

RegisterNetEvent('EasyAdmin:Plugin:serverCall')
AddEventHandler('EasyAdmin:Plugin:serverCall', function(pluginId, action, payload, requestId)
  local src = source

  if type(pluginId) ~= 'string' or type(action) ~= 'string' then
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, requestId, { ok = false, error = 'missing pluginId or action' })
    return
  end

  local key = pluginId .. ':' .. action
  local handler = serverPluginHandlers[key]
  if not handler then
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, requestId, { ok = false, error = 'no server handler for ' .. key })
    return
  end

  local ok, result = pcall(handler, src, payload or {})
  if ok then
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, requestId, result or { ok = true })
  else
    print(('[EasyAdmin Plugin] server handler %s failed: %s'):format(key, tostring(result)))
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, requestId, { ok = false, error = tostring(result) })
  end
end)
