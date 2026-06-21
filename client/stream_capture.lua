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
---
--- Uses a latent server event so large frame payloads do not block the
--- target player's network channel. bps MUST stay above the frame production
--- rate (targetFps * avgFrameBytes), otherwise FiveM's latent-event queue on
--- this client grows without bound — that shows up as a memory leak / freeze
--- on the player being streamed. Default 200000 (~195 KB/s) gives headroom
--- over 8 FPS * ~15 KB; tune via `ea_streamBitrate`.
RegisterNUICallback('streamFrame', function(data, cb)
    cb({ ok = true })
    if not data or not data.frame then return end

    frameSeq = frameSeq + 1

    local bps = GetConvarInt('ea_streamBitrate', 200000)
    TriggerLatentServerEvent('EasyAdmin:StreamFrame', bps, data.frame, frameSeq)
end)
