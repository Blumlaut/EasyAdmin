-- EasyInfo example plugin — server handler
--
-- Demonstrates a server-side plugin handler. The NUI reaches it by
-- passing `server = true` as the third argument to callLua:
--
--   api.callLua('getPlayerCount', undefined, true)
--
-- The client forwards the request to the server bridge, which dispatches
-- to the handler registered below. The handler receives (source, data)
-- and its return value is relayed back to the NUI.

RegisterEasyAdminPluginServerHandler("easyinfo", "getPlayerCount", function(source, _data)
  return {
    ok = true,
    count = #GetPlayers(),
    requestedBy = source,
  }
end)
