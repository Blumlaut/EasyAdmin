------------------------------------
-- EasyAdmin Stream Publisher (Target Player) — PeerJS publisher
--
-- Runs on the player being streamed. Receives control + signaling events from
-- the server and forwards them to the NUI, which runs a StreamPublisher React
-- component that renders the game frame to a canvas and publishes it
-- peer-to-peer over WebRTC via PeerJS.
------------------------------------

--- Start the publisher on the target's NUI (first viewer joined).
--- @param config table  Stream config (stunUrls, turnUrls, turnUsername, turnCredential, targetFps).
RegisterNetEvent('EasyAdmin:Stream:StartPublishing', function(config)
    SendNUIMessage({
        action = 'streamPublisher:start',
        data = config or {},
    })
end)

--- Stop the publisher on the target's NUI (last viewer left).
RegisterNetEvent('EasyAdmin:Stream:StopPublishing', function()
    SendNUIMessage({
        action = 'streamPublisher:stop',
    })
end)

--- A new viewer joined — the target should expect an incoming PeerJS call.
--- @param viewerSrc number  Server ID of the admin viewer.
RegisterNetEvent('EasyAdmin:Stream:AddViewer', function(viewerSrc)
    SendNUIMessage({
        action = 'streamPublisher:addViewer',
        data = { viewerSrc = viewerSrc },
    })
end)

--- A viewer left — close their PeerJS connection.
--- @param viewerSrc number  Server ID of the admin viewer.
RegisterNetEvent('EasyAdmin:Stream:RemoveViewer', function(viewerSrc)
    SendNUIMessage({
        action = 'streamPublisher:removeViewer',
        data = { viewerSrc = viewerSrc },
    })
end)

--- NUI reports its PeerJS ID is ready.
RegisterNUICallback('streamPublisher:peerReady', function(data, cb)
    cb({})
    if data and type(data.peerId) == 'string' then
        TriggerServerEvent('EasyAdmin:Stream:PeerReady', data.peerId)
    end
end)
