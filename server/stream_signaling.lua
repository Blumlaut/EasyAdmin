------------------------------------
-- EasyAdmin Live Stream — Server Signaling (PeerJS + WebRTC)
--
-- The server relays only tiny signaling messages between peers. Video flows
-- peer-to-peer over WebRTC (SRTP) via PeerJS. The server's responsibilities:
--
--   1. Session bookkeeping (targetId → viewers)
--   2. Permission guard chain on StartWatch / StopWatch
--   3. Session membership guard on signaling relay
--   4. Peer-ready handshake (relay peerIds between target and viewers)
--   5. Cleanup on player disconnect
------------------------------------

--- Active stream sessions.
--- streamSessions[targetId] = {
---   viewers = { [adminSrc] = { peerId = string | nil } },
---   targetPeerId = string | nil,
---   started = timestamp,
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

--- Build the ICE configuration payload sent to NUI peers.
local function buildIceConfig()
    local stunRaw = GetConvar('ea_streamStunServers', 'stun:stun.l.google.com:19302')
    local turnRaw = GetConvar('ea_streamTurnServers', '')
    local turnUser = GetConvar('ea_streamTurnUser', '')
    local turnPass = GetConvar('ea_streamTurnPassword', '')

    local stunUrls = {}
    for url in stunRaw:gmatch('[^,]+') do
        url = url:gsub('^%s*(.-)%s*$', '%1')
        if #url > 0 then table.insert(stunUrls, url) end
    end

    local turnUrls = {}
    if #turnRaw > 0 then
        for url in turnRaw:gmatch('[^,]+') do
            url = url:gsub('^%s*(.-)%s*$', '%1')
            if #url > 0 then table.insert(turnUrls, url) end
        end
    end

    return {
        stunUrls = stunUrls,
        turnUrls = turnUrls,
        turnUsername = turnUser,
        turnCredential = turnPass,
        targetFps = GetConvarInt('ea_streamTargetFps', 8),
    }
end

--- Notify all viewers of a target that the target's peerId is ready.
--- @param targetId number
local function broadcastTargetReady(targetId)
    local session = streamSessions[targetId]
    if not session or not session.targetPeerId then return end
    for adminSrc in pairs(session.viewers) do
        TriggerClientEvent('EasyAdmin:Stream:TargetReady', adminSrc, session.targetPeerId)
    end
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

        -- Start the publisher on the target (first viewer only).
        TriggerClientEvent('EasyAdmin:Stream:StartPublishing', targetId, buildIceConfig())
    end

    session.viewers[adminSrc] = { peerId = nil }

    -- Ask the target to expect a new viewer.
    TriggerClientEvent('EasyAdmin:Stream:AddViewer', targetId, adminSrc)

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

    -- Tell the target to drop this viewer's connection.
    TriggerClientEvent('EasyAdmin:Stream:RemoveViewer', targetId, adminSrc)

    if next(session.viewers) == nil then
        -- Last viewer left — stop the publisher entirely.
        TriggerClientEvent('EasyAdmin:Stream:StopPublishing', targetId)
        streamSessions[targetId] = nil
        PrintDebugMessage("Stream for player " .. getName(targetId, true) .. " stopped (no viewers)", 3)
    end
end

--- Force-stop a stream (target disconnected or admin command).
--- @param targetId number  Target player server ID.
local function forceStopStream(targetId)
    local session = streamSessions[targetId]
    if not session then return end

    local playerName = getName(targetId, true)
    for viewerSrc in pairs(session.viewers) do
        TriggerClientEvent('EasyAdmin:Stream:Ended', viewerSrc, playerName, 'Target player disconnected')
    end

    -- Also tell the target to clean up.
    TriggerClientEvent('EasyAdmin:Stream:StopPublishing', targetId)
    streamSessions[targetId] = nil
end

--- Admin requests to start watching a player's stream.
RegisterServerEvent('EasyAdmin:Stream:StartWatch', function(targetId)
    local src = source

    -- 1. Validate the target exists and is online
    if not targetId or not isPlayerOnline(targetId) then
        TriggerClientEvent('EasyAdmin:showNotification', src, GetLocalisedText('Invalid player.'))
        return
    end

    -- 2. Check permission (silently reject if missing)
    if not DoesPlayerHavePermission(src, 'player.screenshot') then return end

    -- 3. Check immunity / targeting rules
    if not CanTargetPlayerForModeration(src, targetId) then return end

    -- 4. Prevent self-streaming (unless dangerous dev mode is enabled)
    if src == targetId and not IsDangerousDevModeEnabled() then return end

    -- Check if already viewing this stream
    local session = streamSessions[targetId]
    if session and session.viewers[src] then
        return -- Already watching
    end

    addViewer(targetId, src)

    -- Open the viewer window on the admin side.
    TriggerClientEvent('EasyAdmin:Stream:ViewerJoined', src, targetId, getName(targetId, true), buildIceConfig())

    TriggerClientEvent('EasyAdmin:showNotification', src, 'Streaming ' .. getName(targetId, true))
    PrintDebugMessage(getName(src, true) .. " started streaming " .. getName(targetId, true), 3)
end)

--- Admin stops watching a player's stream.
RegisterServerEvent('EasyAdmin:Stream:StopWatch', function(targetId)
    local src = source

    if not DoesPlayerHavePermission(src, 'player.screenshot') then return end
    if not targetId then return end
    if not CanTargetPlayerForModeration(src, targetId) then return end

    removeViewer(targetId, src)
end)

--- Target or viewer reports its PeerJS ID is ready.
--- Session membership is the guard — target players aren't admins,
--- and viewers are validated against streamSessions during StartWatch.
--- @ea-audit:exempt
RegisterServerEvent('EasyAdmin:Stream:PeerReady', function(peerId)
    local src = source
    if type(peerId) ~= 'string' or #peerId == 0 then return end

    -- Check if this source is a target
    local session = streamSessions[src]
    if session then
        -- This is the target reporting ready
        session.targetPeerId = peerId
        broadcastTargetReady(src)
        return
    end

    -- Check if this source is a viewer in any session
    -- (No action needed — the viewer has the target's peerId from TargetReady
    -- and will initiate the PeerJS call directly.)
    for _, sess in pairs(streamSessions) do
        if sess.viewers[src] then
            return
        end
    end
end)

--- Handle target player disconnect — notify all viewers and clean up.
AddEventHandler('playerDropped', function()
    local targetId = source
    forceStopStream(targetId)
end)
