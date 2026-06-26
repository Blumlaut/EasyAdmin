------------------------------------
-- EasyAdmin Screenshot Capture
-- First-party replacement for screenshot-basic.
--
-- Flow:
--   1. Server triggers EasyAdmin:CaptureScreenshot on target player
--   2. Target's NUI captures a frame via Three.js + CfxTexture
--   3. NUI returns a webp data URI via NUICallback
--   4. Promise resolves, Citizen.Await returns, result sent to server
------------------------------------

local correlationId = 0

--- Generate a unique correlation ID for request/response matching.
local function nextCorrelationId()
    correlationId = correlationId + 1
    return tostring(correlationId)
end

--- NUICallback: receives the screenshot data URI from the NUI.
--- Resolves the promise so the waiting thread can continue.
RegisterNUICallback('screenshotResult', function(data, cb)
    cb({ ok = true })

    local id = data.correlationId
    local pending = EasyAdminScreenshotPending
    if not pending or pending.id ~= id then
        return
    end

    pending.promise:resolve(data.data or 'ERROR')
end)

--- Capture a screenshot of this player's screen.
--- Called via TriggerClientEvent from the server.
--- RegisterNetEvent handlers run in their own thread, so Citizen.Await is safe.
RegisterNetEvent('EasyAdmin:CaptureScreenshot', function()
    local maxResolution = GetConvarInt('ea_screenshotMaxResolution', 1280)
    local quality = GetConvarFloat('ea_screenshotQuality', 0.8)

    local id = nextCorrelationId()
    local p = promise.new()

    -- Track the current pending request globally so the NUICallback can find it.
    EasyAdminScreenshotPending = { id = id, promise = p }

    -- Timeout rejects the promise if NUI doesn't respond in 25s.
    SetTimeout(25000, function()
        if EasyAdminScreenshotPending and EasyAdminScreenshotPending.id == id then
            p:reject('timeout')
        end
    end)

    -- Send capture request to the NUI
    SendNUIMessage({
        action = 'screenshot:request',
        data = {
            correlationId = id,
            maxResolution = maxResolution,
            quality = quality,
        },
    })

    -- Block until the promise is resolved (NUICallback) or rejected (timeout).
    local result = Citizen.Await(p)

    -- Clean up regardless of outcome.
    if EasyAdminScreenshotPending and EasyAdminScreenshotPending.id == id then
        EasyAdminScreenshotPending = nil
    end

    if result == 'timeout' then
        TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, 'ERROR')
        return
    end

    if result == 'ERROR' then
        TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, 'ERROR')
        return
    end

    -- Send data URI directly to server (relay to admin)
    TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, result)
end)
