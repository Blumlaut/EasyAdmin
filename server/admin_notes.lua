RegisterNetEvent("EasyAdmin:GetAdminNotes", function(playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.view") then
        if not playerId then
            PrintDebugMessage("Player ID not parsed.", 2)
            TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, {})
            return
        end
        local history = Storage.getNotes(playerId)
        TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, history, playerId)
    else
        PrintDebugMessage("Player does not have permission to view admin notes.", 2)
        TriggerClientEvent("EasyAdmin:ReceiveAdminNotes", src, {}, playerId)
    end
end)

RegisterNetEvent("EasyAdmin:AddAdminNote", function(note, playerId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.add") then
        if not note then
            PrintDebugMessage("Note not defined.", 2)
        end

        local identifiers = getAllPlayerIdentifiers(playerId)
        local moderatorIdentifiers = getAllPlayerIdentifiers(src)

        Storage.addNote(note, identifiers, GetPlayerName(src), moderatorIdentifiers)
        PrintDebugMessage("Admin not added successfully.", 2)
    end
end)

RegisterNetEvent("EasyAdmin:DeleteAdminNote", function(noteId)
    local src = source
    if DoesPlayerHavePermission(src, "player.adminnotes.delete") then
        if not noteId then
            PrintDebugMessage("Invalid parameters for admin note deletion.", 2)
        end

        Storage.removeNote(noteId)
        PrintDebugMessage("Note deleted successfully.", 2)
    end
end)