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
    if DoesPlayerHavePermission(src, "player.actionhistory.view") then
        local targetPlayerId = tonumber(playerId)
        if not targetPlayerId or not GetPlayerName(targetPlayerId) then
            PrintDebugMessage("Invalid or offline player ID provided for action history, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, playerId)
            return
        end
        local identifiers = getAllPlayerIdentifiers(targetPlayerId)
        if not identifiers then
            PrintDebugMessage("User has no identifiers somehow, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {})
            return
        end
        local history = Storage.getAction(identifiers)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, history, targetPlayerId)
    else
        PrintDebugMessage("Player does not have permission to view action history.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, playerId)
    end
end)

RegisterNetEvent("EasyAdmin:LogAction", function(action, playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.actionhistory.add") then
        if not action or not action.action then
            PrintDebugMessage("Invalid action data provided.", 2)
            return
        end

        local identifiers = getAllPlayerIdentifiers(playerId)
        local moderatorIdentifiers = getAllPlayerIdentifiers(src)
        local reason = action.reason or ""

        Storage.addAction(action.action, identifiers, reason, GetPlayerName(src), moderatorIdentifiers)
        PrintDebugMessage("Action logged successfully.", 2)
    end
end)

exports('getActionHistory', function(identifiers)
    return Storage.getAction(identifiers)
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

        local preferredWebhook = getPreferredWebhook()
        SendWebhookMessage(preferredWebhook, string.format(GetLocalisedText("actionhistorydeleted"), getName(src, false, true), actionId), "", 16777214)
    else
        PrintDebugMessage("Player does not have permission to delete actions.", 2)
    end
end)