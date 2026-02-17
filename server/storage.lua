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

local function loadJsonFile(filename, currentVersion)
    local content = LoadResourceFile(GetCurrentResourceName(), filename)
    if content then
        local data = json.decode(content)
        if data.version ~= currentVersion then
            -- updateList(filename)
            content = LoadResourceFile(GetCurrentResourceName(), filename)
        end
    else
        PrintDebugMessage(filename .. " file was missing, we created a new one.", 2)
        content = json.encode({})
    end

    return content
end

local function saveJsonFile(filename, data)
    local saved = SaveResourceFile(GetCurrentResourceName(), filename, json.encode(data, {indent = true, version = GetResourceMetadata(GetCurrentResourceName(), 'storage_api_version', 0)}), -1)
    if not saved then
        PrintDebugMessage("^1Saving " .. filename .. " failed! Please check if EasyAdmin has Permission to write in its owner folder!^7", 1)
    end
end

Storage = {
    getBan = function(banId)
        repeat
            Citizen.Wait(0)
        until listsReady
        for i, ban in ipairs(banlist) do
            if ban.banid == banId then
                return ban
            end
        end
        return false
    end,
    getBanIdentifier = function(identifiers)
        repeat
            Citizen.Wait(0)
        until listsReady
        local found = false
        for i, ban in ipairs(banlist) do
            for j, identifier in ipairs(ban.identifiers) do
                if ban.identifiers[identifier] then
                    found = true
                    break
                end
            end
        end
        return found
    end,
    addBan = function(banId, username, bannedIdentifiers, moderator, reason, expires, expiryString, type, time)
        repeat
            Citizen.Wait(0)
        until listsReady
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
        repeat
            Citizen.Wait(0)
        until listsReady
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
        repeat
            Citizen.Wait(0)
        until listsReady
        if identifier then
            for i,ban in ipairs(banlist) do
                for index,id in pairs(ban.identifiers) do
                    if identifier == id then
                        table.remove(banlist,i)
                        saveJsonFile("banlist.json", banlist)
                        PrintDebugMessage("removed ban as per unbanidentifier func", 4)
                        return
                    end
                end
            end
        end
    end,
    getBanList = function()
        repeat
            Citizen.Wait(0)
        until listsReady
        return banlist
    end,
    getAction = function(idents)
        repeat
            Citizen.Wait(0)
        until listsReady
        local userActions = {}
        local playerHasIdent = {}

        for _, id in ipairs(idents) do playerHasIdent[id] = true end

        for _, act in ipairs(actions) do
            for _, ident in ipairs(act.idents) do
                if playerHasIdent[ident] then
                    table.insert(userActions, act)
                    break
                end
            end
        end
        return userActions
    end,
    addAction = function(type, identifiers, reason, moderatorName, moderatorIdentifiers)
        repeat
            Citizen.Wait(0)
        until listsReady
        local max_id = 0
        for _, act in ipairs(actions) do
            if act.id and act.id > max_id then
                max_id = act.id
            end
        end
        table.insert(actions, {
            time = os.time(),
            id = max_id + 1,
            action = type,
            idents = identifiers,
            reason = reason,
            moderator = moderatorName,
            moderatorIdents = moderatorIdentifiers,
        })
        saveJsonFile("actions.json", actions)
    end,
    removeAction = function(actionId)
        repeat
            Citizen.Wait(0)
        until listsReady
        for i, act in ipairs(actions) do
            if act.id == actionId then
                table.remove(actions, i)
            end
        end
        saveJsonFile("actions.json", actions)
        return
    end,
    addNote = function(noteContent, identifiers, moderatorName, moderatorIdentifiers)
        repeat
            Citizen.Wait(0)
        until listsReady

        local max_id = 0
        for _, note in ipairs(notes) do
            if note.id and note.id > max_id then
                max_id = note.id
            end
        end
        
        table.insert(notes, {
            time = os.date("%d/%m/%Y %H:%M", os.time()),
            id = max_id + 1,
            content = noteContent,
            idents = identifiers,
            moderator = moderatorName,
            moderatorIdents = moderatorIdentifiers
        })
        saveJsonFile("notes.json", notes)
    end,
    removeNote = function(noteId)
        repeat
            Citizen.Wait(0)
        until listsReady

        for i, note in ipairs(notes) do
            if note.id == noteId then
                table.remove(notes, i)
            end
        end
        saveJsonFile("notes.json", notes)
        return
    end,
    getNotes = function(id)
        repeat
            Citizen.Wait(0)
        until listsReady

        local userNotes = {}
        local playerHasIdent = {}

        local idents = CachedPlayers[id].identifiers

        for _, id in ipairs(idents) do playerHasIdent[id] = true end

        for _, note in ipairs(notes) do
            for _, ident in ipairs(note.idents) do
                if playerHasIdent[ident] then
                    table.insert(userNotes, note)
                    break
                end
            end
        end
        return userNotes
    end,
}

Citizen.CreateThread(function()
    local currentVersion = GetResourceMetadata(GetCurrentResourceName(), 'storage_api_version', 1)
    local banContent = loadJsonFile("banlist.json", currentVersion)
    local banContent = LoadResourceFile(GetCurrentResourceName(), "banlist.json")

    banlist = json.decode(banContent) or {}

    local actionContent = loadJsonFile("actions.json", currentVersion)
    actions = json.decode(actionContent) or {}

    local notesContent = loadJsonFile("notes.json", currentVersion)
    notes = json.decode(notesContent) or {}

    PrintDebugMessage("Clearing expired actions from action history", 4)
    for i, action in ipairs(actions) do
        if action.time + (GetConvar("ea_actionHistoryExpiry", 30) * 24 * 60 * 60) < os.time() then
            table.remove(actions, i)
            PrintDebugMessage("Removed expired action: " .. json.encode(action), 4)
        end
    end

    listsReady = true
end)