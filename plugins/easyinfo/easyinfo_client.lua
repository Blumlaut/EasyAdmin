-- EasyInfo example plugin — client handlers
--
-- Registers the Lua handlers that the EasyInfo NUI plugin calls via
-- `api.callLua(action, data)`. Each handler is registered with
-- RegisterEasyAdminPluginHandler(pluginId, action, fn) and receives the
-- data payload sent from the NUI. Whatever it returns is relayed back.
--
-- @see docs/nui-plugins.md

-- getServerInfo — returns live client-side server metrics.
RegisterEasyAdminPluginHandler("easyinfo", "getServerInfo", function(_data)
  local players = GetActivePlayers and #GetActivePlayers() or 0
  local gameName = (RedM and "RedM") or "FiveM"
  return {
    ok = true,
    resourceName = "EasyAdmin",
    uptimeMs = GetGameTimer and GetGameTimer() or 0,
    playerCount = players,
    frameRate = math.floor(1.0 / GetFrameTime()),
    gameName = gameName,
  }
end)

-- getPlayerNotes — returns example notes for a player.
-- Demonstrates receiving data sent from the NUI.
RegisterEasyAdminPluginHandler("easyinfo", "getPlayerNotes", function(data)
  local playerId = data.playerId
  return {
    ok = true,
    {
      text = ("This is an example note for player %s, created by the EasyInfo plugin."):format(tostring(playerId)),
      author = "EasyInfo Plugin",
      timestamp = os.time(),
    },
  }
end)

-- getStatus — dashboard widget status check.
RegisterEasyAdminPluginHandler("easyinfo", "getStatus", function(_data)
  return {
    ok = true,
    online = true,
    latencyMs = math.random(5, 40),
  }
end)
