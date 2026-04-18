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

-- local function updateList(filename)
--     return
-- end

local function awaitReady()
    if not listsReady then
        repeat Citizen.Wait(0) until listsReady
    end
end

local function loadJsonFile(filename, currentVersion)
    local content = LoadResourceFile(GetCurrentResourceName(), filename)
    if content then
        PrintDebugMessage(filename .. " file was missing, we created a new one.", 2)
        content = json.encode({})
    end

    return content
end

local function saveJsonFile(filename, data)
    local saved = SaveResourceFile(GetCurrentResourceName(), filename, json.encode(data, {indent = true}), -1)
    if not saved then
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

-- Returns all entries from `list` whose .idents table shares at least one value with `idents`
local function findByIdentifiers(list, idents)
    local playerHasIdent = {}
    for _, id in ipairs(idents) do playerHasIdent[id] = true end

    local results = {}
    for _, entry in ipairs(list) do
        for _, ident in ipairs(entry.idents) do
            if playerHasIdent[ident] then
                results[#results + 1] = entry
                break
            end
        end
    end
    return results
end

Storage = {
    getBan = function(banId)
        awaitReady()
        for i, ban in ipairs(banlist) do
            if ban.banid == banId then
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
    addBan = function(banId, username, bannedIdentifiers, moderator, reason, expires, expiryString, type, time)
        awaitReady()
        table.insert(banlist, {
            time = os.time(),
            banid = banId,
            username = username,
            identifiers = bannedIdentifiers,
            banner = moderator,
            reason = reason,
            expire = expires,
            expiryString = expiryString,
            type = type,
            timeLeft = time,
        })
        saveJsonFile("banlist.json", banlist)
    end,
    updateBan = function(id, newData)
        if id and newData and newData.identifiers and newData.banid and newData.reason and newData.expire then
            for i, ban in pairs(banlist) do
                if ban.banid == newData.banid then
                    banlist[i] = newData
                    saveJsonFile("banlist.json", banlist)
                    break
                end
            end
        end
    end,
    updateBanlist = function(banlist)
        saveJsonFile("banlist.json", banlist)
    end,
    removeBan = function(banId)
        awaitReady()
        for i, ban in ipairs(banlist) do
            if ban.banid == banId then
                table.remove(banlist, i)
                saveJsonFile("banlist.json", banlist)
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
                        saveJsonFile("banlist.json", banlist)
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
    addAction = function(type, identifiers, reason, moderatorName, moderatorIdentifiers)
        awaitReady()
        table.insert(actions, {
            time = os.time(),
            id = nextId(actions),
            action = type,
            idents = identifiers,
            reason = reason,
            moderator = moderatorName,
            moderatorIdents = moderatorIdentifiers,
        })
        saveJsonFile("actions.json", actions)
    end,
    removeAction = function(actionId)
        awaitReady()
        for i, act in ipairs(actions) do
            if act.id == actionId then
                table.remove(actions, i)
            end
        end
        saveJsonFile("actions.json", actions)
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
        saveJsonFile("notes.json", notes)
    end,
    removeNote = function(noteId)
        awaitReady()
        for i, note in ipairs(notes) do
            if note.id == noteId then
                table.remove(notes, i)
            end
        end
        saveJsonFile("notes.json", notes)
    end,
    getNotes = function(id)
        awaitReady()
        if not CachedPlayers[id] then return {} end
        local idents = CachedPlayers[id].identifiers
        return findByIdentifiers(notes, idents)
    end,
    getNotesByIdents = function(idents)
        awaitReady()
        return findByIdentifiers(notes, idents)
    end,
}

Citizen.CreateThread(function()
    local currentVersion = GetResourceMetadata(GetCurrentResourceName(), 'storage_api_version', 1)
    local banContent = loadJsonFile("banlist.json", currentVersion)

    banlist = json.decode(banContent) or {}

    local actionContent = loadJsonFile("actions.json", currentVersion)
    actions = json.decode(actionContent) or {}

    local notesContent = loadJsonFile("notes.json", currentVersion)
    notes = json.decode(notesContent) or {}

    local actionsPruned = false
    PrintDebugMessage("Clearing expired actions from action history", 4)
    for i, action in ipairs(actions) do
        if action.time + (GetConvar("ea_actionHistoryExpiry", 30) * 24 * 60 * 60) < os.time() then
            table.remove(actions, i)
            actionsPruned = true
            PrintDebugMessage("Removed expired action: " .. json.encode(action), 4)
        end
    end

    if actionsPruned then
         saveJsonFile("actions.json", actions)
     end

    listsReady = true
end)
