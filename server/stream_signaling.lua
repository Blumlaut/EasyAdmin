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

local STREAM_LOG = '[EA-Stream-Server]'

--- Active stream sessions.
--- streamSessions[targetId] = {
---   viewers = { [adminSrc] = { peerId = string | nil } },
---   targetReady = boolean,
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

--- Tell the target to initiate a WebRTC call to a specific viewer.
--- @param targetId number
--- @param viewerSrc number
local function tellTargetCallViewer(targetId, viewerSrc)
    local session = streamSessions[targetId]
    if not session then
        print(STREAM_LOG, 'tellTargetCallViewer: no session for target', targetId)
        return
    end
    local viewer = session.viewers[viewerSrc]
    if not viewer or not viewer.peerId then
        print(STREAM_LOG, 'tellTargetCallViewer: viewer', viewerSrc, 'has no peerId')
        return
    end
    print(STREAM_LOG, 'tellTargetCallViewer: target', targetId, '→ viewer', viewerSrc, '(peerId:', viewer.peerId, ')')
    TriggerClientEvent('EasyAdmin:Stream:CallViewer', targetId, viewerSrc, viewer.peerId)
end

--- Target reports its PeerJS instance is ready — tell it to call all waiting viewers.
--- @param targetId number
local function onTargetReady(targetId)
    local session = streamSessions[targetId]
    if not session or not session.targetReady then
        print(STREAM_LOG, 'onTargetReady: session not ready for target', targetId)
        return
    end
    print(STREAM_LOG, 'onTargetReady: target', targetId, 'is ready, calling', #session.viewers, 'viewer(s)')
    for viewerSrc, viewer in pairs(session.viewers) do
        if viewer.peerId then
            tellTargetCallViewer(targetId, viewerSrc)
        else
            print(STREAM_LOG, 'onTargetReady: viewer', viewerSrc, 'has no peerId yet, skipping')
        end
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
            targetReady = false,
            started = os.time(),
        }
        streamSessions[targetId] = session

        print(STREAM_LOG, 'addViewer: new session for target', targetId, '— sending StartPublishing')
        -- Start the publisher on the target (first viewer only).
        TriggerClientEvent('EasyAdmin:Stream:StartPublishing', targetId, buildIceConfig())
    end

    session.viewers[adminSrc] = { peerId = nil }
    print(STREAM_LOG, 'addViewer: admin', adminSrc, 'added to target', targetId, 'session')

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
        print(STREAM_LOG, 'removeViewer: last viewer left, stopping stream for target', targetId)
        TriggerClientEvent('EasyAdmin:Stream:StopPublishing', targetId)
        streamSessions[targetId] = nil
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
    print(STREAM_LOG, 'forceStopStream: target', targetId, 'disconnected')
end

--- Admin requests to start watching a player's stream.
RegisterServerEvent('EasyAdmin:Stream:StartWatch', function(targetId)
    local src = source

    -- 1. Validate the target exists and is online
    if not targetId or not isPlayerOnline(targetId) then
        TriggerClientEvent('EasyAdmin:showNotification', src, GetLocalisedText('Invalid player.'))
        print(STREAM_LOG, 'StartWatch: invalid target', targetId)
        return
    end

    -- 2. Check permission (silently reject if missing)
    if not DoesPlayerHavePermission(src, 'player.screenshot') then
        print(STREAM_LOG, 'StartWatch: admin', src, 'lacks permission')
        return
    end

    -- 3. Check immunity / targeting rules
    if not CanTargetPlayerForModeration(src, targetId) then
        print(STREAM_LOG, 'StartWatch: admin', src, 'cannot target', targetId, '(immunity)')
        return
    end

    -- 4. Prevent self-streaming (unless dangerous dev mode is enabled)
    if src == targetId and not IsDangerousDevModeEnabled() then
        print(STREAM_LOG, 'StartWatch: admin', src, 'cannot stream self')
        return
    end

    -- Check if already viewing this stream
    local session = streamSessions[targetId]
    if session and session.viewers[src] then
        print(STREAM_LOG, 'StartWatch: admin', src, 'already watching target', targetId)
        return -- Already watching
    end

    addViewer(targetId, src)

    -- Open the viewer window on the admin side.
    print(STREAM_LOG, 'StartWatch: sending ViewerJoined to admin', src)
    TriggerClientEvent('EasyAdmin:Stream:ViewerJoined', src, targetId, getName(targetId, true), buildIceConfig())

    TriggerClientEvent('EasyAdmin:showNotification', src, 'Streaming ' .. getName(targetId, true))
end)

--- Admin stops watching a player's stream.
RegisterServerEvent('EasyAdmin:Stream:StopWatch', function(targetId)
    local src = source

    if not DoesPlayerHavePermission(src, 'player.screenshot') then return end
    if not targetId then return end
    if not CanTargetPlayerForModeration(src, targetId) then return end

    print(STREAM_LOG, 'StopWatch: admin', src, 'stopping stream for target', targetId)
    removeViewer(targetId, src)
end)

--- Target or viewer reports its PeerJS ID is ready.
--- The target initiates WebRTC calls to viewers (caller sends media).
--- When a viewer reports ready, the target is told to call that viewer.
--- When the target reports ready, it's told to call all viewers already registered.
--- The `role` parameter distinguishes target from viewer (needed when src is the same,
--- e.g. dangerous dev mode self-streaming).
--- Session membership is the guard — target players aren't admins,
--- and viewers are validated against streamSessions during StartWatch.
--- @ea-audit:exempt
RegisterServerEvent('EasyAdmin:Stream:PeerReady', function(peerId, role)
    local src = source
    if type(peerId) ~= 'string' or #peerId == 0 then
        print(STREAM_LOG, 'PeerReady: invalid peerId from', src)
        return
    end

    print(STREAM_LOG, 'PeerReady: src', src, 'role:', role or 'unknown', 'peerId:', peerId)

    if role == 'target' then
        -- This source is the target in an active session
        local session = streamSessions[src]
        if not session then
            print(STREAM_LOG, 'PeerReady: target', src, 'has no active session')
            return
        end
        print(STREAM_LOG, 'PeerReady: target', src, 'is ready. viewers:', json.encode(session.viewers))
        session.targetReady = true
        -- Target is ready — tell it to call all viewers that already reported their peerId
        onTargetReady(src)
        return
    end

    if role == 'viewer' then
        -- Check if this source is a viewer in any session
        for targetId, sess in pairs(streamSessions) do
            if sess.viewers[src] then
                print(STREAM_LOG, 'PeerReady: viewer', src, 'ready for target', targetId, 'targetReady=', sess.targetReady)
                sess.viewers[src].peerId = peerId
                -- Viewer is ready — if the target is also ready, tell it to call this viewer now
                if sess.targetReady then
                    tellTargetCallViewer(targetId, src)
                else
                    print(STREAM_LOG, 'PeerReady: target not ready yet, waiting for target to report ready')
                end
                return
            end
        end
        print(STREAM_LOG, 'PeerReady: viewer', src, 'is not in any session')
        return
    end

    print(STREAM_LOG, 'PeerReady: src', src, 'has unknown role:', role)
end)

--- Handle target player disconnect — notify all viewers and clean up.
AddEventHandler('playerDropped', function()
    local targetId = source
    forceStopStream(targetId)
end)
