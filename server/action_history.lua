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

moderationNotification = GetConvar("ea_moderationNotification", "false")
reportNotification = GetConvar("ea_reportNotification", "false")
detailNotification = GetConvar("ea_detailNotification", "false")
minimumMatchingIdentifierCount = GetConvarInt("ea_minIdentifierMatches", 2)

RegisterNetEvent("EasyAdmin:GetActionHistory", function(discordId)
    if DoesPlayerHavePermission(source, "player.actionhistory.view") then
        if not discordId then
            PrintDebugMessage("No Discord ID provided, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, {})
            return
        end
        local history = Storage.getAction(discordId)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, history)
    else
        PrintDebugMessage("Player does not have permission to view action history.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", source, {})
    end
end)

RegisterNetEvent("EasyAdmin:LogAction", function(action)
    if DoesPlayerHavePermission(source, "player.actionhistory.add") then
        if not action then
            PrintDebugMessage("Action not defined.", 2)
        end
        Storage.addAction(action.type, action.discordId, action.reason, action.moderator, action.moderatorId, action.expire, action.expireString)
        PrintDebugMessage("Action logged successfully.", 2)
    end
end)

RegisterNetEvent("EasyAdmin:DeleteAction", function(actionId)
    if DoesPlayerHavePermission(source, "player.actionhistory.delete") then
        if not actionId then
            PrintDebugMessage("Invalid parameters provided for action deletion.", 2)
            return
        end
        Storage.removeAction(actionId)
        PrintDebugMessage("Action deleted successfully.", 2)
        local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
        SendWebhookMessage(preferredWebhook, string.format(GetLocalisedText("actionhistorydeleted"), getName(source, false, true), actionId), "", 16777214)
    else
        PrintDebugMessage("Player does not have permission to delete actions.", 2)
    end
end)

-- MOVED TO STORAGE.LUA

-- AddEventHandler("EasyAdmin:LogAction", function(data, remove, forceChange)
--     if GetConvar("ea_enableActionHistory", "true") == "true" then
--         local change = (forceChange or false)
--         local content = LoadResourceFile(GetCurrentResourceName(), "actions.json")
--         if not content then
--             PrintDebugMessage("actions.json file was missing, we created a new one.", 2)
--             local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode({}), -1)
--             if not saved then
--                 PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
--             end
--             content = json.encode({})
--         end
--         actions = json.decode(content)

--         if not actions then
--             PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
--             PrintDebugMessage("^1Failed^7 to load Actions!\n")
--             PrintDebugMessage("Please check your actions file for errors, ^Action history *will not* work!^7\n")
--             PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
--             return
--         end

--         if data and not remove then
--             if data.action == "BAN" then
--                 table.insert(actions, {
--                     time = os.time(),
--                     id = #actions + 1,
--                     banId = data.banId,
--                     action = data.action,
--                     discord = data.discord,
--                     reason = data.reason,
--                     moderator = data.moderator,
--                     moderatorId = data.moderatorId,
--                     expire = data.expire,
--                     expireString = data.expireString
--                 })
--             elseif data.action == "OFFLINE BAN" then
--                 table.insert(actions, {
--                     time = os.time(),
--                     id = #actions + 1,
--                     banId = data.banId,
--                     action = data.action,
--                     discord = data.discord,
--                     reason = data.reason,
--                     moderator = data.moderator,
--                     moderatorId = data.moderatorId,
--                     expire = data.expire,
--                     expireString = data.expireString
--                 })
--             elseif data.action == "KICK" then
--                 table.insert(actions, {
--                     time = os.time(),
--                     id = #actions + 1,
--                     action = data.action,
--                     discord = data.discord,
--                     reason = data.reason,
--                     moderator = data.moderator,
--                     moderatorId = data.moderatorId,
--                 })
--             elseif data.action == "WARN" then
--                 table.insert(actions, {
--                     time = os.time(),
--                     id = #actions + 1,
--                     action = data.action,
--                     discord = data.discord,
--                     reason = data.reason,
--                     moderator = data.moderator,
--                     moderatorId = data.moderatorId,
--                 })
--             elseif data.action == "UNBAN" then
--                 for i, act in ipairs(actions) do
--                     if act.banId == data.banId then
--                         act["action"]  = data.action
--                         break
--                     end
--                 end
--             end
--             PrintDebugMessage("Added the following to actions:\n"..table_to_string(data), 4)
--             change=true
--         elseif not data then
--             return
--         end
--         if data and remove then
--             PrintDebugMessage("Removed the following data from actions:\n"..table_to_string(data), 4)
--             change = true
--         end
--         if change then
--             PrintDebugMessage("Actions changed, saving..", 4)
--             local saved = SaveResourceFile(GetCurrentResourceName(), "actions.json", json.encode(actions, {indent = true}), -1)
--             if not saved then
--                 PrintDebugMessage("^1Saving actions.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
--             end
--         end
--         PrintDebugMessage("Completed Actions Updated.", 4)
--     end
-- end)

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