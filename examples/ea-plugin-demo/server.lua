-- ea-plugin-demo server script
--
-- Server-side handlers for plugin actions with `server = true`.
-- Uses events (FiveM exports cannot pass functions between resources).

-- Server handler: getServerData
-- Called by the "Get Server Data" button on the main page.
-- Returns server state that the client stores and displays on re-fetch.

AddEventHandler('EasyAdmin:Plugin:serverAction:ea-plugin-demo:getServerData', function(source, data, cb)
  if not DoesPlayerHavePermission(source, 'plugin.demo.advanced') then
    return cb({ ok = false, error = 'Requires permission: plugin.demo.advanced' })
  end

  local playerCount = #GetPlayers()
  local maxPlayers = GetConvarInt('sv_maxclients', 32)

  local result = {
    ok = true,
    tick = GetGameTimer(),
    playerCount = playerCount,
    maxPlayers = maxPlayers,
    resourceCount = #GetResources() - 1,
    uptime = GetGameTimer() / 1000,
  }

  -- Send to client so it can store the data before NUI re-fetches
  TriggerClientEvent('ea-plugin-demo:serverData', source, result)
  cb(result)
end)
