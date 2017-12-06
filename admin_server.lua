
-- THIS IS OBSOLETE NOW, PLEASE USE THE 'admins.txt' FILE TO ADD ADMINS
admins = {}
-- THIS IS OBSOLETE NOW, PLEASE USE THE 'admins.txt' FILE TO ADD ADMINS

strings = { -- these are the strings we use to show our players, feel free to edit to your liking
	-- EasyAdmin Base strings
	bannedjoin = "You are Blacklisted from joining this Server \nReason: %s",
	kicked = "Kicked by %s, Reason: %q",
	banned = "You have been banned from this Server, Reason: %q",
	reasonadd = "( Nickname: %s ), Banned by: %q",
	bancheating = "Banned for Cheating",
	bancheatingadd = " ( Nickname: %s )",
	nongiven = "non given",
	newadmin = "You are now an Admin",

	-- Queue Strings
	checkforslot = "Checking for a Free Slot...",
	serverfulldenied = "This Server is Full, please try again later!",
	serverfulltrying = "Server Full, Your Position in Queue: %s, Disconnecting in %q tries.",
	posinqueue = "Your Position in Queue: %s",
	lostqueuepos = "You lost your position in the Queue, please try reconnecting",
}


Citizen.CreateThread(function()


	RegisterServerEvent('amiadmin')
	AddEventHandler('amiadmin', function()
		local numIds = GetPlayerIdentifiers(source)
		for i,admin in pairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player an admin?
					TriggerClientEvent("adminresponse", source, true)
				end
			end
		end
	end)

	RegisterServerEvent("kickPlayer")
	AddEventHandler('kickPlayer', function(playerId,reason)
		local numIds = GetPlayerIdentifiers(source)
		for i,admin in pairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
					DropPlayer(playerId, string.format(strings.kicked, GetPlayerName(source), reason) )
				end
			end
		end
	end)


	RegisterServerEvent("banPlayer")
	AddEventHandler('banPlayer', function(playerId,reason)
		local numIds = GetPlayerIdentifiers(source)
		for i,admin in pairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
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
			end
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


	RegisterServerEvent("updateBanlist")
	AddEventHandler('updateBanlist', function(playerId)
		local src = source
		local numIds = GetPlayerIdentifiers(src)
		for i,admin in pairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player requesting the update ACTUALLY AN ADMIN?
					updateBlacklist(false,true)
					Citizen.Wait(300)
					TriggerClientEvent("fillBanlist", src, blacklist, blacklist.reasons)
				end
			end
		end
	end)

	RegisterCommand("addadmin", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) then
			local numIds = GetPlayerIdentifiers(args[1])
			for i,theId in ipairs(numIds) do
				if string.find(theId, "license:") then
					updateAdmins(theId)
					TriggerClientEvent("adminresponse", args[1], true)
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

	RegisterServerEvent("unbanPlayer")
	AddEventHandler('unbanPlayer', function(playerId)
		local numIds = GetPlayerIdentifiers(source)
		for i,admin in pairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player requesting the unban ACTUALLY AN ADMIN?
					updateBlacklistRemove(playerId)
				end
			end
		end
	end)



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
						TriggerClientEvent("adminresponse", theKey, true)
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
				if blacklisted == theId and not useQueue then -- make sure Queue isn't used as otherwise they will conflict
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
