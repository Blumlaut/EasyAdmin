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

RegisterCommand("ea_addShortcut", function(source, args, rawCommand)
	if args[2] and DoesPlayerHavePermission(source, "server.shortcut.add") then
		local shortcut = args[1]
		local text = table.concat(args, " ", 2)
		
		PrintDebugMessage("added '"..shortcut.." -> "..text.."' as a shortcut", 3)
		MessageShortcuts[shortcut] = text
		
		for i,_ in pairs(OnlineAdmins) do 
			TriggerLatentClientEvent("EasyAdmin:fillShortcuts", i, 10000, MessageShortcuts)
		end
	end
end)

RegisterCommand("ea_addReminder", function(source, args, rawCommand)
	if args[1] and DoesPlayerHavePermission(source, "server.reminder.add") then
		local text = string.gsub(rawCommand, "ea_addReminder ", "")
		local text = string.gsub(text, '"', '')
		
		PrintDebugMessage("added '"..text.."' as a Chat Reminder", 3)
		table.insert(ChatReminders, text)
	end
end, false)

RegisterCommand("ea_printIdentifiers", function(source,args,rawCommand)
	if source == 0 and args[1] then -- only let Console run this command
		local id = tonumber(args[1])
		local identifiers = getCachedPlayerIdentifiers(id) or {}
		print(json.encode(identifiers)) -- puke all identifiers into console
	end
end,false)

RegisterCommand("spectate", function(source, args, rawCommand)
    if(source == 0) then
        Citizen.Trace(GetLocalisedText("Don't do that, please.")) -- Maybe should be it's own string saying something like "only players can do this" or something
    end
    
    PrintDebugMessage("Player "..getName(source,true).." Requested Spectate on "..getName(args[1],true), 3)
    
    if args[1] and tonumber(args[1]) and DoesPlayerHavePermission(source, "player.spectate") then
        if getName(args[1]) then
            TriggerClientEvent("EasyAdmin:requestSpectate", source, args[1])
        else
            TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("Player could not be found."))
        end
    end
end, false)


RegisterCommand("setgametype", function(source, args, rawCommand)
    if args[1] and DoesPlayerHavePermission(source, "server.convars") then
        PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..args[1], 3)
        SetGameType(args[1])
    end
end, false)

RegisterCommand("setmapname", function(source, args, rawCommand)
    if args[1] and DoesPlayerHavePermission(source, "server.convars") then
        PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..args[1], 3)
        SetMapName(args[1])
    end
end, false)

RegisterCommand("slap", function(source, args, rawCommand)
    if args[1] and args[2] and DoesPlayerHavePermission(source, "player.slap") then
        TriggerEvent("EasyAdmin:SlapPlayer", tonumber(args[1]), tonumber(args[2]))
    end
end, false)	