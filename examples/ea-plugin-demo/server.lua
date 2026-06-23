-- ea-plugin-demo server script
-- Registers server-side handlers for plugin actions that require server
-- access. These are reached by buttons with `server = true` in the schema.

-- ---------------------------------------------------------------------------
-- Server handler: getServerData
-- ---------------------------------------------------------------------------
-- This handler is called when a button with `server = true` is clicked.
-- It MUST be permission-guarded because it exposes server state.

RegisterEasyAdminPluginServerHandler('ea-plugin-demo', 'getServerData', function(source, data)
  -- Always check permissions on server handlers
  if not DoesPlayerHavePermission(source, 'plugin.demo.advanced') then
    return {
      ok = false,
      error = 'permission denied',
    }
  end

  -- Gather some server state
  local playerCount = #GetPlayers()
  local maxPlayers = GetConvarInt('sv_maxclients', 32)

  return {
    ok = true,
    timestamp = os.time(),
    serverInfo = {
      playerCount = playerCount,
      maxPlayers = maxPlayers,
      resourceCount = #GetResources() - 1, -- subtract this resource
      serverUptime = GetGameTimer() / 1000,
    },
  }
end)

-- ---------------------------------------------------------------------------
-- Server handler: demoServerAction
-- ---------------------------------------------------------------------------
-- Another example server handler that demonstrates logging and state
-- modification.

RegisterEasyAdminPluginServerHandler('ea-plugin-demo', 'demoServerAction', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.demo.advanced') then
    return {
      ok = false,
      error = 'permission denied',
    }
  end

  -- Log the action
  print(('[Demo] Server action triggered by player %d (%s)'):format(
    source,
    GetPlayerName(source)
  ))

  return {
    ok = true,
    message = 'Server action completed successfully',
    triggeredBy = source,
  }
end)
