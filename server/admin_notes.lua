exports('getAdminNotes', function(identifiers)
    return Storage.getNotesByIdents(identifiers)
end)

RegisterNetEvent("EasyAdmin:GetAdminNotes", function(playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.view") then
        local targetPlayerId = tonumber(playerId)
        -- Resolve identifiers cache-first so notes work for cached/recently-dropped players too.
        local identifiers = targetPlayerId and (getCachedPlayerIdentifiers(targetPlayerId) or getAllPlayerIdentifiers(targetPlayerId))
        if not identifiers or #identifiers == 0 then
            PrintDebugMessage("No identifiers resolvable for admin notes lookup, returning empty.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, {}, playerId)
            return
        end
        local history = Storage.getNotesByIdents(identifiers)
        TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, history, playerId)
    else
        PrintDebugMessage("Player does not have permission to view admin notes.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, {}, playerId)
    end
end)

RegisterNetEvent("EasyAdmin:AddAdminNote", function(note, playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.add") then
        if not note or note == "" then
            PrintDebugMessage("Note not defined.", 2)
            return
        end

        local identifiers = getAllPlayerIdentifiers(playerId)
        local moderatorIdentifiers = getAllPlayerIdentifiers(src)

        Storage.addNote(note, identifiers, GetPlayerName(src), moderatorIdentifiers)
        PrintDebugMessage("Admin note added successfully.", 2)
    end
end)

RegisterNetEvent("EasyAdmin:DeleteAdminNote", function(noteId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.delete") then
        if not noteId then
            PrintDebugMessage("Invalid parameters for admin note deletion.", 2)
            return
        end

        Storage.removeNote(noteId)
        PrintDebugMessage("Admin note deleted successfully.", 2)
    end
end)