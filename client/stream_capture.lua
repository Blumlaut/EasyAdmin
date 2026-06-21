------------------------------------
-- EasyAdmin Stream Capture (Target Player) — WebRTC publisher
--
-- Runs on the player being streamed. Receives control + signaling events from
-- the server and forwards them to the NUI, which runs a StreamPublisher that
-- renders the game frame to a canvas and publishes it peer-to-peer over WebRTC.
------------------------------------

--- Start the publisher on the target's NUI (first viewer).
--- @param opts table  Stream options (maxResolution, targetFps, stunServers).
RegisterNetEvent('EasyAdmin:StreamStart', function(opts)
    SendNUIMessage({
        action = 'stream:start',
        data = opts or {},
    })
end)

--- Stop the publisher on the target's NUI (last viewer left).
RegisterNetEvent('EasyAdmin:StreamStop', function()
    SendNUIMessage({
        action = 'stream:teardown',
    })
end)

--- A new viewer joined — negotiate a PeerConnection for them.
--- @param viewerSrc number  Server ID of the admin viewer.
RegisterNetEvent('EasyAdmin:StreamAddViewer', function(viewerSrc)
    SendNUIMessage({
        action = 'stream:addViewer',
        data = { viewerSrc = viewerSrc },
    })
end)

--- A viewer left — close their PeerConnection.
--- @param viewerSrc number  Server ID of the admin viewer.
RegisterNetEvent('EasyAdmin:StreamRemoveViewer', function(viewerSrc)
    SendNUIMessage({
        action = 'stream:removeViewer',
        data = { viewerSrc = viewerSrc },
    })
end)

--- Inbound signaling (an answer from a viewer) — forward to the NUI.
--- @param from number  Server ID of the sending viewer.
--- @param payload table  Signal payload ({ type, sdp }).
RegisterNetEvent('EasyAdmin:StreamSignal', function(from, payload)
    SendNUIMessage({
        action = 'stream:signal',
        data = { from = from, payload = payload },
    })
end)

--- Forward a signaling message from the NUI to the server for relay.
--- Shared by both target and viewer roles (both call this NUI callback).
RegisterNUICallback('streamSignal', function(data, cb)
    cb({ ok = true })
    if not data or type(data.to) ~= 'number' or type(data.payload) ~= 'table' then return end
    TriggerServerEvent('EasyAdmin:StreamSignal', data.to, data.payload)
end)
