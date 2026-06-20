------------------------------------
-- EasyAdmin Stream Viewer (Admin Side)
--
-- Runs on the admin player. Receives stream frames from the server
-- and forwards them to the admin's NUI for display.
------------------------------------

--- Receive a stream frame from the server.
--- @param frameData string  WebP data URI of the captured frame.
--- @param playerName string Name of the player being streamed.
--- @param playerId number Server ID of the target player.
--- @param seq number Monotonic sequence number from the capture side.
RegisterNetEvent('EasyAdmin:StreamFrameReceived', function(frameData, playerName, playerId, seq)
    SendNUIMessage({
        action = 'stream:frame',
        data = {
            frame = frameData,
            playerName = playerName or 'Unknown',
            playerId = playerId or 0,
            seq = seq or 0,
        },
    })
end)

--- Admin closes the stream viewer — tell the server to remove us as a viewer.
RegisterNUICallback('stream:stop', function(data, cb)
    local id = tonumber(data and data.id)
    if id then
        TriggerServerEvent('EasyAdmin:StopStream', id)
    end
    cb({ ok = true })
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
