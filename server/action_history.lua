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
        if not targetPlayerId then
            PrintDebugMessage("Invalid player ID provided for action history, returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, playerId)
            return
        end
        -- Resolve identifiers cache-first so action history works for cached/recently-dropped
        -- players too, with a live fallback for players cached this session.
        local identifiers = getCachedPlayerIdentifiers(targetPlayerId) or getAllPlayerIdentifiers(targetPlayerId)
        if not identifiers or #identifiers == 0 then
            PrintDebugMessage("User has no resolvable identifiers (offline and uncached), returning empty action history.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, targetPlayerId)
            return
        end
        local history = Storage.getAction(identifiers)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, history, targetPlayerId)
    else
        PrintDebugMessage("Player does not have permission to view action history.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveActionHistory", src, {}, playerId)
    end
end)

-- Server-internal event (deliberately NOT a net event): only EasyAdmin / plugin server code fires
-- this via TriggerEvent, where `source` is nil. The moderator must therefore be supplied in the
-- action payload (with best-effort fallbacks); the target's identifiers are resolved cache-first.
AddEventHandler("EasyAdmin:LogAction", function(action, playerId)
    if not action or not action.action then
        PrintDebugMessage("Invalid action data provided.", 2)
        return
    end
    if GetConvar("ea_enableActionHistory", "true") ~= "true" then return end

    local identifiers = action.identifiers or getCachedPlayerIdentifiers(playerId) or getAllPlayerIdentifiers(playerId)
    local moderatorName = action.moderator or "Console"
    local moderatorIdentifiers = action.moderatorIdents or {}
    local reason = action.reason or ""

    Storage.addAction(action.action, identifiers, reason, moderatorName, moderatorIdentifiers, action.banid)
    PrintDebugMessage("Action logged successfully.", 2)
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
        SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** deleted Action History entry #**{id}**", { by = getName(src, false, true), id = actionId }), "", 16777214)
    else
        PrintDebugMessage("Player does not have permission to delete actions.", 2)
    end
end)