
-- THIS IS OBSOLETE NOW, PLEASE USE THE 'admins.txt' FILE TO ADD ADMINS
admins = {}
-- THIS IS OBSOLETE NOW, PLEASE USE THE 'admins.txt' FILE TO ADD ADMINS

strings = { -- these are the strings we use to show our players, feel free to edit to your liking
	-- EasyAdmin Base strings
	bannedjoin = "You are Blacklisted from joining this Server \nReason: %s",
	kicked = "Kicked by %s, Reason: %q",
	banned = "You have been banned from this Server, Reason: %q",
	reasonadd = " ( Nickname: %s ), Banned by: %q",
	bancheating = "Banned for Cheating",
	bancheatingadd = " ( Nickname: %s )",
	nongiven = "non given",
	newadmin = "You are now an Admin",
	playernotfound = "Player could not be found.",
	done = "Done!",
	-- Queue Strings
	checkforslot = "Checking for a Free Slot...",
	serverfulldenied = "This Server is Full, please try again later!",
	serverfulltrying = "Server Full, Your Position in Queue: %s, Disconnecting in %q tries.",
	posinqueue = "Your Position in Queue: %s",
	lostqueuepos = "You lost your position in the Queue, please try reconnecting",
}


Citizen.CreateThread(function()


	RegisterServerEvent('EasyAdmin:amiadmin')
	AddEventHandler('EasyAdmin:amiadmin', function()
		local banperm = DoesPlayerHavePermission(source,"command.ban")
		local kickperm = DoesPlayerHavePermission(source,"command.kick")
		local spectateperm = DoesPlayerHavePermission(source,"command.spectate")
		local unbanperm = DoesPlayerHavePermission(source,"command.unban")
		local teleportperm = DoesPlayerHavePermission(source,"command.teleport")
		TriggerClientEvent("EasyAdmin:adminresponse", source, "ban",banperm)
		TriggerClientEvent("EasyAdmin:adminresponse", source, "kick",kickperm)
		TriggerClientEvent("EasyAdmin:adminresponse", source, "spectate",spectateperm)
		TriggerClientEvent("EasyAdmin:adminresponse", source, "unban",unbanperm)
		TriggerClientEvent("EasyAdmin:adminresponse", source, "teleport",teleportperm)

		if banperm then
			TriggerClientEvent('chat:addSuggestion', source, '/ban', 'ban a player', { {name='player id', help="the player's server id"}, {name='reason', help="your reason."} } )
		end
		if kickperm then
			TriggerClientEvent('chat:addSuggestion', source, '/kick', 'kick a player', { {name='player id', help="the player's server id"}, {name='reason', help="your reason."}} )
		end
		if spectateperm then
			TriggerClientEvent('chat:addSuggestion', source, '/spectate', 'spectate a player', { {name='player id', help="the player's server id"} })
		end
		if unbanperm then
			TriggerClientEvent('chat:addSuggestion', source, '/unban', 'unban an identifier', { {name='identifier', help="the identifier ( such as steamid, ip or license )"} })
		end
		if teleportperm then
			TriggerClientEvent('chat:addSuggestion', source, '/teleport', 'teleport to a player', { {name='player id', help="the player's server id"} })
		end

		-- give player the right settings to work with
		TriggerClientEvent("EasyAdmin:SetSetting", source, "button",GetConvarInt("ea_MenuButton", 289) )
		if GetConvar("ea_alwaysShowButtons", "false") == "true" then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", true)
		else
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", false)
		end

	end)

	RegisterServerEvent("EasyAdmin:kickPlayer")
	AddEventHandler('EasyAdmin:kickPlayer', function(playerId,reason)
		if DoesPlayerHavePermission(source,"command.kick") then
				DropPlayer(playerId, string.format(strings.kicked, GetPlayerName(source), reason) )
		end
	end)

	RegisterServerEvent("EasyAdmin:requestSpectate")
	AddEventHandler('EasyAdmin:requestSpectate', function(playerId)
		if DoesPlayerHavePermission(source,"command.spectate") then
				TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId)
		end
	end)


	RegisterServerEvent("EasyAdmin:banPlayer")
	AddEventHandler('EasyAdmin:banPlayer', function(playerId,reason)
		if DoesPlayerHavePermission(source,"command.ban") then
			local bannedIdentifiers = GetPlayerIdentifiers(playerId)
			for i,identifier in ipairs(bannedIdentifiers) do
				if string.find(identifier, "license:") then
					reason = reason.. string.format(strings.reasonadd, GetPlayerName(playerId), GetPlayerName(source) )
					reason = string.gsub(reason, "|", "") -- filter out any characters that could break me
					reason = string.gsub(reason, ";", "")
					updateBlacklist(identifier..";"..reason)
				end
			end
			DropPlayer(playerId, string.format(strings.banned, reason ) )
		end
	end)

	RegisterServerEvent("banCheater")
	AddEventHandler('banCheater', function(playerId,reason)
		if not reason then reason = "Cheating" end
		if GetPlayerName(source) then return end
		local bannedIdentifiers = GetPlayerIdentifiers(playerId)
		for i,identifier in ipairs(bannedIdentifiers) do
			if string.find(identifier, "license:") then
				reason = reason..string.format(strings.bancheatingadd, GetPlayerName(playerId) )
				reason = string.gsub(reason, "|", "") -- filter out any characters that could break me
				reason = string.gsub(reason, ";", "")
				updateBlacklist(identifier..";"..reason)
			end
		end
		DropPlayer(playerId, strings.bancheating)
	end)


	RegisterServerEvent("EasyAdmin:updateBanlist")
	AddEventHandler('EasyAdmin:updateBanlist', function(playerId)
		local src = source
		if DoesPlayerHavePermission(source,"command.kick") then
				updateBlacklist(false,true)
				Citizen.Wait(300)
				TriggerClientEvent("EasyAdmin:fillBanlist", src, blacklist, blacklist.reasons)
			end
	end)


