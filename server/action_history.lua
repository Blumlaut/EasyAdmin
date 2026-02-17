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

RegisterNetEvent("EasyAdmin:GetActionHistory", function(playerId)
    local src = source
    local identifiers = getAllPlayerIdentifiers(playerId)
    if DoesPlayerHavePermission(src, "player.actionhistory.view") then
        if not identifiers then
            PrintDebugMessage("User has no identifiers somehow, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {})
            return
        end
        local history = Storage.getAction(identifiers)
        print(json.encode(history))
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, history, playerId)
    else
        PrintDebugMessage("Player does not have permission to view action history.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, playerId)
    end
end)

RegisterNetEvent("EasyAdmin:LogAction", function(action, playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.actionhistory.add") then
        if not action then
            PrintDebugMessage("Action not defined.", 2)
        end

        local identifiers = getAllPlayerIdentifiers(playerId)
        local moderatorIdentifiers = getAllPlayerIdentifiers(src)

        Storage.addAction(action.action, identifiers, action.reason, GetPlayerName(src), moderatorIdentifiers, action.expire, action.expireString)
        PrintDebugMessage("Action logged successfully.", 2)
    end
end)

RegisterNetEvent("EasyAdmin:DeleteAction", function(actionId)
    local src = source
    if DoesPlayerHavePermission(src, "player.actionhistory.delete") then
        if not actionId then
            PrintDebugMessage("Invalid parameters provided for action deletion.", 2)
            return
        end
        Storage.removeAction(actionId)
        PrintDebugMessage("Action deleted successfully.", 2)

        detailNotification = GetConvar("ea_detailNotification", "false")
        moderationNotification = GetConvar("ea_moderationNotification", "false")
        local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
        SendWebhookMessage(preferredWebhook, string.format(GetLocalisedText("actionhistorydeleted"), getName(src, false, true), actionId), "", 16777214)
    else
        PrintDebugMessage("Player does not have permission to delete actions.", 2)
    end
end)