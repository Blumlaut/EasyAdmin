------------------------------------
-- EasyAdmin Screenshot Capture
-- First-party replacement for screenshot-basic.
--
-- Flow:
--   1. Server triggers EasyAdmin:CaptureScreenshot on target player
--   2. Target's NUI captures a frame via Three.js + CfxTexture
--   3. NUI returns a webp data URI to this script
--   4. Data URI is sent to the server, which relays it to the requesting admin
------------------------------------

local pendingScreenshots = {} -- correlationId -> { timer }
local correlationId = 0

--- Generate a unique correlation ID for request/response matching.
local function nextCorrelationId()
    correlationId = correlationId + 1
    return tostring(correlationId)
end

--- NUICallback: receives the screenshot data URI from the NUI.
RegisterNUICallback('screenshotResult', function(data, cb)
    cb({ ok = true })

    local id = data.correlationId
    local entry = pendingScreenshots[id]
    if not entry then return end

    -- Cancel the timeout
    if entry.timer then
        CancelTimeout(entry.timer)
        entry.timer = nil
    end

    pendingScreenshots[id] = nil

    local result = data.data or 'ERROR'

    if result == 'ERROR' then
        -- Capture failed on the NUI side
        TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, 'ERROR')
        return
    end

    -- Send data URI directly to server (relay to admin)
    TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, result)
end)

--- Capture a screenshot of this player's screen.
--- Called via TriggerClientEvent from the server.
RegisterNetEvent('EasyAdmin:CaptureScreenshot', function()
    local maxResolution = GetConvarInt('ea_screenshotMaxResolution', 1280)
    local quality = GetConvarFloat('ea_screenshotQuality', 0.8)

    local id = nextCorrelationId()

    -- 25-second timeout (covers capture)
    local timer = SetTimeout(25000, function()
        if pendingScreenshots[id] then
            pendingScreenshots[id] = nil
            TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, 'ERROR')
        end
    end)

    pendingScreenshots[id] = { timer = timer }

    -- Send capture request to the NUI
    SendNUIMessage({
        action = 'screenshot:request',
        data = {
            correlationId = id,
            maxResolution = maxResolution,
            quality = quality,
        },
    })
end)
