------------------------------------
-- EasyAdmin Stream Subscriber (Admin Side) — PeerJS viewer
--
-- Runs on the admin player. Receives control + signaling events from the server
-- and forwards them to the admin's NUI, which runs a StreamSubscriber React
-- component that initiates a PeerJS call to the target and displays the
-- incoming video stream.
------------------------------------

--- The stream session is live — open the viewer window.
--- @param targetId number  Server ID of the streamed player.
--- @param targetName string  Name of the streamed player.
--- @param config table  Stream config (stunUrls, turnUrls, turnUsername, turnCredential).
RegisterNetEvent('EasyAdmin:Stream:ViewerJoined', function(targetId, targetName, config)
    SendNUIMessage({
        action = 'streamSubscriber:start',
        data = {
            targetId = targetId,
            targetName = targetName or 'Unknown',
            iceConfig = config or {},
        },
    })
end)

--- The target's PeerJS ID is ready — the admin can initiate a call.
--- @param targetPeerId string  PeerJS ID of the target.
RegisterNetEvent('EasyAdmin:Stream:TargetReady', function(targetPeerId)
    SendNUIMessage({
        action = 'streamSubscriber:targetReady',
        data = { targetPeerId = targetPeerId },
    })
end)

--- Stream ended notification from the server.
--- @param targetName string Name of the player whose stream ended.
--- @param reason string  Reason the stream ended.
RegisterNetEvent('EasyAdmin:Stream:Ended', function(targetName, reason)
    SendNUIMessage({
        action = 'streamSubscriber:ended',
        data = {
            targetName = targetName or 'Unknown',
            reason = reason or 'Stream ended',
        },
    })
end)

--- NUI reports its PeerJS ID is ready.
--- Guard: server validates session membership.
RegisterNUICallback('streamSubscriber:peerReady', function(data, cb)
    cb({})
    if data and type(data.peerId) == 'string' then
        TriggerServerEvent('EasyAdmin:Stream:PeerReady', data.peerId)
    end
end)

--- Admin closes the stream viewer — tell the server to remove us as a viewer.
--- Guard: server checks DoesPlayerHavePermission + CanTargetPlayerForModeration.
RegisterNUICallback('streamSubscriber:stop', function(data, cb)
    cb({})
    if data and data.targetId then
        TriggerServerEvent('EasyAdmin:Stream:StopWatch', data.targetId)
    end
end)
