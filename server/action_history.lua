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

local actions = {}

local function SaveActions(actions)
    
end

RegisterNetEvent("EasyAdmin:GetActionHistory", function(discordId)
    if DoesPlayerHavePermission(source, "player.actionhistory.view") then
        if not discordId then
            PrintDebugMessage("No Discord ID provided, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, {})
            return
        end
        local history = {}
        if actions then
            for i, action in ipairs(actions) do
                if tostring(action.discord) == tostring(discordId) then
                    table.insert(history, {
                        action = action.action,
                        reason = action.reason,
                        discord = action.discord,
                        moderator = action.moderator,
                        moderatorId = action.moderatorId,
                        time = action.time,
                    })
                end
            end
        else
            PrintDebugMessage("No actions found in the history.", 2)
        end
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, history)
    else
        PrintDebugMessage("Player does not have permission to view action history.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, {})
    end
end)

RegisterNetEvent("EasyAdmin:DeleteAction", function(actionId)
    if DoesPlayerHavePermission(source, "player.actionhistory.delete") then
        if not actionId then
            PrintDebugMessage("Invalid parameters provided for action deletion.", 2)
            return
        end
        for i, act in ipairs(actions) do
            if act.id == actionId then
                table.remove(actions, i)
                local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
                if not saved then
                    PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                end
                PrintDebugMessage("Removed action: " .. json.encode(act), 4)
            end
            local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
            if not saved then
                PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
            end
                end
        PrintDebugMessage("No matching action found for deletion.", 2)
    else
        PrintDebugMessage("Player does not have permission to delete actions.", 2)
    end
end)

AddEventHandler("EasyAdmin:LogAction", function(data, remove, forceChange)
    local change = (forceChange or false)
    local content = LoadResourceFile(GetCurrentResourceName(), "actions.json")
    if not content then
        PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
        local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode({}), -1)
        if not saved then
            PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
        content = json.encode({})
    end
    actions = json.decode(content)

    if not actions then
        PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
        PrintDebugMessage("^1Failed^7 to load Actions!\n")
        PrintDebugMessage("Please check your actions file for errors, ^Action history *will not* work!^7\n")
        PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
        return
    end

    if data and not remove then
        if data.action == "ban" then
            table.insert(actions, {
                time = os.time(),
                id = #actions + 1,
                action = "Ban",
                discord = data.discord,
                reason = data.reason,
                moderator = data.moderator,
                moderatorId = data.moderatorId,
                expire = data.expire,
                expireString = data.expireString
            })
        elseif data.action == "kick" then
            table.insert(actions, {
                time = os.time(),
                id = #actions + 1,
                action = "Kick",
                discord = data.discord,
                reason = data.reason,
                moderator = data.moderator,
                moderatorId = data.moderatorId,
            })
        elseif data.action == "warn" then
            table.insert(actions, {
                time = os.time(),
                id = #actions + 1,
                action = "Warn",
                discord = data.discord,
                reason = data.reason,
                moderator = data.moderator,
                moderatorId = data.moderatorId,
            })
        elseif data.action == "unban" then
            return
        end
        PrintDebugMessage("Added the following to actions:\n"..table_to_string(data), 4)
        change=true
    elseif not data then
        return
    end
    if data and remove then
        PrintDebugMessage("Removed the following data from actions:\n"..table_to_string(data), 4)
        change = true
    end
    if change then
        PrintDebugMessage("Actions changed, saving..", 4)
        local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
        if not saved then
            PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
    end
    PrintDebugMessage("Completed Actions Updated.", 4)
end)

for i, action in ipairs(actions) do
    if action.time + (GetConvar("ea_actionHistoryExpiry", 30) * 24 * 60 * 60) < os.time() then
        table.remove(actions, i)
        PrintDebugMessage("Removed expired action: " .. json.encode(action), 4)
    end
end

local change = (forceChange or false)
local content = LoadResourceFile(GetCurrentResourceName(), "actions.json")
if not content then
    PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
    local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode({}), -1)
    if not saved then
        PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
    end
    content = json.encode({})
end
actions = json.decode(content)