------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
----
----
---- If you are a developer and want to change something, consider writing a plugin instead:
---- https://easyadmin.readthedocs.io/en/latest/plugins/
----
------------------------------------
------------------------------------

local listsReady = false
local banlist = {}
local actions = {}
local notes = {}

local BANLIST_FILE = "banlist.json"
local ACTIONS_FILE = "data/actions.json"
local LEGACY_ACTIONS_FILE = "actions.json"
local NOTES_FILE = "data/notes.json"
local LEGACY_NOTES_FILE = "notes.json"

-- local function updateList(filename)
--     return
-- end

local function awaitReady()
    if listsReady then return end
    -- Bounded wait: the loader thread always sets listsReady (even on failure, see below),
    -- so this is a safety cap against a never-scheduled loader rather than the normal path.
    local waited = 0
    while not listsReady do
        Citizen.Wait(50)
        waited = waited + 50
        if waited >= 10000 then
            PrintDebugMessage("^1Storage.awaitReady timed out after 10s; proceeding with current (possibly empty) lists.^7", 1)
            return
        end
    end
end

local function loadJsonFileOrNil(filename)
    return LoadJsonResourceFile(filename, nil)
end

local function loadJsonFileOrDefault(filename)
    local data = loadJsonFileOrNil(filename)
    if data ~= nil then
        return data
    end

    PrintDebugMessage(filename .. " file was missing, we created a new one.", 2)
    return {}
end

local function loadJsonWithLegacyFallback(primaryFilename, legacyFilename)
    local primary = loadJsonFileOrNil(primaryFilename)
    if primary ~= nil then
        return primary
    end

    local legacy = loadJsonFileOrNil(legacyFilename)
    if legacy ~= nil then
        PrintDebugMessage(string.format("Migrating %s to %s on next save.", legacyFilename, primaryFilename), 2)
        SaveJsonResourceFile(primaryFilename, legacy)
        return legacy
    end

    PrintDebugMessage(primaryFilename .. " file was missing, we created a new one.", 2)
    return {}
end

local function saveJsonFile(filename, data)
    if not SaveJsonResourceFile(filename, data) then
        PrintDebugMessage("^1Saving " .. filename .. " failed! Please check if EasyAdmin has Permission to write in its owner folder!^7", 1)
    end
end

-- Returns the next available sequential ID for a list of records that have an .id field
local function nextId(list)
    local max_id = 0
    for _, entry in ipairs(list) do
        if entry.id and entry.id > max_id then
            max_id = entry.id
        end
    end
    return max_id + 1
end

