------------------------------------
-- EasyAdmin Screenshot Capture
-- First-party replacement for screenshot-basic.
--
-- Flow:
--   1. Server triggers EasyAdmin:CaptureScreenshot on target player
--   2. Target's NUI captures a frame via Three.js + CfxTexture
--   3. NUI returns a webp data URI to this script
--   4. This script uploads the data URI to the configured image host
--   5. Result (hosted URL) is sent back to the server
------------------------------------

local pendingScreenshots = {} -- correlationId -> { timer, adminSrc }
local correlationId = 0

--- Generate a unique correlation ID for request/response matching.
local function nextCorrelationId()
    correlationId = correlationId + 1
    return tostring(correlationId)
end

--- Upload a data URI to the configured image host and return the response body.
---@param dataUri string  The base64 data URI from the NUI.
---@param callback fun(responseBody: string)  Called with the server response or 'ERROR'.
local function uploadScreenshot(dataUri, callback)
    local uploadUrl = GetConvar('ea_screenshoturl', 'none')
    if uploadUrl == 'none' or uploadUrl == '' then
        -- No external uploader configured — return the data URI as-is.
        -- The server can still display it in chat via <img src="data:...">
        callback(dataUri)
        return
    end

    local field = GetConvar('ea_screenshotfield', 'files[]')

    -- Convert data URI to a blob-like format for multipart upload.
    -- FiveM's PerformHttpRequest doesn't support FormData directly,
    -- so we send the data URI as JSON and let the endpoint handle it.
    PerformHttpRequest(uploadUrl, function(body, statusCode, headers)
        if statusCode and statusCode >= 200 and statusCode < 300 and body and body ~= '' then
            callback(body)
        else
            callback('ERROR')
        end
    , 'POST', json.encode({
        [field] = dataUri,
    }), {
        ['Content-Type'] = 'application/json',
    })
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

    -- Upload the data URI to the external image host
    uploadScreenshot(result, function(uploadResult)
        TriggerLatentServerEvent('EasyAdmin:TookScreenshot', 100000, uploadResult)
    end)
end)

--- Capture a screenshot of this player's screen.
--- Called via TriggerClientEvent from the server.
RegisterNetEvent('EasyAdmin:CaptureScreenshot', function()
    local maxResolution = GetConvarInt('ea_screenshotMaxResolution', 1280)
    local quality = GetConvarFloat('ea_screenshotQuality', 0.8)

    local id = nextCorrelationId()

    -- 25-second timeout (covers capture + upload)
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
