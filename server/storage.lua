local banlist = {}
local actions = {}

local function SaveList(list, fileName)
    local content = LoadResourceFile(GetCurrentResourceName(), fileName .. ".json")
    if not content then
        PrintDebugMessage(fileName .. ".json file was missing, we created a new one.", 2)
        content = json.encode({})
    end

    local saved = SaveResourceFile(GetCurrentResourceName(), fileName .. ".json", json.encode(list, {indent = True}), -1)
    if not saved then
        PrintDebugMessage("^1Saving " .. fileName .. ".json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
    end
end

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
    -- get = function(list, type, input)
    --     for i, item in ipairs(list) do
    --         if item[type] == input then
    --             return item
    --         end
    --     end
    --     return nil
    -- end,
    -- add = function(list, input, fileName)
    --     table.insert(list, input)
    --     SaveList(list, fileName)
    -- end,
    -- remove = function(list, type, input, fileName)
    --     for i, item in ipairs(list) do
    --         if item[type] == input then
    --             table.remove(list, i)
    --             SaveList(list, fileName)
    --         end
    --     end
    --     return
    -- end,
    getBan = function(banId)
        for i, ban in ipairs(banlist) do
            if ban.banId == banId then
                return ban
            end
        end
        return nil
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
                end
            end
        end
        return
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
    removeAction = function(data)
        for i, act in ipairs(actions) do
            if act.id == data.id then
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