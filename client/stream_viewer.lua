------------------------------------
-- EasyAdmin Stream Viewer (Admin Side) — WebRTC subscriber
--
-- Runs on the admin player. Receives control + signaling events from the server
-- and forwards them to the admin's NUI, which runs a StreamSubscriber that
-- answers the target's WebRTC offer and displays the incoming video stream.
------------------------------------

--- The stream session is live — open the viewer window.
--- @param playerId number  Server ID of the streamed player.
--- @param playerName string  Name of the streamed player.
--- @param opts table  Stream options (carries stunServers for the subscriber).
RegisterNetEvent('EasyAdmin:StreamStarted', function(playerId, playerName, opts)
    SendNUIMessage({
        action = 'stream:started',
        data = {
            playerId = playerId,
            playerName = playerName or 'Unknown',
            stunServers = (opts and opts.stunServers) or 'stun:stun.l.google.com:19302',
        },
    })
end)

--- Inbound signaling (an offer from the target's publisher) — forward to NUI.
--- @param from number  Server ID of the sending target.
--- @param payload table  Signal payload ({ type, sdp }).
RegisterNetEvent('EasyAdmin:StreamSignal', function(from, payload)
    SendNUIMessage({
        action = 'stream:signal',
        data = { from = from, payload = payload },
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

--- Admin closes the stream viewer — tell the server to remove us as a viewer.
RegisterNUICallback('stream:stop', function(data, cb)
    local id = tonumber(data and data.id)
    if id then
        TriggerServerEvent('EasyAdmin:StopStream', id)
    end
    cb({ ok = true })
end)
