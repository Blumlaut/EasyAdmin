------------------------------------
-- EasyAdmin NUI: Plugin bridge
--
-- Routes NUI `pluginCall` requests to Lua handlers registered by plugins.
--
-- This is the Lua half of the NUI plugin system. The NUI side calls
-- `api.callLua(action, data)` (see nui/src/plugins/api.tsx) which POSTs
-- to the `pluginCall` NUI callback; this file dispatches to the matching
-- handler.
--
-- Two handler registries exist:
--   • Client handlers  — RegisterEasyAdminPluginHandler(pluginId, action, fn)
--   • Server handlers  — registered via the server-side bridge
--     (server/_plugin_bridge.lua) and reached by passing `server = true`
--     in the NUI request payload.
--
-- @see docs/nui-plugins.md
------------------------------------

-- Client handler registry: keyed by "pluginId:action"
local pluginHandlers = {}

---Register a client-side Lua handler for a plugin action.
---@param pluginId string @The plugin id (kebab-case, matches the NUI plugin)
---@param action string @The action name (matches the `action` arg passed to `api.callLua`)
---@param fn function @`function(data) -> any` — return value is sent back to the NUI
function RegisterEasyAdminPluginHandler(pluginId, action, fn)
  if type(pluginId) ~= 'string' or type(action) ~= 'string' or type(fn) ~= 'function' then
    error('RegisterEasyAdminPluginHandler(pluginId, action, fn) — all arguments required')
  end
  pluginHandlers[pluginId .. ':' .. action] = fn
end

---Check whether a client handler is registered.
---@param pluginId string
---@param action string
---@return boolean
function HasEasyAdminPluginHandler(pluginId, action)
  return pluginHandlers[pluginId .. ':' .. action] ~= nil
end

-- ── Server-side forwarding ────────────────────────────────────
-- When a plugin needs server-side data it passes `server = true` in the
-- callLua payload. The client forwards to the `EasyAdmin:Plugin:serverCall`
-- event (handled by server/_plugin_bridge.lua) and relays the response.

local pendingServerRequests = {}
local requestCounter = 0

RegisterNetEvent('EasyAdmin:Plugin:serverResponse')
AddEventHandler('EasyAdmin:Plugin:serverResponse', function(requestId, result)
  local entry = pendingServerRequests[requestId]
  if entry then
    pendingServerRequests[requestId] = nil
    entry(result or { ok = true })
  end
end)

local function forwardToServer(pluginId, action, payload, cb)
  requestCounter = requestCounter + 1
  local requestId = ('%d:%d'):format(GetPlayerServerId(PlayerId()), requestCounter)
  pendingServerRequests[requestId] = cb
  TriggerServerEvent('EasyAdmin:Plugin:serverCall', pluginId, action, payload, requestId)
end

-- ── NUI callback: pluginCall ──────────────────────────────────
-- Payload: { pluginId = string, action = string, data = table, server = boolean }
-- Response: whatever the handler returns, or { ok = false, error = string }
RegisterNUICallback('pluginCall', function(data, cb)
  if type(data) ~= 'table' then
    cb({ ok = false, error = 'invalid payload' })
    return
  end

  local pluginId = data.pluginId
  local action = data.action
  local payload = data.data or {}

  if type(pluginId) ~= 'string' or type(action) ~= 'string' then
    cb({ ok = false, error = 'missing pluginId or action' })
    return
  end

  -- Server-side handler?
  if data.server == true then
    forwardToServer(pluginId, action, payload, cb)
    return
  end

  -- Client-side handler lookup
  local key = pluginId .. ':' .. action
  local handler = pluginHandlers[key]
  if not handler then
    cb({ ok = false, error = 'no handler registered for ' .. key })
    return
  end

  local ok, result = pcall(handler, payload)
  if ok then
    cb(result or { ok = true })
  else
    print(('[EasyAdmin Plugin] handler %s failed: %s'):format(key, tostring(result)))
    cb({ ok = false, error = tostring(result) })
  end
end)
