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
    get = function(list, type, input)
        for i, item in ipairs(list) do
            if item[type] == input then
                return item
            end
        end
        return nil
    end,
    add = function(list, input, fileName)
        table.insert(list, input)
        SaveList(list, fileName)
    end,
    remove = function(list, type, input, fileName)
        for i, item in ipairs(list) do
            if item[type] == input then
                table.remove(list, i)
                SaveList(list, fileName)
            end
        end
        return
    end,
    getBan = function(banId)
        for i, ban in ipairs(banlist) do
            if ban.banId == banId then
                return ban
            end
        end
        return nil
    end,
    addBan = function(ban)
        table.insert(banlist, ban)
        SaveList(banlist, "banlist")
    end,
    removeBan = function(banId)
        for i, ban in ipairs(banlist) do
            if ban.banId == banId then
                table.remove(banlist, i)
                SaveList(banlist, "banlist")
            end
        end
        return
    end,
    addAction = function(data)
        print("Adding action...")
        print(json.encode(data))
        table.insert(actions, data)
        SaveList(actions, "actions")
    end,
    removeAction = function(data)
        for i, act in ipairs(actions) do
            if act.id == data.id then
                table.remove(actions, i)
                SaveList(actions, "actions")
            end
        end
        return
    end,
    apiVersion = 1,
}