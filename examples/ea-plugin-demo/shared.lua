-- ea-plugin-demo shared script
-- Runs on both client and server.
--
-- Registers a custom permission that this plugin uses to gate one of its
-- player-detail tabs and a server handler.

Citizen.CreateThread(function()
  -- Wait for EasyAdmin's permissions table to be available.
  -- In a real plugin you may need a longer wait or an event-based signal.
  while permissions == nil do
    Citizen.Wait(50)
  end

  -- Register two permissions:
  --   plugin.demo          — gates the entire plugin (optional, see below)
  --   plugin.demo.advanced — gates the "Advanced" player tab + server handler
  permissions['plugin.demo'] = false
  permissions['plugin.demo.advanced'] = false
end)
