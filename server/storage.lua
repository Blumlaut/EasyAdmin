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

local function LoadList(fileName)
    local resourceName = GetCurrentResourceName()
    local content = LoadResourceFile(resourceName, fileName .. ".json")
    local currentVersion = tonumber(GetResourceMetadata(resourceName, 'api_version', 1))
    local defaultData = {
        version = currentVersion,
        data = {}
    }
    if content then
        local decoded = json.decode(content)

        if not decoded then
            decoded = defaultData

        elseif not decoded.version then
            if decoded[1] or next(decoded) ~= nil then
                decoded = {
                    version = currentVersion,
                    data = decoded
                }
            else
                decoded = defaultData
            end            
        end

        SaveResourceFile(GetCurrentResourceName(), fileName .. ".json", json.encode(decoded, { indent=true }), -1)
        return decoded
    else
        SaveResourceFile(GetCurrentResourceName(), fileName .. ".json", json.encode(defaultData, { indent=true }), -1)
        return defaultData
    end
end

local function updateList(fileName)
    local content = LoadResourceFile(GetCurrentResourceName(), fileName .. ".json")
    if content then
        local data = json.decode(content)
        if not data then
            data = {
                version = currentVersion,
                data = {}
            }
        end
        -- Migration logic can be added here for future versions
        data.version = currentVersion
        SaveResourceFile(GetCurrentResourceName(), fileName .. ".json", json.encode(data, { indent=true }), -1)
    end
end

Storage = {
    getBan = function(banId)
        while not listsReady do
            Citizen.Wait(0)
        end
        for i, ban in ipairs(banlist) do
            if ban.banid == banId then
                return ban
            end
        end
        return false
    end,
    getBanIdentifier = function(identifiers)
        while not listsReady do
            Citizen.Wait(0)
        end
        local found = false
        for i, ban in ipairs(banlist) do
            for j, identifier in ipairs(identifiers) do
                if ban.identifiers[identifier] then
                    found = true
                    break
                end
            end
        end
        return found
    end,
    addBan = function(banId, username, bannedIdentifiers, moderator, reason, expires, expiryString, type, time)
        while not listsReady do
            Citizen.Wait(0)
        end
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
        local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
        if not content then
            PrintDebugMessage("banlist.json file was missing, we created a new one.", 2)
            content = json.encode({
                version = 1,
                bans = {}
            })
        end
        local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(banlist, {indent = true}), -1)
        if not saved then
            PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
    end,
    -- Not too sure what this one does
    -- updateBan = function(banId, .....)
    -- end,
    updateBanlist = function(banlist)
        local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
        if not content then
            PrintDebugMessage("banlist.json file was missing, we created a new one.", 2)
            content = json.encode({})
        end
        local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(banlist, {indent = true}), -1)
        if not saved then
            PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
    end,
    removeBan = function(banId)
        while not listsReady do
            Citizen.Wait(0)
        end
        for i, ban in ipairs(banlist) do
            if ban.banid == banId then
                table.remove(banlist, i)
                local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
                if not content then
                    PrintDebugMessage("banlist.json file was missing, we created a new one.", 2)
                    content = json.encode({})
                end
                local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(banlist, {indent = true}), -1)
                if not saved then
                    PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                    return false
                end
                return true
            end
        end
        return false
    end,
    removeBanIdentifier = function(identifiers)
        while not listsReady do
            Citizen.Wait(0)
        end
        for i, ban in ipairs(banlist) do
            for j, identifier in ipairs(identifiers) do
                if ban.identifiers[identifier] then
                    table.remove(banlist, i)
                    local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
                    if not content then
                        PrintDebugMessage("banlist.json file was missing, we created a new one.", 2)
                        content = json.encode({})
                    end
                    local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(banlist, {indent = true}), -1)
                    if not saved then
                        PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                        return
                    end
                    return
                end
            end
        end
        return
    end,
    getBanList = function()
        while not listsReady do
            Citizen.Wait(0)
        end
        return banlist
    end,
    getAction = function(discordId)
        while not listsReady do
            Citizen.Wait(0)
        end
        local userActions = {}
        for _, act in ipairs(actions) do
            if act.discord == discordId then
                table.insert(userActions, act)
            end
        end
        return userActions
    end,
    addAction = function(type, identifier, reason, moderator_name, moderator_identifier)
        while not listsReady do
            Citizen.Wait(0)
        end
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
            discord = identifier,
            reason = reason,
            moderator = moderator_name,
            moderatorId = moderator_identifier,
        })
        local content = LoadResourceFile(GetCurrentResourceName(), "actions.json")
        if not content then
            PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
            content = json.encode({})
        end
        local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
        if not saved then
            PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
        return
    end,
    removeAction = function(actionId)
        while not listsReady do
            Citizen.Wait(0)
        end
        for i, act in ipairs(actions) do
            if act.id == actionId then
                table.remove(actions, i)
                local content = LoadResourceFile(GetCurrentResourceName(), "actions.json")
                if not content then
                    PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
                    content = json.encode({})
                end
                local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
                if not saved then
                    PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                end
            end
        end
        return
    end
}

Citizen.CreateThread(function()
    local currentVersion = GetResourceMetadata(GetCurrentResourceName(), 'api_version', 1)
    local banContent = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
    if banContent then
        local data = json.decode(banContent)
        if data.version ~= currentVersion then
            updateList('banlist')
            banContent = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
        end
    end

    banlist = json.decode(banContent) or {}

    local actionContent = LoadResourceFile(GetCurrentResourceName(), "actions.json")
    if actionContent then
        local data = json.decode(actionContent)
        if data.version ~= currentVersion then
            updateList('actions')
            actionContent = LoadResourceFile(GetCurrentResourceName(), "actions.json")
        end
    else
        PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
        local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode({}), -1)
        if not saved then
            PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
        content = json.encode({})
    end
    actions = json.decode(actionContent) or {}

    PrintDebugMessage("Clearing expired actions from action history", 4)
    for i, action in ipairs(actions) do
        if action.time + (GetConvar("ea_actionHistoryExpiry", 30) * 24 * 60 * 60) < os.time() then
            table.remove(actions, i)
            PrintDebugMessage("Removed expired action: " .. json.encode(action), 4)
        end
    end

    listsReady = true
end)