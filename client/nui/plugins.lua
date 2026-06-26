------------------------------------
-- EasyAdmin NUI: Plugin bridge
--
-- Routes NUI `pluginCall` requests to Lua handlers registered by external
-- plugin resources.
--
-- Because FiveM exports cannot pass functions between resources,
-- plugins register handlers by listening for events:
--   AddEventHandler('EasyAdmin:Plugin:action:<pluginId>:<action>',
--     function(data, cb) cb(result) end)
--
-- @see docs/nui-plugins.md
------------------------------------

-- Client handler registry: keyed by "pluginId:action"
-- Internal handlers registered via Lua (same-resource) still use this.
local pluginHandlers = {}

---Register a client-side Lua handler for a plugin action.
-- Only works when called from within the EasyAdmin resource itself.
---@param pluginId string
---@param action string
---@param fn function @`function(data) -> any`
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

-- ── NUI callback: sync plugins on mount ──────────────────────
-- Called by the NUI on mount to get the current plugin list.
-- Avoids race conditions where SendNUIMessage fires before NUI is ready.
RegisterNUICallback('syncPlugins', function()
  local dict = GetRegisteredPlugins()
  local list = {}
  for _, plugin in pairs(dict) do
    list[#list + 1] = plugin
  end
  return { plugins = list }
end)

-- ── Server-side forwarding ────────────────────────────────────
-- For actions with `server = true`: ask the server via net event,
-- then the server triggers an event for the plugin and relays the
-- response back via EasyAdmin:Plugin:serverResponse net event.

RegisterNetEvent('EasyAdmin:Plugin:serverResponse')
AddEventHandler('EasyAdmin:Plugin:serverResponse', function(pluginId, action, result)
  SendNUIMessage({
    action = 'pluginResponse',
    data = { pluginId = pluginId, action = action, response = result or { ok = true } },
  })
end)

-- ── NUI callback: pluginCall ──────────────────────────────────
-- Payload: { pluginId = string, action = string, data = table, server = boolean }
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
    TriggerServerEvent('EasyAdmin:Plugin:serverCall', pluginId, action, payload)
    cb({ ok = true, deferred = true })
    return
  end

  -- Client-side handler lookup
  local key = pluginId .. ':' .. action
  local handler = pluginHandlers[key]
  if handler then
    local ok, result = pcall(handler, payload)
    cb(ok and (result or { ok = true }) or { ok = false, error = tostring(result) })
    return
  end

  -- Trigger event for external resource handlers
  local responded = false
  local function respond(result)
    if not responded then
      responded = true
      cb(result or { ok = true })
    end
  end

  TriggerEvent('EasyAdmin:Plugin:action:' .. key, payload, respond)

  -- Fallback if no plugin listens
  SetTimeout(500, function()
    if not responded then
      responded = true
      cb({ ok = false, error = 'no handler registered for ' .. key })
    end
  end)
end)
