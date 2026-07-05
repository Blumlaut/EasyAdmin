------------------------------------
-- EasyAdmin Stream Subscriber (Admin Side) — PeerJS viewer
--
-- Runs on the admin player. Receives control + signaling events from the server
-- and forwards them to the admin's NUI, which runs a StreamSubscriber React
-- component that creates a PeerJS instance and waits for the target to call.
--
-- The target (publisher) initiates the WebRTC call because the caller's SDP
-- offer must contain the media tracks.
------------------------------------

local STREAM_LOG = '[EA-Stream-Subscriber]'

--- The stream session is live — open the viewer window.
--- @param targetId number  Server ID of the streamed player.
--- @param targetName string  Name of the streamed player.
--- @param config table  Stream config (stunUrls, turnUrls, turnUsername, turnCredential).
RegisterNetEvent('EasyAdmin:Stream:ViewerJoined', function(targetId, targetName, config)
    print(STREAM_LOG, 'Received ViewerJoined — targetId:', targetId, 'targetName:', targetName)
    SendNUIMessage({
        action = 'streamSubscriber:start',
        data = {
            targetId = targetId,
            targetName = targetName or 'Unknown',
            iceConfig = config or {},
        },
    })
    print(STREAM_LOG, 'Sent streamSubscriber:start to NUI')
end)

--- Stream ended notification from the server.
--- @param targetName string Name of the player whose stream ended.
--- @param reason string  Reason the stream ended.
RegisterNetEvent('EasyAdmin:Stream:Ended', function(targetName, reason)
    print(STREAM_LOG, 'Received Ended — targetName:', targetName, 'reason:', reason)
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
    print(STREAM_LOG, 'Received peerReady from NUI — peerId:', data and data.peerId or 'nil')
    cb({})
    if data and type(data.peerId) == 'string' then
        TriggerServerEvent('EasyAdmin:Stream:PeerReady', data.peerId, 'viewer')
        print(STREAM_LOG, 'Forwarded PeerReady (viewer) to server')
    end
end)

--- Admin closes the stream viewer — tell the server to remove us as a viewer.
--- Guard: server checks DoesPlayerHavePermission + CanTargetPlayerForModeration.
RegisterNUICallback('streamSubscriber:stop', function(data, cb)
    print(STREAM_LOG, 'Received stop from NUI — targetId:', data and data.targetId or 'nil')
    cb({})
    if data and data.targetId then
        TriggerServerEvent('EasyAdmin:Stream:StopWatch', data.targetId)
    end
end)
