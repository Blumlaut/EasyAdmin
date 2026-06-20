------------------------------------
-- EasyAdmin Live Stream
--
-- Server-side stream relay. One capture loop per target player,
-- multiple admins can subscribe to the same stream.
--
-- Flow:
--   1. Admin requests stream → server adds viewer, starts capture on target
--   2. Target's NUI captures frames → sends to server via LatentServerEvent
--   3. Server relays each frame to all subscribed viewers
--   4. Admin stops → server removes viewer; stops capture when last viewer leaves
------------------------------------

--- Active stream sessions.
--- streamSessions[targetId] = {
---   viewers = { [adminSrc] = true, ... },
---   started = timestamp,
---   timeout = timer reference (cleared on first frame),
---   firstFrameReceived = boolean (true once the first frame arrives),
--- }
local streamSessions = {}

--- Check if a stream is active for a target player.
--- @param targetId number  Target player server ID.
--- @return boolean
local function isStreaming(targetId)
    return streamSessions[targetId] ~= nil
end

exports('isStreamActive', function(targetId)
    return isStreaming(targetId)
end)

--- Add a viewer to a stream session. Creates the session if it doesn't exist.
--- @param targetId number  Target player server ID.
--- @param adminSrc number  Admin player server ID.
local function addViewer(targetId, adminSrc)
    local session = streamSessions[targetId]
    if not session then
        session = {
            viewers = {},
            started = os.time(),
            firstFrameReceived = false,
        }
        streamSessions[targetId] = session

        -- Start the capture loop on the target player's NUI
        TriggerClientEvent('EasyAdmin:StartStream', targetId)

        -- 10-second timeout: if no frames arrive, the capture likely failed
        session.timeout = SetTimeout(10000, function()
            if streamSessions[targetId] == session then
                if next(session.viewers) == nil then
                    -- No viewers and no frames — clean up silently
                    streamSessions[targetId] = nil
                elseif session.firstFrameReceived then
                    -- Frames are flowing, just clear the stale timeout reference
                    session.timeout = nil
                else
                    PrintDebugMessage("Stream timed out for player " .. getName(targetId, true), 2)
                    for viewer in pairs(session.viewers) do
                        TriggerClientEvent('EasyAdmin:StreamEnded', viewer, getName(targetId, true), 'Stream failed to start')
                        session.viewers[viewer] = nil
                    end
                    streamSessions[targetId] = nil
                end
            end
        end)
    end

    session.viewers[adminSrc] = true
end

--- Remove a viewer from a stream session. Stops capture when last viewer leaves.
--- @param targetId number  Target player server ID.
--- @param adminSrc number  Admin player server ID.
local function removeViewer(targetId, adminSrc)
    local session = streamSessions[targetId]
    if not session then return end

    session.viewers[adminSrc] = nil

    if next(session.viewers) == nil then
        -- Last viewer left — stop the capture loop
        if session.timeout then
            ClearTimeout(session.timeout)
            session.timeout = nil
        end
        TriggerClientEvent('EasyAdmin:StopStream', targetId)
        streamSessions[targetId] = nil
        PrintDebugMessage("Stream for player " .. getName(targetId, true) .. " stopped (no viewers)", 3)
    end
end

--- Force-stop a stream (target disconnected or admin command).
--- @param targetId number  Target player server ID.
local function forceStopStream(targetId)
    local session = streamSessions[targetId]
    if not session then return end

    if session.timeout then
        ClearTimeout(session.timeout)
    end

    local playerName = getName(targetId, true)
    for viewer in pairs(session.viewers) do
        TriggerClientEvent('EasyAdmin:StreamEnded', viewer, playerName, 'Target player disconnected')
    end

    streamSessions[targetId] = nil
end

--- Relay a frame from the target player to all subscribed viewers.
--- @param targetId number  Target player server ID.
--- @param frameData string  WebP data URI of the captured frame.
--- @param seq number  Monotonic sequence number from the capture side.
local function relayFrame(targetId, frameData, seq)
    local session = streamSessions[targetId]
    if not session then return end

    -- Mark first frame received so the timeout callback knows the stream is alive.
    -- ClearTimeout may not cancel a callback on the tick it fires, so the flag
    -- prevents a false "Stream timed out" message even if the callback runs late.
    session.firstFrameReceived = true
    if session.timeout then
        ClearTimeout(session.timeout)
        session.timeout = nil
    end

    local playerName = getName(targetId, true)
    for viewer in pairs(session.viewers) do
        TriggerClientEvent('EasyAdmin:StreamFrameReceived', viewer, frameData, playerName, targetId, seq)
    end
end

--- Admin requests to start watching a player's stream.
RegisterServerEvent('EasyAdmin:StartStream', function(playerId)
    local src = source
    if not playerId or not isPlayerOnline(playerId) then
        TriggerClientEvent('EasyAdmin:showNotification', src, 'Invalid player')
        return
    end

    if not DoesPlayerHavePermission(src, 'player.screenshot') then return end
    if not CanTargetPlayerForModeration(src, playerId) then return end

    -- Check if already viewing this stream
    local session = streamSessions[playerId]
    if session and session.viewers[src] then
        return -- Already watching
    end

    addViewer(playerId, src)
    TriggerClientEvent('EasyAdmin:showNotification', src, 'Streaming ' .. getName(playerId, true))
    PrintDebugMessage(getName(src, true) .. " started streaming " .. getName(playerId, true), 3)
end)

--- Admin stops watching a player's stream.
RegisterServerEvent('EasyAdmin:StopStream', function(playerId)
    local src = source
    if not playerId then return end

    removeViewer(playerId, src)
end)

--- Frame data from the target player's capture loop.
RegisterServerEvent('EasyAdmin:StreamFrame', function(frameData, seq)
    local targetId = source
    if not frameData or frameData == 'ERROR' then return end

    relayFrame(targetId, frameData, seq or 0)
end)

--- Handle target player disconnect — notify all viewers and clean up.
AddEventHandler('playerDropped', function()
    local targetId = source
    forceStopStream(targetId)
end)
