
-- THIS IS OBSOLETE NOW, PLEASE USE THE WIKI TO ADD ADMINS
admins = {}
-- THIS IS OBSOLETE NOW, PLEASE USE THE WIKI TO ADD ADMINS
permissions = {
	ban = false,
	kick = false,
	spectate = false,
	unban = false,
	teleport = false,
	manageserver = false,
	slap = false,
	freeze = false,
}

Citizen.CreateThread(function()
	strings = json.decode(LoadResourceFile(GetCurrentResourceName(), "language/"..GetConvar("ea_LanguageName", "en")..".json"))[1]
	
	moderationNotification = GetConvar("ea_moderationNotification", "false")
	RegisterServerEvent('EasyAdmin:amiadmin')
	AddEventHandler('EasyAdmin:amiadmin', function()
		
		local identifiers = GetPlayerIdentifiers(source)
		for perm,val in pairs(permissions) do
			local thisPerm = DoesPlayerHavePermission(source,"easyadmin."..perm)
			TriggerClientEvent("EasyAdmin:adminresponse", source, perm,thisPerm)
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.ban") then
			TriggerClientEvent('chat:addSuggestion', source, '/ban', strings.chatsuggestionban, { {name='player id', help="the player's server id"}, {name='reason', help="your reason."} } )
		end
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			TriggerClientEvent('chat:addSuggestion', source, '/kick', strings.chatsuggestionkick, { {name='player id', help="the player's server id"}, {name='reason', help="your reason."}} )
		end
		if DoesPlayerHavePermission(source,"easyadmin.spectate") then
			TriggerClientEvent('chat:addSuggestion', source, '/spectate', strings.chatsuggestionspectate, { {name='player id', help="the player's server id"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.unban") then
			TriggerClientEvent('chat:addSuggestion', source, '/unban', strings.chatsuggestionunban, { {name='identifier', help="the identifier ( such as steamid, ip or license )"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.teleport") then
			TriggerClientEvent('chat:addSuggestion', source, '/teleport', strings.chatsuggestionteleport, { {name='player id', help="the player's server id"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			TriggerClientEvent('chat:addSuggestion', source, '/setgametype', strings.chatsuggestiongametype, { {name='game type', help="the game type"} })
			TriggerClientEvent('chat:addSuggestion', source, '/setmapname', strings.chatsuggestionmapname, { {name='map name', help="the map name"} })
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.slap") then
			TriggerClientEvent('chat:addSuggestion', source, '/slap', strings.chatsuggestionslap, { {name='player id', help="the player's server id"},{name='hp', help="the hp to take"} })
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.freeze") then
			TriggerClientEvent('chat:addSuggestion', source, '/freeze', strings.chatsuggestionfreeze, { {name='player id', help="the player's server id"},{name='toggle', help="either true or false"} })
		end
		
		-- give player the right settings to work with
		TriggerClientEvent("EasyAdmin:SetSetting", source, "button",GetConvarInt("ea_MenuButton", 289) )
		if GetConvar("ea_alwaysShowButtons", "false") == "true" then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", true)
		else
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", false)
		end
		
		TriggerClientEvent("EasyAdmin:SetLanguage", source, strings)
		
	end)
	
	RegisterServerEvent("EasyAdmin:kickPlayer")
	AddEventHandler('EasyAdmin:kickPlayer', function(playerId,reason)
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			SendWebhookMessage(moderationNotification,string.format(strings.adminkickedplayer, GetPlayerName(source), GetPlayerName(playerId), reason))
			DropPlayer(playerId, string.format(strings.kicked, GetPlayerName(source), reason) )
		end
	end)
	
	RegisterServerEvent("EasyAdmin:requestSpectate")
	AddEventHandler('EasyAdmin:requestSpectate', function(playerId)
		if DoesPlayerHavePermission(source,"easyadmin.spectate") then
			TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetGameType")
	AddEventHandler('EasyAdmin:SetGameType', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			SetGameType(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetMapName")
	AddEventHandler('EasyAdmin:SetMapName', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			SetMapName(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StartResource")
	AddEventHandler('EasyAdmin:StartResource', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			StartResource(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StopResource")
	AddEventHandler('EasyAdmin:StopResource', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			StopResource(text)
		end
	end)
	
	
	RegisterServerEvent("EasyAdmin:banPlayer")
	AddEventHandler('EasyAdmin:banPlayer', function(playerId,reason,expires)
		if DoesPlayerHavePermission(source,"easyadmin.ban") then
			local playerLicense = ""
			local playerSteamid = false
			local bannedIdentifiers = GetPlayerIdentifiers(playerId)
			if expires < os.time() then
				expires = os.time()+expires 
			end
			for i,identifier in ipairs(bannedIdentifiers) do
				if string.find(identifier, "license:") then
					playerLicense = identifier
				elseif string.find(identifier, "steam:") then
					playerSteamid = identifier
				end
			end
			reason = reason.. string.format(strings.reasonadd, GetPlayerName(playerId), GetPlayerName(source) )
			local ban = {identifier = playerLicense, reason = reason, expire = expires or 10444633200 }
			if playerSteamid then
				ban = {identifier = playerLicense, steam = playerSteamid, reason = reason, expire = expires or 10444633200 }
			end
			updateBlacklist( ban )
			
			SendWebhookMessage(moderationNotification,string.format(strings.adminbannedplayer, GetPlayerName(source), GetPlayerName(playerId), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ))
			DropPlayer(playerId, string.format(strings.banned, reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ) )
		end
	end)
	
	AddEventHandler('banCheater', function(playerId,reason)
		if not reason then reason = "Cheating" end
		if GetPlayerName(source) then return end
		local bannedIdentifiers = GetPlayerIdentifiers(playerId)
		for i,identifier in ipairs(bannedIdentifiers) do
			if string.find(identifier, "license:") then
				playerLicense = identifier
			elseif string.find(identifier, "steam:") then
				playerSteamid = identifier
			end
		end
		reason = reason.. string.format(strings.bancheatingadd, GetPlayerName(playerId), GetPlayerName(source) )
		local ban = {identifier = playerLicense, reason = reason, expire = expires or 10444633200 }
		if playerSteamid then
			ban = {identifier = playerLicense, steam = playerSteamid, reason = reason, expire = expires or 10444633200 }
		end
		updateBlacklist( ban )
		DropPlayer(playerId, strings.bancheating)
	end)
	
	
	RegisterServerEvent("EasyAdmin:updateBanlist")
	AddEventHandler('EasyAdmin:updateBanlist', function(playerId)
		local src = source
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			updateBlacklist(false,true)
			Citizen.Wait(300)
			TriggerClientEvent("EasyAdmin:fillBanlist", src, blacklist)
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
		if args[1] and tonumber(args[1]) and DoesPlayerHavePermission(source,"easyadmin.kick") then
			local reason = ""
			for i,theArg in pairs(args) do
				if i ~= 1 then -- make sure we are not adding the kicked player as a reason
					reason = reason.." "..theArg
				end
			end
			if GetPlayerName(args[1]) then
				SendWebhookMessage(moderationNotification,string.format(strings.adminkickedplayer, GetPlayerName(source), GetPlayerName(args[1]), reason))
				DropPlayer(args[1], string.format(strings.kicked, GetPlayerName(source), reason) )
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, false)
	
	RegisterCommand("ban", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) and DoesPlayerHavePermission(source,"easyadmin.ban") then
			local reason = ""
			for i,theArg in pairs(args) do
				if i ~= 1 then
					reason = reason.." "..theArg
				end
			end
			if GetPlayerName(args[1]) then
				local bannedIdentifiers = GetPlayerIdentifiers(args[1])
				local playerLicense = ""
				local playerSteamid = false
				for i,identifier in ipairs(bannedIdentifiers) do
					if string.find(identifier, "license:") then
						playerLicense = identifier
					elseif string.find(identifier, "steam:") then
						playerSteamid = identifier
					end
				end
				reason = reason.. string.format(strings.reasonadd, GetPlayerName(args[1]), GetPlayerName(source) )
				local ban = {identifier = playerLicense, reason = reason, expire = expires or 10444633200 }
				if playerSteamid then
					ban = {identifier = playerLicense, steam = playerSteamid, reason = reason, expire = expires or 10444633200 }
				end
				updateBlacklist( ban )
				SendWebhookMessage(moderationNotification,string.format(strings.adminbannedplayer, GetPlayerName(source), GetPlayerName(args[1]), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ))
				DropPlayer(args[1], string.format(strings.banned, reason, os.date('%d/%m/%Y 	%H:%M:%S', 10444633200 ) ) )
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, false)
	
	RegisterCommand("spectate", function(source, args, rawCommand)
		if args[1] and tonumber(args[1]) and DoesPlayerHavePermission(source,"easyadmin.spectate") then
			if GetPlayerName(args[1]) then
				TriggerClientEvent("EasyAdmin:requestSpectate", source, args[1])
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.playernotfound } })
			end
		end
	end, false)
	
	RegisterCommand("unban", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.unban") then
			updateBlacklist({identifier = args[1]},true)
			TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", strings.done } })
			SendWebhookMessage(moderationNotification,string.format(strings.adminunbannedplayer, GetPlayerName(source), args[1]))
		end
	end, false)
	
	RegisterCommand("teleport", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.teleport") then
			-- not yet
		end
	end, false)
	
	RegisterCommand("setgametype", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			SetGameType(args[1])
		end
	end, false)
	
	RegisterCommand("setmapname", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			SetMapName(args[1])
		end
	end, false)

	RegisterCommand("slap", function(source, args, rawCommand)
		if args[1] and args[2] and DoesPlayerHavePermission(source,"easyadmin.slap") then
			SendWebhookMessage(moderationNotification,string.format(strings.adminslappedplayer, GetPlayerName(source), GetPlayerName(args[1]), args[2]))
			TriggerClientEvent("EasyAdmin:SlapPlayer", args[1], args[2])
		end
	end, false)	
	
	RegisterServerEvent("EasyAdmin:TeleportPlayerToCoords")
	AddEventHandler('EasyAdmin:TeleportPlayerToCoords', function(playerId,px,py,pz)
		if DoesPlayerHavePermission(source,"easyadmin.teleport") then
			TriggerClientEvent("EasyAdmin:TeleportRequest", playerId, px,py,pz)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SlapPlayer")
	AddEventHandler('EasyAdmin:SlapPlayer', function(playerId,slapAmount)
		if DoesPlayerHavePermission(source,"easyadmin.slap") then
			SendWebhookMessage(moderationNotification,string.format(strings.adminslappedplayer, GetPlayerName(source), GetPlayerName(playerId), slapAmount))
			TriggerClientEvent("EasyAdmin:SlapPlayer", playerId, slapAmount)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:FreezePlayer")
	AddEventHandler('EasyAdmin:FreezePlayer', function(playerId,toggle)
		if DoesPlayerHavePermission(source,"easyadmin.freeze") then
			if toggle then
				SendWebhookMessage(moderationNotification,string.format(strings.adminfrozeplayer, GetPlayerName(source), GetPlayerName(playerId)))
			else
				SendWebhookMessage(moderationNotification,string.format(strings.adminunfrozeplayer, GetPlayerName(source), GetPlayerName(playerId)))
			end
			TriggerClientEvent("EasyAdmin:FreezePlayer", playerId, toggle)
		end
	end)
	
	
	RegisterServerEvent("EasyAdmin:unbanPlayer")
	AddEventHandler('EasyAdmin:unbanPlayer', function(playerId)
		if DoesPlayerHavePermission(source,"easyadmin.unban") then
			updateBlacklist({identifier = playerId},true)
			SendWebhookMessage(moderationNotification,string.format(strings.adminunbannedplayer, GetPlayerName(source), playerId))
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
	
	function updateAdmins(addItem)
		admins = {}
		local content = LoadResourceFile(GetCurrentResourceName(), "admins.txt")
		if not content then
			return -- instead of re-creating the file, just quit, we dont need to continue anyway.
		end
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
	
	
	function updateBlacklist(data,remove)
		blacklist = {}
		
		local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
		if not content then
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode({}), -1)
		end
		
				
		local txtcontent = LoadResourceFile(GetCurrentResourceName(), "banlist.txt") -- compat
		if not txtcontent then txtcontent = "" end
		if string.len(txtcontent) > 5 then
			for index,value in ipairs(mysplit(txtcontent, "\n")) do
				curstring = "" -- make a new string
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string
				end
				local reason = string.match(value, "^.*%;(.*)" ) or strings.nongiven -- get the reason from the string or use "none given" if it's nil
				local reason = string.gsub(reason,"\r","")
				table.insert(blacklist, {identifier = curstring, reason = reason, expire = 10444633200 }) -- we need an expire time here, anything will do, lets make it christmas!
			end
			SaveResourceFile(GetCurrentResourceName(), "banlist.txt", "", 0) -- overwrite banlist with emptyness, we dont even need this file, but sadly we cant delete it :(
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
		end
		
		if data and not remove then
			local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
			blacklist = json.decode(content)
			table.insert(blacklist, data)
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
			
		elseif not data then
			local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
			blacklist = json.decode(content)
			for i,theBan in ipairs(blacklist) do
				if theBan.expire < os.time() then
					table.remove(blacklist,i)
				elseif theBan.expire == 1924300800 then
					blacklist[i].expire = 10444633200
				end
			end
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
		end
		
		if data and remove then
			local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
			blacklist = json.decode(content)
			
			for i,theBan in ipairs(blacklist) do
				if theBan.identifier == data.identifier then
					table.remove(blacklist,i)
				end
			end
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
		end
	end



	
	function IsIdentifierBanned(identifier)
		local identifierfound = false
		for index,value in ipairs(blacklist) do
			if identifier == value.identifier then
				identifierfound = true
			end
		end
		return identifierfound
	end
	
	function BanIdentifier(identifier,reason)
		updateBlacklist( {identifier = identifier, reason = reason, expire = 10444633200} )
	end
	
	AddEventHandler('playerConnecting', function(playerName, setKickReason)
		local numIds = GetPlayerIdentifiers(source)
		for bi,blacklisted in ipairs(blacklist) do
			for i,theId in ipairs(numIds) do
				if blacklisted.identifier == theId or (blacklisted.steam and blacklisted.steam == theId) then
					Citizen.Trace("user is banned")
					setKickReason(string.format( strings.bannedjoin, blacklist[bi].reason, os.date('%d/%m/%Y 	%H:%M:%S', blacklist[bi].expire )))
					print("Connection Refused, Blacklisted for "..blacklist[bi].reason.."!\n")
					CancelEvent()
					return
				end
			end
		end
	end)
	
	
	
	---------------------------------- USEFUL
	
	
	function SendWebhookMessage(webhook,message)
		if webhook ~= "false" then
			PerformHttpRequest(webhook, function(err, text, headers) end, 'POST', json.encode({content = message}), { ['Content-Type'] = 'application/json' })
		end
	end
	
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
	
	
	local verFile = LoadResourceFile(GetCurrentResourceName(), "version.json")
	local curVersion = json.decode(verFile).version
	local updatePath = "/Bluethefurry/EasyAdmin"
	local resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"
	function checkVersion(err,response, headers)
		local data = json.decode(response)
		
		
		if curVersion ~= data.version and tonumber(curVersion) < tonumber(data.version) then
			print("\n--------------------------------------------------------------------------")
			print("\n"..resourceName.." is outdated.\nCurrent Version: "..data.version.."\nYour Version: "..curVersion.."\nPlease update it from https://github.com"..updatePath.."")
			print("\nUpdate Changelog:\n"..data.changelog)
			print("\n--------------------------------------------------------------------------")
		elseif tonumber(curVersion) > tonumber(data.version) then
			print("Your version of "..resourceName.." seems to be higher than the current version.")
		else
			print(resourceName.." is up to date!")
		end
		local nativeuitest = LoadResourceFile("NativeUI", "__resource.lua")
		if not nativeuitest then
			print("\n--------------------------------------------------------------------------")
			print("\nNativeUI is not installed on this Server, this means that EasyAdmin will not work *at all*, please download and install it from:")
			print("\nhttps://github.com/FrazzIe/NativeUILua")
			print("\n--------------------------------------------------------------------------")
		else
			SaveResourceFile("NativeUI", "__resource.lua", nativeuitest, -1)
		end
		SetTimeout(3600000, checkVersionHTTPRequest)
	end
	
	function checkVersionHTTPRequest()
		PerformHttpRequest("https://raw.githubusercontent.com/Bluethefurry/EasyAdmin/master/version.json", checkVersion, "GET")
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
