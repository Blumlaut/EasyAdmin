------------------------------------
-- EasyAdmin Live Stream — Server Signaling (WebRTC)
--
-- The server no longer relays video frames. Video flows peer-to-peer over
-- WebRTC between the target's NUI and each viewer's NUI. The server's only job
-- is session bookkeeping and relaying the tiny SDP/ICE signaling messages.
--
-- Flow:
--   1. Admin requests stream → server adds viewer, tells target to start its
--      publisher (first viewer) and to negotiate a PeerConnection for the new
--      viewer; tells the viewer the session is live.
--   2. Target's NUI creates an RTCPeerConnection per viewer, sends an offer;
--      viewer's NUI answers. Signaling crosses the server as small JSON.
--   3. Video flows directly target → viewer (SRTP). No per-frame events.
--   4. Admin stops / target disconnects → server tears down the session.
------------------------------------

--- Active stream sessions.
--- streamSessions[targetId] = {
---   viewers = { [adminSrc] = true, ... },
---   started = timestamp,
---   timeout = timer reference (cleared on first viewer confirm),
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

--- Stream options sent to the target's publisher NUI.
local function buildStartOptions()
    return {
        maxResolution = GetConvarInt('ea_streamMaxResolution', 640),
        targetFps = GetConvarInt('ea_streamTargetFps', 8),
        stunServers = GetConvar('ea_streamStunServers', 'stun:stun.l.google.com:19302'),
    }
end

--- Add a viewer to a stream session. Creates the session if it doesn't exist.
--- @param targetId number  Target player server ID.
--- @param adminSrc number  Admin player server ID.
--- @return boolean isFirst  true if this created a new session.
local function addViewer(targetId, adminSrc)
    local session = streamSessions[targetId]
    local isFirst = session == nil

    if isFirst then
        session = {
            viewers = {},
            started = os.time(),
        }
        streamSessions[targetId] = session

        -- 10-second timeout: if the target never confirms, the publisher likely
        -- failed to start (e.g. WebRTC/captureStream unsupported in their CEF).
        session.timeout = SetTimeout(10000, function()
            if streamSessions[targetId] == session and next(session.viewers) ~= nil then
                PrintDebugMessage("Stream failed to start for player " .. getName(targetId, true), 2)
                for viewer in pairs(session.viewers) do
                    TriggerClientEvent('EasyAdmin:StreamEnded', viewer, getName(targetId, true), 'Stream failed to start')
                    session.viewers[viewer] = nil
                end
                streamSessions[targetId] = nil
            end
        end)

        -- Start the publisher on the target (first viewer only).
        TriggerClientEvent('EasyAdmin:StreamStart', targetId, buildStartOptions())
    end

    session.viewers[adminSrc] = true
    return isFirst
end

--- Remove a viewer from a stream session. Stops the publisher when the last
--- viewer leaves.
--- @param targetId number  Target player server ID.
--- @param adminSrc number  Admin player server ID.
local function removeViewer(targetId, adminSrc)
    local session = streamSessions[targetId]
    if not session then return end

    session.viewers[adminSrc] = nil

    -- Tell the target to drop this viewer's PeerConnection.
    TriggerClientEvent('EasyAdmin:StreamRemoveViewer', targetId, adminSrc)

    if next(session.viewers) == nil then
        -- Last viewer left — stop the publisher entirely.
        if session.timeout then
            ClearTimeout(session.timeout)
            session.timeout = nil
        end
        TriggerClientEvent('EasyAdmin:StreamStop', targetId)
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

    -- Ask the target to negotiate a PeerConnection for this viewer.
    TriggerClientEvent('EasyAdmin:StreamAddViewer', playerId, src)

    -- Open the viewer window on the admin side.
    TriggerClientEvent('EasyAdmin:StreamStarted', src, playerId, getName(playerId, true), buildStartOptions())

    TriggerClientEvent('EasyAdmin:showNotification', src, 'Streaming ' .. getName(playerId, true))
    PrintDebugMessage(getName(src, true) .. " started streaming " .. getName(playerId, true), 3)
end)

--- Admin stops watching a player's stream.
RegisterServerEvent('EasyAdmin:StopStream', function(playerId)
    local src = source
    if not DoesPlayerHavePermission(src, 'player.screenshot') then return end
    if not playerId then return end
    removeViewer(playerId, src)
end)

--- Relay a WebRTC signaling message from one peer to another.
--- `to` is the destination player src; the sender is implicit (source).
--- Only relayed within an active session (sender must be the target or a viewer).
--- @ea-audit:exempt Session membership is the guard — target players aren't admins, and viewers are validated against streamSessions.
RegisterServerEvent('EasyAdmin:StreamSignal', function(to, payload)
    local src = source
    if type(to) ~= 'number' or type(payload) ~= 'table' then return end

    -- Sender must be part of a stream session — either as a target (their
    -- session exists) or as a viewer of some session. This prevents random
    -- clients from signaling arbitrary players.
    local senderIsTarget = streamSessions[src] ~= nil
    local senderIsViewer = false
    if not senderIsTarget then
        for _, session in pairs(streamSessions) do
            if session.viewers[src] then
                senderIsViewer = true
                break
            end
        end
    end
    if not senderIsTarget and not senderIsViewer then return end

    TriggerClientEvent('EasyAdmin:StreamSignal', to, src, payload)
end)

--- Handle target player disconnect — notify all viewers and clean up.
AddEventHandler('playerDropped', function()
    local targetId = source
    forceStopStream(targetId)
end)
