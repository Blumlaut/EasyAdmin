------------------------------------
-- EasyAdmin Stream Viewer (Admin Side)
--
-- Runs on the admin player. Receives stream frames from the server
-- and forwards them to the admin's NUI for display.
------------------------------------

--- Receive a stream frame from the server.
--- @param frameData string  WebP data URI of the captured frame.
--- @param playerName string Name of the player being streamed.
RegisterNetEvent('EasyAdmin:StreamFrameReceived', function(frameData, playerName)
    SendNUIMessage({
        action = 'stream:frame',
        data = {
            frame = frameData,
            playerName = playerName or 'Unknown',
        },
    })
end)

--- Stream ended notification from the server.
--- @param playerName string Name of the player whose stream ended.
--- @param reason string  Reason the stream ended.
RegisterNetEvent('EasyAdmin:StreamEnded', function(playerName, reason)
    SendNUIMessage({
        action = 'stream:ended',
        data = {
            playerName = playerName or 'Unknown',
            reason = reason or 'Stream ended',
        },
    })
end)