------------------------------ COMMANDS

	RegisterCommand("addadmin", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) then
			local numIds = GetPlayerIdentifiers(args[1])
			for i,theId in ipairs(numIds) do
				if string.find(theId, "license:") then
					updateAdmins(theId)
					TriggerClientEvent("EasyAdmin:adminresponse", args[1], true)
					TriggerClientEvent("chat:addMessage", args[1], { args = { "EasyAdmin", strings.newadmin } })
					Citizen.Trace("player has been added as an admin!")
				end
			end
		elseif args[1] and string.find(args[1], "steam:") or string.find(args[1], "license:") or string.find(args[1], "ip:") then
			updateAdmins(args[1])
			Citizen.Trace("identifier has been added as an admin!")
		else
			Citizen.Trace("Unable to Add Admin ( player id invalid / invalid identifier? )\n")
		end
	end, true)

	RegisterCommand("kick", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) then
			local reason = ""
			for i,theArg in pairs(args) do
				if i ~= 1 then -- make sure we are not adding the kicked player as a reason
					reason = reason..theArg
				end
			end
			if GetPlayerName(args[1]) then
				DropPlayer(args[1], string.format(strings.kicked, GetPlayerName(source), reason) )
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, true)

	RegisterCommand("ban", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) then
			local reason = ""
			for i,theArg in pairs(args) do
				if i ~= 1 then
					reason = reason..theArg
				end
			end
			if GetPlayerName(args[1]) then
				local bannedIdentifiers = GetPlayerIdentifiers(args[1])
				for i,identifier in ipairs(bannedIdentifiers) do
					if string.find(identifier, "license:") then
						reason = reason.. string.format(strings.reasonadd, GetPlayerName(args[1]), GetPlayerName(source) )
						reason = string.gsub(reason, "|", "") -- filter out any characters that could break me
						reason = string.gsub(reason, ";", "")
						updateBlacklist(identifier..";"..reason)
					end
				end
				DropPlayer(args[1], string.format(strings.banned, reason ) )
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, true)

	RegisterCommand("spectate", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) then
			if GetPlayerName(args[1]) then
				TriggerClientEvent("EasyAdmin:requestSpectate", source, args[1])
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, true)

	RegisterCommand("unban", function(source, args, rawCommand)
		if args[1] then
			updateBlacklistRemove(args[1])
			TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.done } })
		end
	end, true)

	RegisterCommand("teleport", function(source, args, rawCommand)
		if args[1] then
			-- not yet
		end
	end, true)





	RegisterServerEvent("EasyAdmin:unbanPlayer")
	AddEventHandler('EasyAdmin:unbanPlayer', function(playerId)
		if DoesPlayerHavePermission(source,"command.unban") then
			updateBlacklistRemove(playerId)
		end
	end)

	function DoesPlayerHavePermission(player, object)
		local haspermission = false

		if IsPlayerAceAllowed(player,object) then -- check if the player has access to this permission
			haspermission = true
		else
			haspermission = false
		end

		if not haspermission then -- if not, check if they are admin using the legacy method.
			local numIds = GetPlayerIdentifiers(player)
			for i,admin in pairs(admins) do
				for i,theId in pairs(numIds) do
					if admin == theId then
						haspermission = true
					end
				end
			end
		end
		return haspermission
	end

	blacklist = {}
	blacklist.reasons = {}

	function updateAdmins(addItem)
		admins = {}
		local content = LoadResourceFile(GetCurrentResourceName(), "admins.txt")
		if not addItem then
			for index,value in ipairs(mysplit(content, "\n")) do
				admins[index] = value -- update admin list
			end
		else
			if string.len(content) > 1 then
				content = content.."\n"..addItem
			else
				content = content..""..addItem
			end
			for index,value in ipairs(mysplit(content, "\n")) do
				admins[index] = value -- update admin list
			end
		end

		for i,theKey in ipairs(GetPlayers()) do
			local numIds = GetPlayerIdentifiers(theKey)
			for i,admin in ipairs(admins) do
				for i,theId in ipairs(numIds) do
					if admin == theId .. '\r' or admin == theId then -- is the player an admin?
						TriggerClientEvent("EasyAdmin:adminresponse", theKey, true)
					end
				end
			end
		end

		SaveResourceFile(GetCurrentResourceName(), "admins.txt", content, -1)
	end

	function updateBlacklist(addItem)
		blacklist = {}
		blacklist.reasons = {}
		local content = LoadResourceFile(GetCurrentResourceName(), "banlist.txt")
		if string.find(content, "|") ~= nil then
			content = string.gsub(content,"|","\n")
			Citizen.Trace("Found old banlist file, converting to new format..\n")
			Citizen.Wait(50)
		end
		if not addItem then
			for index,value in ipairs(mysplit(content, "\n")) do
				curstring = "" -- make a new string
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string
				end
				local reason = string.match(value, "^.*%;(.*)" ) or strings.nongiven -- get the reason from the string or use "none given" if it's nil

				blacklist[index] = curstring
				blacklist.reasons[index] = reason
			end
		else
			if string.len(content) > 1 then
				content = content.."\n"..addItem
			else
				content = content..""..addItem
			end
			for index,value in ipairs(mysplit(content, "\n")) do
				curstring = "" -- make a new string
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string
				end
				local reason = string.match(value, "^.*%;(.*)" ) or strings.nongiven -- get the reason from the string or use "none given" if it's nil

				blacklist[index] = curstring
				blacklist.reasons[index] = reason
			end
		end
		SaveResourceFile(GetCurrentResourceName(), "banlist.txt", content, -1)
	end



	function updateBlacklistRemove(removeItem)
		blacklist = {}
		blacklist.reasons = {}
		content = LoadResourceFile(GetCurrentResourceName(), "banlist.txt")
		oldcontent = content
		for index,value in ipairs(mysplit(content, "\n")) do
			curstring = "" -- make a new string
			for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
				if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
				curstring = curstring..string.sub(value,i,i) -- add our current letter to our string
			end
			local reason = string.match(value, "^.*%;(.*)" ) or "" -- get the reason from the string or use "none given" if it's nil
			value = string.gsub(value, "([^%w])", "%%%1") -- escape everything so gsub doesnt get confused
			if removeItem == curstring then
				content = string.gsub(content, value.."\n", "")
			end
			if oldcontent == content then
				if removeItem == curstring then
					content = string.gsub(content, value, "")
				end
			end

		end
		SaveResourceFile(GetCurrentResourceName(), "banlist.txt", content, -1)
		updateBlacklist(false,false)
	end

	function IsIdentifierBanned(identifier)
		local identifierfound = false
		for index,value in ipairs(blacklist) do
			if identifier == value then
				identifierfound = true
			end
		end
		return identifierfound
	end

	function BanIdentifier(identifier,reason)
		updateBlacklist(identifier..";"..reason)
	end

	AddEventHandler('playerConnecting', function(playerName, setKickReason)
		local numIds = GetPlayerIdentifiers(source)
		for bi,blacklisted in ipairs(blacklist) do
			for i,theId in ipairs(numIds) do
				if blacklisted == theId and useQueue == "false" then -- make sure Queue isn't used as otherwise they will conflict
					setKickReason(string.format( strings.bannedjoin, blacklist.reasons[bi] ))
					print("Connection Refused, Blacklisted for "..blacklist.reasons[bi].."!\n")
					CancelEvent()
					return
				end
			end
		end
	end)



	---------------------------------- USEFUL
	function mysplit(inputstr, sep)
		if sep == nil then
			sep = "%s"
		end
		local t={} ; i=1
		for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
			t[i] = str
			i = i + 1
		end
		return t
	end

	function checkVersion(err,responseText, headers)
		curVersion = LoadResourceFile(GetCurrentResourceName(), "version")

		updatePath = "/Bluethefurry/EasyAdmin"
		resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"

		if curVersion ~= responseText and tonumber(curVersion) < tonumber(responseText) then
			print("\n###############################")
			print("\n"..resourceName.." is outdated, should be:\n"..responseText.."is:\n"..curVersion.."\nplease update it from https://github.com"..updatePath.."")
			print("\n###############################")
		elseif tonumber(curVersion) > tonumber(responseText) then
			print(resourceName..": Version higher than production, skipping..")
		end
		SetTimeout(3600000, checkVersionHTTPRequest)
	end

	function checkVersionHTTPRequest()
		PerformHttpRequest("https://raw.githubusercontent.com/Bluethefurry/EasyAdmin/master/version", checkVersion, "GET")
	end

	function loopUpdateBlacklist()
		updateBlacklist()
		SetTimeout(300000, loopUpdateBlacklist)
	end

	function loopUpdateAdmins()
		updateAdmins()
		SetTimeout(300000, loopUpdateAdmins)
	end

	---------------------------------- END USEFUL
	loopUpdateBlacklist()
	loopUpdateAdmins()
	checkVersionHTTPRequest()
end)
