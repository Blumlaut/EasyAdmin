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

local banlist = {}
local actions = {}

local function LoadList(fileName)
    local content = LoadResourceFile(GetCurrentResourceName(), fileName .. ".json")
    if content then
        return json.decode(content)
    else
        SaveResourceFile(GetCurrentResourceName(), fileName .. ".json", json.encode({}), -1)
        return {}
    end
end

banlist = LoadList("banlist")
actions = LoadList("actions")

Storage = {
    getBan = function(banId)
        for i, ban in ipairs(banlist) do
            if ban.banId == banId then
                return ban
            end
        end
        return false
    end,
    getBanIdentifier = function(identifiers)
        local found = false
        for i, ban in ipairs(banlist) do
            for j, identifier in ipairs(identifiers) do
                if ban.bannedIdentifiers[identifier] then
                    found = true
                    break
                end
            end
        end
        return found
    end,
    addBan = function(banId, username, bannedIdentifiers, moderator, reason, expires, expiryString, type, time)
        table.insert(banlist, {
            time = os.time(),
            banId = banId,
            username = username,
            bannedIdentifiers = bannedIdentifiers,
            moderator = moderator,
            reason = reason,
            expires = expires,
            expiryString = expiryString,
            type = type,
            timeLeft = time,
        })
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
        for i, ban in ipairs(banlist) do
            if ban.banId == banId then
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
            else
                return false
            end
        end
    end,
    removeBanIdentifier = function(identifiers)
        for i, ban in ipairs(banlist) do
            for j, identifier in ipairs(identifiers) do
                if ban.bannedIdentifiers[identifier] then
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
        return banlist
    end,
    getAction = function(discordId)
        local actions = {}
        for i, act in ipairs(actions) do
            if act.discord == discordId then
                table.insert(actions, act)
            end
        end
        return actions
    end,
    addAction = function(type, identifier, reason, moderator_name, moderator_identifier)
        table.insert(actions, {
            time = os.time(),
            id = #actions + 1,
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
    end,
    apiVersion = 1,
}