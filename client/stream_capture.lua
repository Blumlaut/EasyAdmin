------------------------------------
-- EasyAdmin Stream Capture (Target Player)
--
-- Runs on the player being streamed. Receives start/stop commands from
-- the server and signals the NUI to begin/end the continuous capture loop.
------------------------------------

local streaming = false
local frameSeq = 0

--- Start the stream capture loop in the NUI.
RegisterNetEvent('EasyAdmin:StartStream', function()
    if streaming then return end
    streaming = true
    frameSeq = 0

    local maxResolution = GetConvarInt('ea_streamMaxResolution', 640)
    local quality = GetConvarFloat('ea_streamQuality', 0.3)
    local targetFps = GetConvarInt('ea_streamTargetFps', 8)

    SendNUIMessage({
        action = 'stream:start',
        data = {
            maxResolution = maxResolution,
            quality = quality,
            targetFps = targetFps,
        },
    })
end)

--- Stop the stream capture loop in the NUI.
RegisterNetEvent('EasyAdmin:StopStream', function()
    streaming = false
    SendNUIMessage({
        action = 'stream:stop',
    })
end)

--- Receive encoded frames from the NUI and forward to the server.
RegisterNUICallback('streamFrame', function(data, cb)
    cb({ ok = true })
    if not data or not data.frame then return end

    frameSeq = frameSeq + 1

    -- Send frame to server for relay to all viewers
    TriggerLatentServerEvent('EasyAdmin:StreamFrame', 100000, data.frame, frameSeq)
end)
