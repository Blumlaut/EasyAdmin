------------------------------------
-- EasyAdmin Stream Publisher (Target Player) — PeerJS publisher
--
-- Runs on the player being streamed. Receives control + signaling events from
-- the server and forwards them to the NUI, which runs a StreamPublisher React
-- component that renders the game frame to a canvas and publishes it
-- peer-to-peer over WebRTC via PeerJS.
--
-- The target initiates WebRTC calls to viewers so the SDP offer contains
-- the video track (answers can only include media types that were offered).
------------------------------------

local STREAM_LOG = '[EA-Stream-Publisher]'

--- Start the publisher on the target's NUI (first viewer joined).
--- @param config table  Stream config (stunUrls, turnUrls, turnUsername, turnCredential, targetFps).
RegisterNetEvent('EasyAdmin:Stream:StartPublishing', function(config)
    print(STREAM_LOG, 'Received StartPublishing on serverID', PlayerId(), 'config:', json.encode(config or {}))
    SendNUIMessage({
        action = 'streamPublisher:start',
        data = config or {},
    })
    print(STREAM_LOG, 'Sent streamPublisher:start to NUI')
end)

--- Stop the publisher on the target's NUI (last viewer left).
RegisterNetEvent('EasyAdmin:Stream:StopPublishing', function()
    print(STREAM_LOG, 'Received StopPublishing')
    SendNUIMessage({
        action = 'streamPublisher:stop',
    })
end)

--- Initiate a WebRTC call to a specific viewer.
--- @param viewerSrc number  Server ID of the admin viewer.
--- @param viewerPeerId string  PeerJS ID of the viewer.
RegisterNetEvent('EasyAdmin:Stream:CallViewer', function(viewerSrc, viewerPeerId)
    print(STREAM_LOG, 'Received CallViewer — viewerSrc:', viewerSrc, 'viewerPeerId:', viewerPeerId)
    SendNUIMessage({
        action = 'streamPublisher:callViewer',
        data = { viewerSrc = viewerSrc, viewerPeerId = viewerPeerId },
    })
    print(STREAM_LOG, 'Sent streamPublisher:callViewer to NUI')
end)

--- A viewer left — close their PeerJS connection.
--- @param viewerSrc number  Server ID of the admin viewer.
RegisterNetEvent('EasyAdmin:Stream:RemoveViewer', function(viewerSrc)
    print(STREAM_LOG, 'Received RemoveViewer — viewerSrc:', viewerSrc)
    SendNUIMessage({
        action = 'streamPublisher:removeViewer',
        data = { viewerSrc = viewerSrc },
    })
end)

--- NUI reports its PeerJS ID is ready.
RegisterNUICallback('streamPublisher:peerReady', function(data, cb)
    print(STREAM_LOG, 'Received peerReady from NUI — peerId:', data and data.peerId or 'nil')
    cb({})
    if data and type(data.peerId) == 'string' then
        TriggerServerEvent('EasyAdmin:Stream:PeerReady', data.peerId, 'target')
        print(STREAM_LOG, 'Forwarded PeerReady (target) to server')
    end
end)