-- Returns all entries from `list` whose .idents table shares identifiers with `idents`
-- Uses DoIdentifiersMatch with minMatches=1 (any overlap means the entry belongs to this player)
local function findByIdentifiers(list, idents)
    local results = {}
    for _, entry in ipairs(list) do
        if DoIdentifiersMatch(entry.idents, idents, 1) then
            results[#results + 1] = entry
        end
    end
    return results
end

-- Notify banlist.lua to rebuild its derived enforcement view (blacklist + banIndex) after any
-- banlist mutation, so Storage remains the single source of truth and bans take effect immediately.
local function syncBanlistView()
    if RebuildBanlistView then RebuildBanlistView() end
end

Storage = {
    getBan = function(banId)
        awaitReady()
        for i, ban in ipairs(banlist) do
            if tostring(ban.banid) == tostring(banId) then
                return ban
            end
        end
        return false
    end,
    getBanIdentifier = function(identifier)
        awaitReady()
        for i, ban in ipairs(banlist) do
            for j, banId in ipairs(ban.identifiers) do
                if banId == identifier then
                    return ban
                end
            end
        end
        return false
    end,
    addBan = function(banId, username, bannedIdentifiers, moderator, reason, expires, expiryString, type, time, issuingResource)
        awaitReady()
        local banTime = time or os.time()
        local ban = {
            time = banTime,
            banid = banId,
            username = username,
            identifiers = bannedIdentifiers,
            banner = moderator,
            reason = reason,
            expire = expires,
            expiryString = expiryString,
            type = type,
        }
        if issuingResource then
            ban.issuingResource = issuingResource
        end
        table.insert(banlist, ban)
        saveJsonFile(BANLIST_FILE, banlist)
        syncBanlistView()
    end,
    updateBan = function(id, newData)
        if id and newData and newData.identifiers and newData.banid and newData.reason and newData.expire then
            for i, ban in pairs(banlist) do
                if tostring(ban.banid) == tostring(newData.banid) then
                    banlist[i] = newData
                    saveJsonFile(BANLIST_FILE, banlist)
                    syncBanlistView()
                    break
                end
            end
        end
    end,
    updateBanlist = function(newList)
        banlist = newList
        saveJsonFile(BANLIST_FILE, banlist)
        syncBanlistView()
    end,
    removeBan = function(banId)
        awaitReady()
        for i, ban in ipairs(banlist) do
            if tostring(ban.banid) == tostring(banId) then
                table.remove(banlist, i)
                saveJsonFile(BANLIST_FILE, banlist)
                syncBanlistView()
                return true
            end
        end
        return false
    end,
    unbanIdentifier = function(identifier)
        awaitReady()
        if identifier then
            for i, ban in ipairs(banlist) do
                for index, id in pairs(ban.identifiers) do
                    if identifier == id then
                        table.remove(banlist, i)
                        saveJsonFile(BANLIST_FILE, banlist)
                        syncBanlistView()
                        PrintDebugMessage("removed ban as per unbanidentifier func", 4)
                        return
                    end
                end
            end
        end
    end,
    getBanList = function()
        awaitReady()
        return banlist
    end,
    getAction = function(idents)
        awaitReady()
        return findByIdentifiers(actions, idents)
    end,
    addAction = function(type, identifiers, reason, moderatorName, moderatorIdentifiers, banId)
        awaitReady()
        table.insert(actions, {
            time = os.time(),
            id = nextId(actions),
            action = type,
            idents = identifiers,
            reason = reason,
            moderator = moderatorName,
            moderatorIdents = moderatorIdentifiers,
            banid = banId,
        })
        saveJsonFile(ACTIONS_FILE, actions)
    end,
    removeAction = function(actionId)
        awaitReady()
        for i, act in ipairs(actions) do
            if act.id == actionId then
                table.remove(actions, i)
                saveJsonFile(ACTIONS_FILE, actions)
                return true
            end
        end
        return false
    end,
    addNote = function(noteContent, identifiers, moderatorName, moderatorIdentifiers)
        awaitReady()
        table.insert(notes, {
            time = os.date("%d/%m/%Y %H:%M", os.time()),
            id = nextId(notes),
            content = noteContent,
            idents = identifiers,
            moderator = moderatorName,
            moderatorIdents = moderatorIdentifiers
        })
        saveJsonFile(NOTES_FILE, notes)
    end,
    removeNote = function(noteId)
        awaitReady()
        for i, note in ipairs(notes) do
            if note.id == noteId then
                table.remove(notes, i)
                saveJsonFile(NOTES_FILE, notes)
                return true
            end
        end
        return false
    end,
    getNotes = function(id)
        awaitReady()
        -- Resolve identifiers via the player cache (works for online AND recently-dropped players);
        -- callers that already hold identifiers should use getNotesByIdents directly.
        local idents = getCachedPlayerIdentifiers(tonumber(id))
        if not idents then return {} end
        return findByIdentifiers(notes, idents)
    end,
    getNotesByIdents = function(idents)
        awaitReady()
        return findByIdentifiers(notes, idents)
    end,
}

-- Removes actions older than ea_actionHistoryExpiry days. Safe to call repeatedly.
local function pruneExpiredActions()
    local expirySeconds = GetConvarInt("ea_actionHistoryExpiry", 120) * 24 * 60 * 60
    local pruned = false
    for i = #actions, 1, -1 do
        local action = actions[i]
        if action.time and action.time + expirySeconds < os.time() then
            table.remove(actions, i)
            pruned = true
            PrintDebugMessage("Removed expired action: " .. json.encode(action), 4)
        end
    end
    if pruned then
        saveJsonFile(ACTIONS_FILE, actions)
    end
end

Citizen.CreateThread(function()
    -- Load all lists inside pcall: a decode/IO failure must never leave listsReady false,
    -- otherwise awaitReady() (and thus every Storage call) would block indefinitely.
    local ok, err = pcall(function()
        banlist = loadJsonFileOrDefault(BANLIST_FILE)
        actions = loadJsonWithLegacyFallback(ACTIONS_FILE, LEGACY_ACTIONS_FILE)
        notes = loadJsonWithLegacyFallback(NOTES_FILE, LEGACY_NOTES_FILE)
        PrintDebugMessage("Clearing expired actions from action history", 4)
        pruneExpiredActions()
    end)
    if not ok then
        PrintDebugMessage("^1Storage failed to load lists: " .. tostring(err) .. " - starting with empty lists.^7", 1)
        banlist = banlist or {}
        actions = actions or {}
        notes = notes or {}
    end

    listsReady = true
    -- Build the enforcement view now that Storage is ready (guarded: banlist.lua may load after us).
    syncBanlistView()
end)

-- Recurring cleanup so expired actions are pruned during runtime, not only at startup.
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(60 * 60 * 1000) -- hourly
        if listsReady then
            pruneExpiredActions()
        end
    end
end)
