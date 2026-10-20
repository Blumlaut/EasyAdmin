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

-- ── Refresh a plugin view ───────────────────────────────────
-- A plugin resource cannot send NUI messages to us: SendNUIMessage reaches the
-- calling resource's own page, and a plugin has none. So plugins ask us to
-- refresh a view they own, addressed so only that view re-fetches.
--
-- Address: target = 'page' | 'tab' | 'widget', id = the page view, tab id or
-- widget id, playerId narrows a tab. Omit all three to refresh every view.
local function pushPluginRefresh(pluginId, target, id, playerId)
  if type(pluginId) ~= 'string' or pluginId == '' then return false end
  if target ~= nil and target ~= 'page' and target ~= 'tab' and target ~= 'widget' then return false end
  if id ~= nil and type(id) ~= 'string' then return false end
  if playerId ~= nil and type(playerId) ~= 'number' then return false end

  SendNUIMessage({
    action = 'pluginRefresh',
    data = {
      pluginId = pluginId,
      target = target,
      id = id,
      playerId = playerId,
    },
  })
  return true
end

-- server-driven refresh: TriggerClientEvent('EasyAdmin:Plugin:refresh', src, pluginId, target, id, playerId)
RegisterNetEvent('EasyAdmin:Plugin:refresh')
AddEventHandler('EasyAdmin:Plugin:refresh', pushPluginRefresh)

-- client-driven refresh for the plugin's own client script
-- a plugin may only refresh its own views, never another plugin's
exports('RefreshPlugin', function(pluginId, target, id, playerId)
  if type(pluginId) ~= 'string' then return false end

  local plugin = GetRegisteredPlugins()[pluginId]
  if not plugin then return false end

  local invoking = GetInvokingResource()
  if invoking and plugin.resourceName and invoking ~= plugin.resourceName then
    return false
  end

  return pushPluginRefresh(pluginId, target, id, playerId)
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
