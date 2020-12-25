------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
------------------------------------
------------------------------------

Citizen.CreateThread(function()
	while true do 
		Wait(20000)
		for i, player in pairs(CachedPlayers) do 
			if player.droppedTime and (os.time() > player.droppedTime+600) then
				CachedPlayers[i]=nil
			end
		end
	end
end)


-- Chat Reminder Code
function sendRandomReminder()
	reminderTime = GetConvarInt("ea_chatReminderTime", 0)
	if reminderTime ~= 0 and #ChatReminders > 0 then
		local reminder = ChatReminders[ math.random( #ChatReminders ) ] -- select random reminder from table
		local adminNames = ""
		local t = {}
		for i,_ in pairs(OnlineAdmins) do
			table.insert(t, getName(i))
		end
		for i,n in ipairs(t) do 
			if i == 1 then
				adminNames = n
			elseif i == #t then
				adminNames = adminNames.." "..n
			else
				adminNames = adminNames.." "..n..","
			end
		end
		t=nil

		if adminNames == "" then adminNames = "@admins" end -- if no admins are online just print @admins
		reminder = string.gsub(reminder, "@admins", adminNames)

		reminder = string.gsub(reminder, "@bancount", #blacklist)

		reminder = string.gsub(reminder, "@time", os.date("%X", os.time()))
		reminder = string.gsub(reminder, "@date", os.date("%x", os.time()))
		TriggerClientEvent("chat:addMessage", -1, { args = { "EasyAdmin", reminder } })
	end
end

Citizen.CreateThread(function()
	--Wait(10000)
	reminderTime = GetConvarInt("ea_chatReminderTime", 0)
	if reminderTime ~= 0 then
		while true do 
			Wait(reminderTime*60000)
			sendRandomReminder()
		end
	else
		while true do
			Wait(20000)
			sendRandomReminder() -- check for changes in the convar
		end
	end
end)

Citizen.CreateThread(function()
	while true do 
		local backupInfos = LoadResourceFile(GetCurrentResourceName(), "backups/_backups.json")
		if backupInfos == nil then 
			lastBackupTime = 0
		else
			backupInfos = json.decode(backupInfos)
			lastBackupTime = backupInfos.lastBackup
		end
		if (GetConvarInt("ea_backupFrequency", 72) ~= 0) and (lastBackupTime+(GetConvarInt("ea_backupFrequency", 72)*3600) < os.time()) then
			createBackup()
		end
		Wait(120000)
	end
end)


function loadBackupName(name)
	local backup = LoadResourceFile(GetCurrentResourceName(), "backups/"..name)
	if backup then
		local backupJson = json.decode(backup)
		if backupJson then
			print("Loading Backup..")
			for i,ban in pairs(blacklist) do
				UnbanId(ban.banid)
				PrintDebugMessage("removing ban "..ban.banid)
				Wait(50)
			end

			for i,ban in pairs(backupJson) do
				addBan(ban)
				PrintDebugMessage("adding ban "..ban.banid)
				TriggerEvent("ea_data:addBan", ban)
				Wait(50)
			end
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
			updateBlacklist()
			print("Backup should be loaded!")
		else
			print("^1EasyAdmin:^7 Backup Could not be loaded, in most cases this comes from there being a formatting error, please use a JSON Validator on the file and fix the errors!")
		end

	else
		print("^1EasyAdmin:^7 Backup Name Invalid or missing from Backups.")
	end
end


function createBackup()
	local backupTime = os.time()
	local backupDate = os.date("%H_%M_%d_%m_%Y")
	local backupName = "banlist_"..backupDate..".json"
	PrintDebugMessage("Creating Banlist Backup to "..backupName)

	SaveResourceFile(GetCurrentResourceName(), "backups/"..backupName, json.encode(blacklist, {indent = true}), -1)

	local backupInfos = LoadResourceFile(GetCurrentResourceName(), "backups/_backups.json")
	if backupInfos then
		backupInfos = json.decode(backupInfos)
		table.insert(backupInfos.backups, {id = getNewBackupid(backupInfos), backupFile = backupName, backupTimestamp = backupTime, backupDate = backupDate})

		if #backupInfos.backups > GetConvarInt("ea_maxBackupCount", 10) then
			deleteBackup(backupInfos,1)
		end
		backupInfos.lastBackup = backupTime
		SaveResourceFile(GetCurrentResourceName(), "backups/_backups.json", json.encode(backupInfos, {indent = true}))

	else
		local backupInfos = {lastBackup = backupTime, backups = {}}
		table.insert(backupInfos.backups, {id = getNewBackupid(backupInfos), backupFile = backupName, backupTimestamp = backupTime, backupDate = backupDate})
		SaveResourceFile(GetCurrentResourceName(), "backups/_backups.json", json.encode(backupInfos, {indent = true}))
	end

	return id,timestamp
end

function deleteBackup(backupInfos,id)
	local expiredBackup = backupInfos.backups[id]
	table.remove(backupInfos.backups, id)

	local backupFileName = expiredBackup.backupFile

	local fullResourcePath = GetResourcePath(GetCurrentResourceName())
	os.remove(fullResourcePath.."/backups/"..backupFileName)
	PrintDebugMessage("Removed Backup "..backupFileName)

end

function getNewBackupid(backupInfos)
	if backupInfos then
		local lastBackup = backupInfos.lastbackup
		local backups = backupInfos.backups
		return #backups+1
	else
		return 0
	end
end




AddEventHandler('playerDropped', function (reason)
	if CachedPlayers[source] then
		CachedPlayers[source].droppedTime = os.time()
	end
	if OnlineAdmins[source] then
		OnlineAdmins[source] = nil
	end
end)

AddEventHandler("EasyAdmin:amiadmin", function()
	if not CachedPlayers[source] then
		CachedPlayers[source] = {id = source, name = GetPlayerName(source), identifiers = GetPlayerIdentifiers(source), immune = DoesPlayerHavePermission(source,"easyadmin.immune")}
	end
end)

RegisterServerEvent("EasyAdmin:GetPlayerList")
AddEventHandler("EasyAdmin:GetPlayerList", function()
	if IsPlayerAdmin(source) then
		local l = {}
		local players = GetPlayers()
		for i, player in pairs(players) do
			if CachedPlayers[player] then
				table.insert(l, CachedPlayers[player])
			end
		end
		TriggerClientEvent("EasyAdmin:GetPlayerList", source, l) 
	end
end)


RegisterServerEvent("EasyAdmin:GetInfinityPlayerList")
AddEventHandler("EasyAdmin:GetInfinityPlayerList", function()
	if IsPlayerAdmin(source) then
		local l = {}
		local players = GetPlayers()

		for i, player in pairs(players) do
			local player = tonumber(player)
			for i, cached in pairs(CachedPlayers) do
				if (cached.id == player) then
					table.insert(l, CachedPlayers[i])
				end
			end
		end
		TriggerClientEvent("EasyAdmin:GetInfinityPlayerList", source, l) 
	end
end)


RegisterServerEvent("EasyAdmin:requestCachedPlayers")
AddEventHandler('EasyAdmin:requestCachedPlayers', function(playerId)
	local src = source
	if DoesPlayerHavePermission(source,"easyadmin.ban") then
		TriggerClientEvent("EasyAdmin:fillCachedPlayers", src, CachedPlayers)
		PrintDebugMessage("Cached Players requested by "..getName(src,true))
	end
end)

function GetOnlineAdmins()
	return OnlineAdmins
end

function IsPlayerAdmin(pid)
	return OnlineAdmins[pid]
end


function DoesPlayerHavePermission(player, object)
	local haspermission = false
	if (player == 0 or player == "") then
		return true
	end-- Console. It's assumed this will be an admin with access. If not, why the fuck are they giving random people access?
	
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


RegisterCommand("ea_addReminder", function(source, args, rawCommand)
	if args[1] and DoesPlayerHavePermission(source,"easyadmin.manageserver") then
		local text = string.gsub(rawCommand, "ea_addReminder ", "")
		local text = string.gsub(text, '"', '')

		PrintDebugMessage("added '"..text.."' as a Chat Reminder")
		table.insert(ChatReminders, text)
	end
end, false)

RegisterCommand("ea_testWebhook", function(source, args, rawCommand)
	if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
		SendWebhookMessage(moderationNotification, "EasyAdmin: **WEBHOOK TEST**")
		PrintDebugMessage("Webhook Message Sent")
	end
end, false)

RegisterCommand("ea_excludeWebhookFeature", function(source, args, rawCommand)
    if DoesPlayerHavePermission(source, "easyadmin.manageserver") then
        ExcludedWebhookFeatures = Set(args)
        PrintDebugMessage("Webhook excludes set")
    end
end, false)

RegisterCommand("ea_createBackup", function(source, args, rawCommand)
	if DoesPlayerHavePermission(source, "easyadmin.manageserver") then
		createBackup()
    end
end, false)

RegisterCommand("ea_loadBackup", function(source,args,rawCommand)
	if DoesPlayerHavePermission(source, "easyadmin.manageserver") and args[1] then
		loadBackupName(args[1])
	end
end,false)

Citizen.CreateThread(function()
	if GetConvar("gamename", "not-rdr3") == "rdr3" then 
		RedM = true
	else
		RedM = false
	end
	
	local resourcemeta = LoadResourceFile(GetCurrentResourceName(), "__resource.lua")
	if resourcemeta then
		os.remove(GetResourcePath(GetCurrentResourceName()).."/__resource.lua")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		print("^1EasyAdmin^7: You didn't follow the Updating Instructions! I fixed it myself this time, please restart me using the 'ensure EasyAdmin' command.")
		print("^1EasyAdmin^7: For the next time, please read the update instructions and remove the __resource.lua!!")
		print("^1EasyAdmin^7: If this message does not dissapear after typing the ensure command, please manually remove the __resource.lua from my Folder.")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
	end

	ExcludedWebhookFeatures = {}
	AnonymousAdmins = {}

	local strfile = LoadResourceFile(GetCurrentResourceName(), "language/"..GetConvar("ea_LanguageName", "en")..".json")
	if strfile then
		strings = json.decode(strfile)[1]
	else
		strings = {language=GetConvar("ea_LanguageName", "en")}
	end
	
	
	moderationNotification = GetConvar("ea_moderationNotification", "false")
	if GetConvar("ea_enableDebugging", "false") == "true" then
		enableDebugging = true
		PrintDebugMessage("^1Debug Messages Enabled, Anonymous Admins may not be anonymous!")
	else
		enableDebugging = false
	end
	minimumMatchingIdentifierCount = GetConvarInt("ea_minIdentifierMatches", 2)
	
	RegisterServerEvent('EasyAdmin:amiadmin')
	AddEventHandler('EasyAdmin:amiadmin', function()
		
		local identifiers = GetPlayerIdentifiers(source)
		for perm,val in pairs(permissions) do
			local thisPerm = DoesPlayerHavePermission(source,"easyadmin."..perm)
			if perm == "screenshot" and not screenshots then
				thisPerm = false
			end
			--if (perm == "teleport" or perm == "spectate") and infinity then
			--if (perm == "spectate") and infinity then
			--	thisPerm = false
			--end 
			if thisPerm == true then
				OnlineAdmins[source] = true 
			end
			TriggerClientEvent("EasyAdmin:adminresponse", source, perm,thisPerm)
			PrintDebugMessage("Processed Perm "..perm.." for "..getName(source)..", result: "..tostring(thisPerm))
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.ban") then
			TriggerClientEvent('chat:addSuggestion', source, '/ban', GetLocalisedText("chatsuggestionban"), { {name='player id', help="the player's server id"}, {name='reason', help="your reason."} } )
		end
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			TriggerClientEvent('chat:addSuggestion', source, '/kick', GetLocalisedText("chatsuggestionkick"), { {name='player id', help="the player's server id"}, {name='reason', help="your reason."}} )
		end
		if DoesPlayerHavePermission(source,"easyadmin.spectate") then
			TriggerClientEvent('chat:addSuggestion', source, '/spectate', GetLocalisedText("chatsuggestionspectate"), { {name='player id', help="the player's server id"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.unban") then
			TriggerClientEvent('chat:addSuggestion', source, '/unban', GetLocalisedText("chatsuggestionunban"), { {name='identifier', help="the identifier ( such as steamid, ip or license )"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.teleport.player") then
			TriggerClientEvent('chat:addSuggestion', source, '/teleport', GetLocalisedText("chatsuggestionteleport"), { {name='player id', help="the player's server id"} })
		end
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			TriggerClientEvent('chat:addSuggestion', source, '/setgametype', GetLocalisedText("chatsuggestiongametype"), { {name='game type', help="the game type"} })
			TriggerClientEvent('chat:addSuggestion', source, '/setmapname', GetLocalisedText("chatsuggestionmapname"), { {name='map name', help="the map name"} })
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.slap") then
			TriggerClientEvent('chat:addSuggestion', source, '/slap', GetLocalisedText("chatsuggestionslap"), { {name='player id', help="the player's server id"},{name='hp', help="the hp to take"} })
		end
		
		if DoesPlayerHavePermission(source,"easyadmin.freeze") then
			TriggerClientEvent('chat:addSuggestion', source, '/freeze', GetLocalisedText("chatsuggestionfreeze"), { {name='player id', help="the player's server id"},{name='toggle', help="either true or false"} })
		end
		
		-- give player the right settings to work with
		local key = GetConvar("ea_MenuButton", 289)
		if RedM then
			key = GetConvar("ea_MenuButton", "PhotoModePc")
		end
		TriggerClientEvent("EasyAdmin:SetSetting", source, "button", key)
		if GetConvar("ea_alwaysShowButtons", "false") == "true" then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", true)
		else
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", false)
		end
		
		TriggerClientEvent("EasyAdmin:SetLanguage", source, strings)
		
	end)
	
	RegisterServerEvent("EasyAdmin:kickPlayer")
	AddEventHandler('EasyAdmin:kickPlayer', function(playerId,reason)
		if DoesPlayerHavePermission(source,"easyadmin.kick") and not DoesPlayerHavePermission(playerId,"easyadmin.immune") then
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(source), getName(playerId), reason), "kick")
			PrintDebugMessage("Kicking Player "..getName(source).." for "..reason)
			DropPlayer(playerId, string.format(GetLocalisedText("kicked"), getName(source), reason) )
		end
	end)
	
	RegisterServerEvent("EasyAdmin:requestSpectate")
	AddEventHandler('EasyAdmin:requestSpectate', function(playerId)
		if DoesPlayerHavePermission(source,"easyadmin.spectate") then
			PrintDebugMessage("Player "..getName(source,true).." Requested Spectate to "..getName(playerId,true))
			local tgtCoords = GetEntityCoords(GetPlayerPed(playerId))
			TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, tgtCoords)
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText('spectatedplayer'), getName(source), getName(playerId)), "spectate")
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetGameType")
	AddEventHandler('EasyAdmin:SetGameType', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..text)
			SetGameType(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetMapName")
	AddEventHandler('EasyAdmin:SetMapName', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..text)
			SetMapName(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StartResource")
	AddEventHandler('EasyAdmin:StartResource', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." started Resource "..text)
			StartResource(text)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StopResource")
	AddEventHandler('EasyAdmin:StopResource', function(text)
		if DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." stopped Resource "..text)
			StopResource(text)
		end
	end)
	
	
	RegisterServerEvent("EasyAdmin:banPlayer")
	AddEventHandler('EasyAdmin:banPlayer', function(playerId,reason,expires,username)
		if playerId ~= nil then
			if DoesPlayerHavePermission(source,"easyadmin.ban") and CachedPlayers[playerId] and not DoesPlayerHavePermission(playerId,"easyadmin.immune") then
				local bannedIdentifiers = CachedPlayers[playerId].identifiers or GetPlayerIdentifiers(playerId)
				local username = CachedPlayers[playerId].name or GetPlayerName(playerId)
				if expires and expires < os.time() then
					expires = os.time()+expires 
				elseif not expires then 
					expires = 10444633200
				end
				reason = reason.. string.format(GetLocalisedText("reasonadd"), CachedPlayers[playerId].name, getName(source) )
				local ban = {banid = GetFreshBanId(), name = username,identifiers = bannedIdentifiers, banner = getName(source, true), reason = reason, expire = expires }
				updateBlacklist( ban )
				PrintDebugMessage("Player "..getName(source,true).." banned player "..CachedPlayers[playerId].name.." for "..reason)
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), getName(source), CachedPlayers[playerId].name, reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ), "ban")
				DropPlayer(playerId, string.format(GetLocalisedText("banned"), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ) )
			end
		end
	end)

	RegisterServerEvent("EasyAdmin:offlinebanPlayer")
	AddEventHandler('EasyAdmin:offlinebanPlayer', function(playerId,reason,expires)
		if playerId ~= nil and not CachedPlayers[playerId].immune then
			if DoesPlayerHavePermission(source,"easyadmin.ban") and not DoesPlayerHavePermission(playerId,"easyadmin.immune") then
				local bannedIdentifiers = CachedPlayers[playerId].identifiers or GetPlayerIdentifiers(playerId)
				local username = CachedPlayers[playerId].name or GetPlayerName(playerId)
				if expires and expires < os.time() then
					expires = os.time()+expires 
				elseif not expires then 
					expires = 10444633200
				end
				reason = reason.. string.format(GetLocalisedText("reasonadd"), CachedPlayers[playerId].name, getName(source) )
				local ban = {banid = GetFreshBanId(), name = username,identifiers = bannedIdentifiers, banner = getName(source, true), reason = reason, expire = expires }
				updateBlacklist( ban )
				PrintDebugMessage("Player "..getName(source,true).." offline banned player "..CachedPlayers[playerId].name.." for "..reason)
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminofflinebannedplayer"), getName(source), CachedPlayers[playerId].name, reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ), "ban")
			end
		end
	end)
	
	AddEventHandler('banCheater', function(playerId,reason)
		Citizen.Trace("^1EasyAdmin^7: the banCheater event is ^1deprecated^7 and will be removed soon! Please adjust your ^3"..GetInvokingResource().."^7 Resource to use EasyAdmin:addBan instead.")
		if not reason then reason = "Cheating" end
		if getName(source) ~= "Console" then return end
		local bannedIdentifiers = CachedPlayers[playerId].identifiers or GetPlayerIdentifiers(playerId)
		local username = CachedPlayers[playerId].name or GetPlayerName(playerId)
		reason = reason.. string.format(GetLocalisedText("bancheatingadd"), getName(playerId), getName(source) )
		local ban = {banid = GetFreshBanId(), name = username,identifiers = bannedIdentifiers, banner = "Anticheat", reason = reason, expire = expires or 10444633200 }
		
		updateBlacklist( ban )
		PrintDebugMessage("Console banned player "..getName(playerId,true).." for "..reason)
		SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), 'Console', getName(playerId), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires or 10444633200 ) ), "ban")
		DropPlayer(playerId, GetLocalisedText("bancheating"))
	end)
	
	AddEventHandler("EasyAdmin:addBan", function(playerId,reason,expires, offline)
		if offline then 
			bannedIdentifiers = playerId 
			bannedUsername = "Unknown"
		else 
			bannedIdentifiers = CachedPlayers[playerId].identifiers or GetPlayerIdentifiers(playerId)
			bannedUsername = CachedPlayers[playerId].name or GetPlayerName(playerId)
		end
		if expires and expires < os.time() then
			expires = os.time()+expires 
		elseif not expires then 
			expires = 10444633200
		end
		reason = reason.. string.format(GetLocalisedText("reasonadd"), getName(tostring(playerId) or "?"), "Console" )
		local ban = {banid = GetFreshBanId(), name = bannedUsername,identifiers = bannedIdentifiers,  banner = "Unknown", reason = reason, expire = expires or 10444633200 }
		updateBlacklist( ban )
		
		
		PrintDebugMessage("Player "..getName(source,true).." added ban "..reason)
		SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), "Console", getName(tostring(playerId) or "?"), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ), "ban")
		if not offline then
			DropPlayer(playerId, string.format(GetLocalisedText("banned"), reason, os.date('%d/%m/%Y 	%H:%M:%S', expires ) ) )
		end
	end)
	
	RegisterServerEvent("EasyAdmin:updateBanlist")
	AddEventHandler('EasyAdmin:updateBanlist', function(playerId)
		local src = source
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			updateBlacklist(false,true)
			Citizen.Wait(300)
			TriggerClientEvent("EasyAdmin:fillBanlist", src, blacklist)
			PrintDebugMessage("Banlist Refreshed by "..getName(src,true))
		end
	end)
	
	RegisterServerEvent("EasyAdmin:requestBanlist")
	AddEventHandler('EasyAdmin:requestBanlist', function(playerId)
		local src = source
		if DoesPlayerHavePermission(source,"easyadmin.kick") then
			TriggerClientEvent("EasyAdmin:fillBanlist", src, blacklist)
			PrintDebugMessage("Banlist Requested by "..getName(src,true))
		end
	end)
	
	
	------------------------------ COMMANDS
	
	RegisterCommand("spectate", function(source, args, rawCommand)
		if(source == 0) then
			Citizen.Trace(GetLocalisedText("badidea")) -- Maybe should be it's own string saying something like "only players can do this" or something
		end
		
		PrintDebugMessage("Player "..getName(source,true).." Requested Spectate on "..getName(args[1],true))
		
		if args[1] and tonumber(args[1]) and DoesPlayerHavePermission(source,"easyadmin.spectate") then
			if getName(args[1]) then
				TriggerClientEvent("EasyAdmin:requestSpectate", source, args[1])
			else
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("playernotfound") } })
			end
		end
	end, false)
	
	RegisterCommand("unban", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.unban") then
			PrintDebugMessage("Player "..getName(source,true).." Unbanned "..args[1])
			UnbanIdentifier(args[1])
			if (source ~= 0) then
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("done") } })
			else
				Citizen.Trace(GetLocalisedText("done"))
			end
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunbannedplayer"), getName(source), args[1])) -- Use the "safe" getName function instead.
		end
	end, false)
	
	RegisterCommand("teleport", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.teleport.player") then
			PrintDebugMessage("Player Requested Teleport something")
			-- not yet
		end
	end, false)
	
	RegisterCommand("setgametype", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..args[1])
			SetGameType(args[1])
		end
	end, false)
	
	RegisterCommand("setmapname", function(source, args, rawCommand)
		if args[1] and DoesPlayerHavePermission(source,"easyadmin.manageserver") then
			PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..args[1])
			SetMapName(args[1])
		end
	end, false)

	RegisterCommand("slap", function(source, args, rawCommand)
		if args[1] and args[2] and DoesPlayerHavePermission(source,"easyadmin.slap") then
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminslappedplayer"), getName(source), getName(args[1]), args[2]), "slap")
			PrintDebugMessage("Player "..getName(source,true).." slapped "..getName(args[1],true).." for "..args[2].." HP")
			TriggerClientEvent("EasyAdmin:SlapPlayer", args[1], args[2])
		end
	end, false)	


	--- Commands for Normal Users

	RegisterCommand("calladmin", function(source, args, rawCommand)
		if GetConvar("ea_enableCallAdminCommand", "false") == "true" then
			local reason = string.gsub(rawCommand, "calladmin ", "")
			for i,_ in pairs(OnlineAdmins) do 
				TriggerClientEvent('chatMessage', i, "^3!!EasyAdmin Admin Call!!^7\n"..string.format(string.gsub(GetLocalisedText("playercalledforadmin"), "```", ""), getName(source), source, reason))
			end
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("playercalledforadmin"), getName(source), source, reason), "calladmin")
			TriggerClientEvent('chatMessage', source, "^3EasyAdmin^7", {255,255,255}, GetLocalisedText("admincalled"))
		end
	end, false)
	PlayerReports = {}
	RegisterCommand("report", function(source, args, rawCommand)
		if GetConvar("ea_enableReportCommand", "false") == "true" then
			local source = source
			local id = args[1]
			local valid = false
			local minimumreports = GetConvarInt("ea_defaultMinReports", 3)
			if GetConvar("ea_MinReportModifierEnabled", "true") == "true" then
				if #GetPlayers() > GetConvarInt("ea_MinReportPlayers", 12) then
					minimumreports = math.round(#GetPlayers()/GetConvarInt("ea_MinReportModifier", 4),0)
				end
			end
			if id and not GetPlayerIdentifier(id, 1) then
				for i, player in pairs(GetPlayers()) do
					if string.find(string.lower(GetPlayerName(player)), string.lower(id)) then
						id = player
						valid = true
						break
					end
				end
			else
				valid = true
			end
			
			
			if id and valid then
				local reason = string.gsub(rawCommand, "report " ..args[1].." ", "")
				if not PlayerReports[id] then
					PlayerReports[id] = { }
				end
				local addReport = true
				for i, report in pairs(PlayerReports[id]) do
					if report.source == source or report.sourceName == GetPlayerName(source) then
						addReport = false
					end
				end
				if addReport then
					table.insert(PlayerReports[id], {source = source, sourceName = GetPlayerName(source), reason = reason, time = os.time()})
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("playerreportedplayer"), getName(source), source, GetPlayerName(id), id, reason, #PlayerReports[id], minimumreports), "report")
					-- "playerreportedplayer":"```\nUser %s (ID: %a) reported a player!\n%s (%a), Reason: %s\nReport %a/%a\n```",
					for i,_ in pairs(OnlineAdmins) do 
						TriggerClientEvent('chatMessage', i, "^3!!EasyAdmin Report!!^7\n"..string.format(string.gsub(GetLocalisedText("playerreportedplayer"), "```", ""), getName(source), source, GetPlayerName(id), id, reason, #PlayerReports[id], minimumreports))
					end
					TriggerClientEvent('chatMessage', source, "^3EasyAdmin^7", {255,255,255}, GetLocalisedText("successfullyreported"))
					if #PlayerReports[id] >= minimumreports then
						TriggerEvent("EasyAdmin:banPlayer", id, string.format(GetLocalisedText("reportbantext"), minimumreports), os.time()+GetConvarInt("ea_ReportBanTime", 86400))
					end
				else
					TriggerClientEvent('chatMessage', source, "^3EasyAdmin^7", {255,255,255}, GetLocalisedText("alreadyreported"))
				end
			else
				TriggerClientEvent('chatMessage', source, "^3EasyAdmin^7", {255,255,255}, GetLocalisedText("reportedusageerror"))
			end
		end
	end, false)
	
	RegisterServerEvent("EasyAdmin:TeleportPlayerToCoords")
	AddEventHandler('EasyAdmin:TeleportPlayerToCoords', function(playerId,tgtCoords)
		if DoesPlayerHavePermission(source,"easyadmin.teleport.player") then
			PrintDebugMessage("Player "..getName(source,true).." requsted teleport to "..tgtCoords.x..", "..tgtCoords.y..", "..tgtCoords.z)
			TriggerClientEvent("EasyAdmin:TeleportRequest", playerId, false, tgtCoords)
		end
	end)

	RegisterServerEvent("EasyAdmin:TeleportAdminToPlayer")
	AddEventHandler("EasyAdmin:TeleportAdminToPlayer", function(id)
		if GetPlayerName(id) and DoesPlayerHavePermission(source, "easyadmin.teleport") then
			local tgtPed = GetPlayerPed(id)
			local tgtCoords = GetEntityCoords(tgtPed)
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("teleportedtoplayer"), getName(source), getName(id)), "teleport")
			TriggerClientEvent('EasyAdmin:TeleportRequest', source, id,tgtCoords)
		else
			print('EASYADMIN FAILED TO TELEPORT'..source..' TO ID: '..id)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SlapPlayer")
	AddEventHandler('EasyAdmin:SlapPlayer', function(playerId,slapAmount)
		if DoesPlayerHavePermission(source,"easyadmin.slap") then
			PrintDebugMessage("Player "..getName(source,true).." slapped "..getName(playerId,true).." for "..slapAmount.." HP")
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminslappedplayer"), getName(source), getName(playerId), slapAmount), "slap")
			TriggerClientEvent("EasyAdmin:SlapPlayer", playerId, slapAmount)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:FreezePlayer")
	AddEventHandler('EasyAdmin:FreezePlayer', function(playerId,toggle)
		if DoesPlayerHavePermission(source,"easyadmin.freeze") then
			if toggle then
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminfrozeplayer"), getName(source), getName(playerId)), "freeze")
				PrintDebugMessage("Player "..getName(source,true).." froze "..getName(playerId,true))
			else
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunfrozeplayer"), getName(source), getName(playerId)), "freeze")
				PrintDebugMessage("Player "..getName(source,true).." unfroze "..getName(playerId,true))
			end
			TriggerClientEvent("EasyAdmin:FreezePlayer", playerId, toggle)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:TookScreenshot")
	
	RegisterServerEvent("EasyAdmin:TakeScreenshot")
	AddEventHandler('EasyAdmin:TakeScreenshot', function(playerId)
		if scrinprogress then
			TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("screenshotinprogress") } })
			return
		end
		scrinprogress = true
		local src=source
		local playerId = playerId

		if DoesPlayerHavePermission(source,"easyadmin.screenshot") then
			thistemporaryevent = AddEventHandler("EasyAdmin:TookScreenshot", function(result)
				res = tostring(result)
				if (moderationNotification == GetConvar("ea_screenshoturl", 'https://wew.wtf/upload.php')) then
					res = ""
				end
				SendWebhookMessage(moderationNotification, string.format(GetLocalisedText("admintookscreenshot"), getName(src), getName(playerId), res), "screenshot")
				TriggerClientEvent('chat:addMessage', src, { template = '<img src="{0}" style="max-width: 400px;" />', args = { res } })
				TriggerClientEvent("chat:addMessage", src, { args = { "EasyAdmin", string.format(GetLocalisedText("screenshotlink"), res) } })
				PrintDebugMessage("Screenshot for Player "..getName(playerId,true).." done, "..res.." requsted by"..getName(src,true))
				scrinprogress = false
				RemoveEventHandler(thistemporaryevent)
			end)
			
			TriggerClientEvent("EasyAdmin:CaptureScreenshot", playerId)
			local timeoutwait = 0
			repeat
				timeoutwait=timeoutwait+1
				Wait(5000)
				if timeoutwait == 5 then
					RemoveEventHandler(thistemporaryevent)
					scrinprogress = false -- cancel screenshot, seems like it failed
					TriggerClientEvent("chat:addMessage", src, { args = { "EasyAdmin", "Screenshot Failed!" } })
				end
			until not scrinprogress
		end
	end)
	
	RegisterServerEvent("EasyAdmin:unbanPlayer")
	AddEventHandler('EasyAdmin:unbanPlayer', function(banId)
		local thisBan = nil
		if DoesPlayerHavePermission(source,"easyadmin.unban") then
			for i,ban in ipairs(blacklist) do 
				if ban.banid == banId then
					thisBan = ban
					break
				end
			end
			UnbanId(banId)
			PrintDebugMessage("Player "..getName(source,true).." unbanned "..banId)
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunbannedplayer"), getName(source), banId, thisBan.reason), "ban")
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
		end
	end)

	RegisterServerEvent("EasyAdmin:mutePlayer")
	AddEventHandler('EasyAdmin:mutePlayer', function(playerId)
		local src = source
		if DoesPlayerHavePermission(src,"easyadmin.mute") then
			if not MutedPlayers[playerId] then 
				MutedPlayers[playerId] = true
				TriggerClientEvent("chat:addMessage", src, { args = { "EasyAdmin", getName(playerId) .. " " .. GetLocalisedText("playermuted") } })
				PrintDebugMessage("Player "..getName(source,true).." muted "..getName(playerId,true))
			else 
				MutedPlayers[playerId] = nil
				TriggerClientEvent("chat:addMessage", src, { args = { "EasyAdmin", getName(playerId) .. " " .. GetLocalisedText("playerunmuted") } })
				PrintDebugMessage("Player "..getName(source,true).." unmuted "..getName(playerId,true))
			end
		end
	end)

	RegisterServerEvent("EasyAdmin:SetAnonymous")
	AddEventHandler('EasyAdmin:SetAnonymous', function(playerId)
		if DoesPlayerHavePermission(source,"easyadmin.anon") then
			if AnonymousAdmins[source] then
				AnonymousAdmins[source] = nil
				PrintDebugMessage("Player "..getName(source,true).." un-anoned himself")
			else
				AnonymousAdmins[source] = true
				PrintDebugMessage("Player "..getName(source,true).." anoned himself")
			end
		end
	end)

	
	blacklist = {}
	

	function GetFreshBanId()
		if blacklist[#blacklist] then 
			return blacklist[#blacklist].banid+1
		else
			return 1
		end
	end
	function updateAdmins(addItem)
		admins = {}
		local content = LoadResourceFile(GetCurrentResourceName(), "admins.txt")
		if not content then
			return -- instead of re-creating the file, just quit, we dont need to continue anyway.
		end
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		Citizen.Trace("^3The following SteamIDs are added to your admins.txt file, this method is **OUTDATED** and **DOES NOT WORK**^7\n")
		Citizen.Trace("Add these admins using ACE:\n")
		for index,value in ipairs(string.split(content, "\n")) do
			Citizen.Trace(value.."\n")
		end
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
		Citizen.Trace("^1EasyAdmin: WARNING!!!!^7\n")
	end

	RegisterCommand("convertbanlist", function(source, args, rawCommand)
		if GetConvar("ea_custombanlist", "false") == "true" then
			local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
			local ob = json.decode(content)
			for i,theBan in ipairs(ob) do
				TriggerEvent("ea_data:addBan", theBan)
				print("processed ban: "..i.."\n")
			end
			content=nil
		else
			print("Custom Banlist is not enabled, converting back to json.")
			TriggerEvent('ea_data:retrieveBanlist', function(banlist)
				blacklist = banlist
				for i,theBan in ipairs(blacklist) do
					if not theBan.identifiers then theBan.identifiers = {} end
					if theBan.steam then
						table.insert(theBan.identifiers, theBan.steam)
						theBan.steam=nil
					end
					if theBan.identifier then
						table.insert(theBan.identifiers, theBan.identifier)
						theBan.identifier=nil
					end
					if theBan.discord then
						table.insert(theBan.identifiers, theBan.discord)
						theBan.discord=nil
					end
				end
				SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
			end)
		end
	end, true)
	
	--[[
		Very basic function that turns "source" into a useable player name.
	]]
	function getName(src,anonymousdisabled)
		if (src == 0 or src == "") then
			return "Console"
		else
			if AnonymousAdmins[src] and not anonymousdisabled then
				return GetLocalisedText("anonymous")
			elseif CachedPlayers[src] and CachedPlayers[src].name then
				return CachedPlayers[src].name
			elseif (GetPlayerName(src)) then
				return GetPlayerName(src)
			else
				return "Unknown - " .. src
			end
		end
	end
	
	function updateBan(id,newData)
		if id and newData and newData.identifiers and newData.banid and newData.reason and newData.expire then 
			blacklist[id] = newData
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
			if GetConvar("ea_custombanlist", "false") == "true" then 
				TriggerEvent("ea_data:updateBan", newData)
			end
		end
	end


	function addBan(data)
		if data then
			table.insert(blacklist, data)
		end
	end




	function updateBlacklist(data,remove, forceChange)
		-- life is pain, if you think this code sucks, SUCK MY DICK and make it better
		local change= (forceChange or false) --mark if file was changed to save up on disk writes.
		if GetConvar("ea_custombanlist", "false") == "true" then 
			
			if data and not remove then
				addBan(data)
				TriggerEvent("ea_data:addBan", data)
				
			elseif data and remove then
				UnbanId(data.banid)
			elseif not data then
				TriggerEvent('ea_data:retrieveBanlist', function(banlist)
					blacklist = banlist
					PrintDebugMessage("updated banlist custom banlist")
					for i,theBan in ipairs(blacklist) do
						if theBan.expire < os.time() then
							table.remove(blacklist,i)
							PrintDebugMessage("removing old ban custom banlist")
							TriggerEvent("ea_data:removeBan", theBan)
						end
					end
				end)
			end
			return
		end
		
		local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
		if not content then
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode({}), -1)
			content = json.encode({})
		end
		blacklist = json.decode(content)

		PrintDebugMessage("updated banlist")
		if not blacklist then
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			print("EasyAdmin: ^1Failed^7 to load Banlist!\n")
			print("EasyAdmin: Please check your banlist file for errors, ^1Bans *will not* work!^7\n")
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
		end
		
		performBanlistUpgrades(blacklist)
		
		if data and not remove then
			addBan(data)
			change=true
		elseif not data then
			for i,theBan in ipairs(blacklist) do
				theBan.id = nil
				if not theBan.banid then
					if i==1 then 
						theBan.banid = 1
					else
						theBan.banid = blacklist[i].banid or i
					end
					change=true
				end
				if not theBan.expire then 
					table.remove(blacklist,i)
					change=true
				elseif not theBan.identifiers then -- make sure 1 identifier is given, otherwise its a broken ban
					table.remove(blacklist,i)
					change=true
				elseif not theBan.identifiers[1] then 
					table.remove(blacklist,i)
					change=true
				elseif theBan.expire < os.time() then
					table.remove(blacklist,i)
					PrintDebugMessage("removing old ban no custom banlist")
					change=true
				elseif theBan.expire == 1924300800 then
					blacklist[i].expire = 10444633200
					change=true
				end
			end
		end
		if data and remove then
			UnbanId(data.banid)
			change = true
		end
		if change then
			SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
		end
	end

	function BanIdentifier(identifier,reason)
		updateBlacklist( {identifiers = {identifier} , banner = "Unknown", reason = reason, expire = 10444633200} )
	end
	
	function BanIdentifiers(identifier,reason)
		updateBlacklist( {identifiers = identifier , banner = "Unknown", reason = reason, expire = 10444633200} )
	end
	
	function UnbanIdentifier(identifier)
		if identifier then
			for i,ban in ipairs(blacklist) do
				for index,id in ipairs(ban.identifiers) do
					if identifier == id then
						table.remove(blacklist,i)
						if GetConvar("ea_custombanlist", "false") == "true" then 
							TriggerEvent("ea_data:removeBan", ban)
						end
						PrintDebugMessage("removed ban as per unbanidentifier func")
						return
					end 
				end
			end
		end
	end

	function UnbanId(id)
		for i,ban in ipairs(blacklist) do
			if ban.banid == id then
				table.remove(blacklist,i)
				if GetConvar("ea_custombanlist", "false") == "true" then 
					TriggerEvent("ea_data:removeBan", ban)
				end
			end
		end
	end

	function performBanlistUpgrades()
		for i,ban in ipairs(blacklist) do
			if ban.identifiers then
				for k, identifier in pairs(ban.identifiers) do
					if identifier == "" then
						ban.identifiers[k] = nil
						change = true 
					end
				end
			end
		end
		if blacklist[1] and (blacklist[1].identifier or blacklist[1].steam or blacklist[1].discord) then -- more compat
			Citizen.Trace("Upgrading Banlist...\n")
			for i,ban in ipairs(blacklist) do
				if not ban.identifiers then
					ban.identifiers = {}
					change=true
				end
				if ban.identifier then
					table.insert(ban.identifiers, ban.identifier)
					ban.identifier = nil
					change=true
				end
				if ban.steam then
					table.insert(ban.identifiers, ban.steam)
					ban.steam = nil
					change=true
				end
				if ban.discord and ban.discord ~= "" then
					table.insert(ban.identifiers, ban.discord)
					ban.discord = nil
					change=true
				end
			end
			Citizen.Trace("Banlist Upgraded! No Further Action is necesarry.\n")
		end
	end


	
	function IsIdentifierBanned(theIndentifier)
		local identifierfound = false
		for index,value in ipairs(blacklist) do
			for i,identifier in ipairs(value.identifiers) do
				if theIndentifier == identifier then
					identifierfound = true
				end
			end
		end
		return identifierfound
	end

	AddEventHandler("EasyAdmin:GetVersion", function(cb)
		local verFile = LoadResourceFile(GetCurrentResourceName(), "version.json")
		local verContent = json.decode(verFile)
		print(verContent.fivem.version)
		cb(verContent.fivem.version)
	end)
	
	AddEventHandler('playerConnecting', function(playerName, setKickReason)
		local numIds = GetPlayerIdentifiers(source)
		local matchingIdentifierCount = 0
		local matchingIdentifiers = {}
		if not blacklist then
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			print("EasyAdmin: ^1Failed^7 to load Banlist!\n")
			print("EasyAdmin: Please check this error soon, ^1Bans *will not* work!^7\n")
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
		 	return
		end
		for bi,blacklisted in ipairs(blacklist) do
			for i,theId in ipairs(numIds) do
				for ci,identifier in ipairs(blacklisted.identifiers) do
					if identifier == theId and matchingIdentifiers[theId] ~= true then
						matchingIdentifierCount = matchingIdentifierCount+1
						matchingIdentifiers[theId] = true
						PrintDebugMessage("IDENTIFIER MATCH! "..identifier.." Required: "..matchingIdentifierCount.."/"..minimumMatchingIdentifierCount)
						if matchingIdentifierCount >= minimumMatchingIdentifierCount then
							setKickReason(string.format( GetLocalisedText("bannedjoin"), blacklist[bi].reason, os.date('%d/%m/%Y 	%H:%M:%S', blacklist[bi].expire )))
							PrintDebugMessage("EasyAdmin: Connection of "..GetPlayerName(source).." Declined, Banned for "..blacklist[bi].reason.." \n")
							CancelEvent()
							return
						end
					end
				end
			end
		end
	end)


	AddEventHandler('chatMessage', function(Source, Name, Msg)
		if MutedPlayers[Source] then
			CancelEvent()
			TriggerClientEvent("chat:addMessage", Source, { args = { "EasyAdmin", GetLocalisedText("playermute") } })
		end
	end)



	
	
	
	---------------------------------- USEFUL
	
	function SendWebhookMessage(webhook,message,feature)
		moderationNotification = GetConvar("ea_moderationNotification", "false")
		if webhook ~= "false" and ExcludedWebhookFeatures[feature] ~= true then
			PerformHttpRequest(webhook, function(err, text, headers) end, 'POST', json.encode({content = message}), { ['Content-Type'] = 'application/json' })
		end
	end
	
	
	local verFile = LoadResourceFile(GetCurrentResourceName(), "version.json")
	local verContent = json.decode(verFile)
	if RedM then
		curVersion = verContent.redm.version
	else
		curVersion = verContent.fivem.version
	end
	local updatePath = "/Blumlaut/EasyAdmin"
	local resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"
	function checkVersion(err,response, headers)
		if err == 200 then
			local data = json.decode(response)
			local remoteVersion = data.fivem.version
			local changelog = data.fivem.changelog
			if RedM then
				remoteVersion = data.redm.version
				changelog = data.redm.changelog
			end
			if curVersion ~= remoteVersion and tonumber(curVersion) < tonumber(remoteVersion) then
				print("\n--------------------------------------------------------------------------")
				print("\n"..resourceName.." is outdated.\nNewest Version: "..remoteVersion.."\nYour Version: "..curVersion.."\nPlease update it from https://github.com"..updatePath.."")
				print("\nUpdate Changelog:\n"..changelog)
				print("\n--------------------------------------------------------------------------")
			elseif tonumber(curVersion) > tonumber(remoteVersion) then
				print("Your version of "..resourceName.." seems to be higher than the current version.")
			else
				print(resourceName.." is up to date!")
			end
		else
			print("EasyAdmin Version Check failed!")
		end
		if GetResourceState("screenshot-basic") == "missing" then 
			print("\nEasyAdmin: screenshot-basic is not installed on this Server, screenshots unavailable")
		else
			StartResource("screenshot-basic")
			screenshots = true
		end
		local onesync = GetConvar("onesync", "off")
		if (onesync ~= "off" and onesync ~= "legacy") then 
			infinity = true
		end
		
		SetTimeout(3600000, checkVersionHTTPRequest)
	end
	
	function checkVersionHTTPRequest()
		PerformHttpRequest("https://raw.githubusercontent.com/"..updatePath.."/master/version.json", checkVersion, "GET")
	end
	
	function loopUpdateBlacklist()
		updateBlacklist()
		SetTimeout(300000, loopUpdateBlacklist)
	end


	
	---------------------------------- END USEFUL
	loopUpdateBlacklist()
	updateAdmins()
	checkVersionHTTPRequest()
end)


-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
admins = {} -- DO NOT TOUCH THIS
MutedPlayers = {} -- DO NOT TOUCH THIS
CachedPlayers = {} -- DO NOT TOUCH THIS
OnlineAdmins = {} -- DO NOT TOUCH THIS
ChatReminders = {} -- DO NOT TOUCH THIS
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
