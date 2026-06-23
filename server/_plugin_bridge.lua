------------------------------------
-- EasyAdmin Server: Plugin bridge
--
-- Server-side plugin handler dispatch.
--
-- Because FiveM exports cannot pass functions between resources,
-- plugins register handlers by listening for events instead of
-- passing function references through exports.
--
-- Registration pattern (plugin side):
--   AddEventHandler('EasyAdmin:Plugin:serverAction:<pluginId>:<action>',
--     function(source, data, cb) cb(result) end)
--
-- Dispatch: EasyAdmin receives a `pluginCall` from the NUI with
-- `server = true`, triggers the event, and relays the response
-- back to the client via `EasyAdmin:Plugin:serverResponse`.
--
-- @see docs/nui-plugins.md
------------------------------------

-- Server handler registry: keyed by "pluginId:action"
-- Internal handlers registered via Lua (same-resource) still use this.
local serverPluginHandlers = {}

---Register a server-side Lua handler for a plugin action.
-- Only works when called from within the EasyAdmin resource itself
-- (functions cannot be passed across FiveM export boundaries).
---@param pluginId string @The plugin id (kebab-case, matches the NUI plugin)
---@param action string @The action name
---@param fn function @`function(source, data) -> any` — return value is relayed to the NUI
function RegisterEasyAdminPluginServerHandler(pluginId, action, fn)
  if type(pluginId) ~= 'string' or type(action) ~= 'string' or type(fn) ~= 'function' then
    error('RegisterEasyAdminPluginServerHandler(pluginId, action, fn) — all arguments required')
  end
  serverPluginHandlers[pluginId .. ':' .. action] = fn
end

-- ── Server event: dispatch server-side plugin calls ───────────
-- Triggered by client/nui/plugins.lua when a button with `server = true` is clicked.
-- The response is relayed back to the client via EasyAdmin:Plugin:serverResponse.
RegisterNetEvent('EasyAdmin:Plugin:serverCall')
AddEventHandler('EasyAdmin:Plugin:serverCall', function(pluginId, action, payload)
  local src = source

  if type(pluginId) ~= 'string' or type(action) ~= 'string' then
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, pluginId, action, { ok = false, error = 'missing pluginId or action' })
    return
  end

  local key = pluginId .. ':' .. action

  -- 1. Check internal handlers (same-resource registration)
  local handler = serverPluginHandlers[key]
  if handler then
    local ok, result = pcall(handler, src, payload)
    TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, pluginId, action, ok and (result or { ok = true }) or { ok = false, error = tostring(result) })
    return
  end

  -- 2. Trigger event for external resource handlers
  -- The plugin responds by calling cb(result).
  local responded = false
  local function respond(result)
    if not responded then
      responded = true
      TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, pluginId, action, result or { ok = true })
    end
  end

  -- Trigger the event; plugin should call respond(result)
  TriggerEvent('EasyAdmin:Plugin:serverAction:' .. key, src, payload, respond)

  -- Fallback if no plugin listens
  SetTimeout(500, function()
    if not responded then
      responded = true
      TriggerClientEvent('EasyAdmin:Plugin:serverResponse', src, pluginId, action, { ok = false, error = 'no server handler for ' .. key })
    end
  end)
end)
