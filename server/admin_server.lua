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


-- Cooldowns for Admin Actions
AdminCooldowns = {}


---@param src number|string @The player source
---@param action string @The name of the admin action
---@return boolean @True if allowed to perform action, false if cooldown is active
function CheckAdminCooldown(src, action)
	local numSrc = tonumber(src)
	if not numSrc then return true end
	if AdminCooldowns[numSrc] then
		if AdminCooldowns[numSrc][action] then
			TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("waitbeforeusingagain"))
			return false
		end
	end
	return true
end


-- Sets a cooldown for a specific admin action
---@param src number|string
---@param action string
function SetAdminCooldown(src, action)
	local numSrc = tonumber(src)
	local coolTime = GetConvarInt("ea_adminCooldown:"..tostring(action), 0)
	if action and numSrc and coolTime > 0 then
		action = tostring(action)
		AdminCooldowns[src] = AdminCooldowns[src] or {}
		AdminCooldowns[src][action] = true
		Citizen.SetTimeout(1000*coolTime, function()
			if AdminCooldowns[src] then
				AdminCooldowns[src][action] = nil
			end
		end)
	end
end

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

-- Sends a global announcement
---@param text string
---@return boolean
function announce(reason)
	if reason then
		TriggerClientEvent("EasyAdmin:showNotification", -1, "[" .. GetLocalisedText("announcement") .. "] " .. reason)
		return true
	else
		return false
	end
end

exports('announce', announce)

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


-- Gets all identifiers for a player
---@param src number
---@return table
function getAllPlayerIdentifiers(playerId) --Gets all info that could identify a player
	local identifiers = GetPlayerIdentifiers(playerId)
	local tokens = {}
	if GetConvar("ea_useTokenIdentifiers", "true") == "true" then
		if not GetNumPlayerTokens or not GetPlayerToken then
			PrintDebugMessage("Server Version is below artifact 3335, disabling Token identifiers, please consider updating your FXServer!", 1)
			SetConvar("ea_useTokenIdentifiers", "false")
			PrintDebugMessage("Set ea_useTokenIdentifiers to false for this session.", 1)
			return identifiers
		end
		for i=0,GetNumPlayerTokens(playerId) do
			table.insert(tokens, GetPlayerToken(playerId, i))
		end
	end
	return mergeTables(identifiers, tokens)
end
exports('getAllPlayerIdentifiers', getAllPlayerIdentifiers)


function checkForChangedIdentifiers(playerIds, bannedIds)
	local unbannedIds = {}
	for _,playerId in pairs(playerIds) do
		local thisIdBanned = false
		for _,bannedId in pairs(bannedIds) do
			if playerId == bannedId then
				thisIdBanned = true
			end
		end
		if not thisIdBanned then --They have a new/changed identifier
			table.insert(unbannedIds, playerId)
		end
	end
	return unbannedIds
end


AddEventHandler('playerDropped', function (reason)
	if OnlineAdmins[source] then
		OnlineAdmins[source] = nil
	end
	if FrozenPlayers[source] then
		FrozenPlayers[source] = nil
		for i,_ in pairs(OnlineAdmins) do 
			TriggerLatentClientEvent("EasyAdmin:SetPlayerFrozen", i, 1000, source, nil)
		end
	end
	if MutedPlayers[source] then
		MutedPlayers[source] = nil
		for i,_ in pairs(OnlineAdmins) do 
			TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, source, nil)
		end
	end
	PrintDebugMessage(source.." disconnected.", 4)
end)

local Contributors = {
	['736521574383091722'] = true, -- Jaccosf
	['1001065851790839828'] = true, -- robbybaseplate
 	['840695262460641311'] = true, -- Knight
	['270731163822325770'] = true, -- Skypo
	['186980021850734592'] = true, -- coleminer0112
	['469916940710707231'] = true, -- Grav
	['882247593818726451'] = true, -- DukeOfCheese
}

RegisterServerEvent("EasyAdmin:GetInfinityPlayerList", function()
	PrintDebugMessage(getName(source, true).." requested Playerlist.", 4)
	if IsPlayerAdmin(source) then
		local l = {}
		local players = GetPlayers()
		
		for i, player in pairs(players) do
			local player = tonumber(player)
			local cachedPlayer = cachePlayer(player)
			local pData = { id = cachedPlayer.id, name = cachedPlayer.name, immune = cachedPlayer.immune, discord = cachedPlayer.discord, contributor = Contributors[cachedPlayer.discord], developer = cachedPlayer.discord == "178889658128793600" }

			l[#l + 1] = pData
		end
		
		-- each player is more or less 2000bytes big.
		TriggerLatentClientEvent("EasyAdmin:GetInfinityPlayerList", source, 200000, l) 
	end
end)

function GetOnlineAdmins()
	return OnlineAdmins
end
exports('GetOnlineAdmins', GetOnlineAdmins)

function IsPlayerAdmin(pid)
	return OnlineAdmins[pid]
end
exports('IsPlayerAdmin', IsPlayerAdmin)


Citizen.CreateThread(function()
	
	if not CachedPlayers or GetVersion() == nil then
		print("^7--------------------------------------------------------------")
		print("^1EasyAdmin self-test failed! Your EasyAdmin **will not work**, likely you edited some files and broke EasyAdmin in the progress, please reinstall EasyAdmin.")
		print("^7--------------------------------------------------------------")
		return 
	end
	
	
	if GetConvar("gamename", "gta5") == "rdr3" then 
		RedM = true
		PrintDebugMessage("Starting in rdr3 Mode.", 4)
	else
		RedM = false
		PrintDebugMessage("Starting in gta5 Mode.", 4)
	end
	
	AnonymousAdmins = {}

	loadLanguageStrings()

	moderationNotification = GetConvar("ea_moderationNotification", "false")
	reportNotification = GetConvar("ea_reportNotification", "false")
	detailNotification = GetConvar("ea_detailNotification", "false")
	minimumMatchingIdentifierCount = GetConvarInt("ea_minIdentifierMatches", 2)
	
	
	RegisterServerEvent('EasyAdmin:amiadmin', function()
		local source = source 
		
		cachePlayer(source) -- this will do nothing if player is already cached.
		
		if CachedPlayers[source].lastPermRequest and CachedPlayers[source].lastPermRequest+10 > os.time() then
			PrintDebugMessage(getName(source).." hit Permission Check Ratelimit! "..CachedPlayers[source].lastPermRequest+10-os.time().." seconds left.", 3)
			return
		end

		CachedPlayers[source].lastPermRequest = os.time()
		
		local identifiers = getAllPlayerIdentifiers(source)
		local perms = {}
		for perm,val in pairs(permissions) do
			local thisPerm = DoesPlayerHavePermission(source, perm)
			if perm == "player.screenshot" and not screenshots then
				thisPerm = false
			end
			--if (perm == "teleport" or perm == "spectate") and infinity then
			--if (perm == "spectate") and infinity then
			--	thisPerm = false
			--end 
			if thisPerm == true then
				OnlineAdmins[source] = true 
			end
			perms[perm] = thisPerm
			PrintDebugMessage("Processed Perm "..perm.." for "..getName(source, true)..", result: "..tostring(thisPerm), 3)
		end
		
		TriggerLatentClientEvent("EasyAdmin:adminresponse", source, 10000, perms)
		TriggerClientEvent('chat:addSuggestion', source, '/easyadmin', "EasyAdmin Menu", {{name="report or player id", help="[Optional] Report or Player ID"}})
		TriggerClientEvent('chat:addSuggestion', source, '/ea', "EasyAdmin Menu", {{name="report or player id", help="[Optional] Report or Player ID"}})

		if GetConvar("ea_enableReportCommand", "true") == "true" then
			TriggerClientEvent('chat:addSuggestion', source, '/'..GetConvar("ea_reportCommandName", "report"), "Report player", {{name='player', help="player name / id"}, {name='reason', help="Reason"}})
		end

		if GetConvar("ea_enableCallAdminCommand", "true") == "true" then
			TriggerClientEvent('chat:addSuggestion', source, '/'..GetConvar("ea_callAdminCommandName", "calladmin"), "Call Admin", {{name='reason', help="Reason"}})
		end

		

		if RedM then
			-- give player the right settings to work with
			local key = GetConvar("ea_defaultKey", "none")
			
			TriggerClientEvent("EasyAdmin:SetSetting", source, "button", key)
		end
		
		if GetConvar("ea_alwaysShowButtons", "false") == "true" then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", true)
		else
			TriggerClientEvent("EasyAdmin:SetSetting", source, "forceShowGUIButtons", false)
		end
		if updateAvailable then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "updateAvailable", updateAvailable)
		end
		
		-- if you remove this code then you're a killjoy, can't we have nice things? just once? it's not like this changes the whole admin menu or how it behaves, its a single subtitle.
		if os.date("%d/%m") == "22/08" then
			local age = tonumber(os.date("%Y"))-2017 local ordinal = "th" last_digit = age % 10 if last_digit == 1 and age ~= 11 then ordinal = 'st' elseif last_digit == 2 and age ~= 12 then ordinal = 'nd' elseif last_digit == 3 and age ~= 13 then ordinal = 'rd' end
			TriggerClientEvent("EasyAdmin:SetSetting", source, "alternativeTitle", "~b~Today is EasyAdmin's "..age..""..ordinal.." birthday! :)")
		elseif os.date("%m") == "06" and (tonumber(os.date("%d")) >= 1 and tonumber(os.date("%d")) <= 14)  then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "alternativeLogo", "pride")
		elseif os.date("%m") == "04" and os.date("%d") == "01" then
			TriggerClientEvent("EasyAdmin:SetSetting", source, "alternativeLogo", "logo-hardadmin")
			TriggerClientEvent("EasyAdmin:SetSetting", source, "alternativeBanner", "banner-hardadmin")
		end
		
		if (infinity) then 
			TriggerClientEvent("EasyAdmin:SetSetting", source, "infinity", true)
		end
		
		TriggerLatentClientEvent("EasyAdmin:fillShortcuts", source, 10000, MessageShortcuts)
		
		TriggerLatentClientEvent("EasyAdmin:SetLanguage", source, 10000, strings)
		
	end)
	
	RegisterServerEvent("EasyAdmin:kickPlayer", function(playerId,reason)
		if DoesPlayerHavePermission(source, "player.kick") and CheckAdminCooldown(source, "kick") and not CachedPlayers[playerId].immune then
			SetAdminCooldown(source, "kick")
			reason = formatShortcuts(reason)
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(source, false, true), getName(playerId, true, true), reason), "kick", 16711680)
			PrintDebugMessage("Kicking Player "..getName(source, true).." for "..reason, 3)
			DropPlayer(playerId, string.format(GetLocalisedText("kicked"), getName(source), reason) )
		elseif CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)
	
	RegisterServerEvent("EasyAdmin:requestSpectate", function(playerId)
		if DoesPlayerHavePermission(source, "player.spectate") and CheckAdminCooldown(source, "spectate") then
			SetAdminCooldown(source, "spectate")
			PrintDebugMessage("Player "..getName(source,true).." Requested Spectate to "..getName(playerId,true), 3)
			local tgtPed = GetPlayerPed(playerId)
			if tgtPed == 0 then
				-- ped does not exist left or not loaded in yet
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
				return
			end

			if playerId == source then
				return
			end

			local tgtCoords = GetEntityCoords(tgtPed)
			if tgtCoords.x == 0.00 and tgtCoords.y == 0.00 then
				-- loaded in but still spawning
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
				return
			end

			local playerBucket = GetPlayerRoutingBucket(playerId)
			local sourceBucket = GetPlayerRoutingBucket(source)
			if sourceBucket ~= playerBucket then
				-- upon spectate request, the admin needs to be set to the target player's bucket if not already
				SetPlayerRoutingBucket(source, playerBucket)
			end
			local playerData = { coords = tgtCoords, selfbucket = sourceBucket }
			TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, playerData)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('spectatedplayer'), getName(source, false, true), getName(playerId, true, true)), "spectate", 16777214)
		end
	end)

	RegisterServerEvent("EasyAdmin:requestBucket", function(playerId)
		if DoesPlayerHavePermission(source, "player.spectate") then
			local playerBucket = GetPlayerRoutingBucket(playerId)
			local sourceBucket = GetPlayerRoutingBucket(source)
			if sourceBucket ~= playerBucket then
				-- mismatch in buckets, the admin needs to be set to the target player
				SetPlayerRoutingBucket(source, playerBucket)
				local tgtCoords = GetEntityCoords(GetPlayerPed(playerId))
				local playerData = { coords = tgtCoords }
				TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, playerData)
			end
		end
	end)

	RegisterServerEvent("EasyAdmin:resetBucket", function(originalBucket)
		if DoesPlayerHavePermission(source, "player.spectate") then
			local sourceBucket = GetPlayerRoutingBucket(source)
			if sourceBucket ~= originalBucket then
				-- restore the moderator's original bucket to the cached start bucket
				SetPlayerRoutingBucket(source, originalBucket)
			end
		end
	end)

	RegisterServerEvent("EasyAdmin:JoinPlayerRoutingBucket", function(playerId)
		if DoesPlayerHavePermission(source, "player.bucket") then
			SetPlayerRoutingBucket(source, GetPlayerRoutingBucket(playerId))
		end
	end)
	
	RegisterServerEvent("EasyAdmin:ForcePlayerRoutingBucket", function(playerId)
		if DoesPlayerHavePermission(source, "player.bucket") then
			SetPlayerRoutingBucket(playerId, GetPlayerRoutingBucket(source))
		end
	end)

	function cleanupArea(type, radius, player)
		if not radius then radius = "global" end
		if (onesync ~= "off" and onesync ~= "legacy") then
			local toDelete = {}
			if type == "cars" then
				toDelete = GetAllVehicles()
			elseif type == "peds" then
				toDelete = GetAllPeds()
			elseif type == "props" then
				toDelete = GetAllObjects()
			end
			PrintDebugMessage("server-known entities: "..table_to_string(toDelete), 4)
			for _,entity in pairs(toDelete) do
				PrintDebugMessage("starting deletion for entity "..entity, 4)
				if DoesEntityExist(entity) and not (type == "cars" and IsPedAPlayer(GetPedInVehicleSeat(entity, -1))) and not (type == "peds" and IsPedAPlayer(entity)) then
					if radius == "global" then
						PrintDebugMessage("deleting entity "..entity, 3)
						DeleteEntity(entity)
					else
						local entityCoords = GetEntityCoords(entity)
						local playerCoords = GetEntityCoords(GetPlayerPed(player))
						if #(playerCoords - entityCoords) < radius then
							PrintDebugMessage("deleting entity "..entity, 3)
							DeleteEntity(entity)
						end
					end
				end
			end
			return true
		else
			return false
		end
	end
	exports('cleanupArea', cleanupArea)


	RegisterServerEvent("EasyAdmin:requestCleanup", function(type, radius, deep)
		local source=source
		if DoesPlayerHavePermission(source, "server.cleanup."..type) then
			PrintDebugMessage("Player "..getName(source,true).." Requested Cleanup for "..type, 3)
			cleanupArea(type, radius, source)
			
			if deep then
				TriggerClientEvent("EasyAdmin:requestCleanup", source, type, radius)
			end
			TriggerClientEvent("EasyAdmin:showNotification", source, string.format(GetLocalisedText("finishedcleaning"), GetLocalisedText(type)))
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('admincleanedup'), getName(source, false, true), type, radius), "cleanup", 16777214)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetGameType", function(text)
		if DoesPlayerHavePermission(source, "server.convars") then
			PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..text, 3)
			SetGameType(text)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), "gametype", text), "settings", 16777214)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetMapName", function(text)
		if DoesPlayerHavePermission(source, "server.convars") then
			PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..text, 3)
			SetMapName(text)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), "mapname", text), "settings", 16777214)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StartResource", function(text)
		if DoesPlayerHavePermission(source, "server.resources.start") then
			PrintDebugMessage("Player "..getName(source,true).." started Resource "..text, 3)
			StartResource(text)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminstartedresource'), getName(source, false, true), text), "settings", 65280)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:StopResource", function(text)
		if DoesPlayerHavePermission(source, "server.resources.stop") then
			PrintDebugMessage("Player "..getName(source,true).." stopped Resource "..text, 3)
			StopResource(text)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminstoppedresource'), getName(source, false, true), text), "settings", 16711680)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:SetConvar", function(convarname, convarvalue)
		if DoesPlayerHavePermission(source, "server.convars") then
			PrintDebugMessage("Player "..getName(source,true).." set convar "..convarname.. " to "..convarvalue, 3)
			SetConvar(convarname, convarvalue)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), convarname, convarvalue), "settings", 16777214)
		end
	end)

	RegisterServerEvent("EasyAdmin:Announce", function(text)
		if DoesPlayerHavePermission(source, "server.announce") then
			PrintDebugMessage("Player "..getName(source,true).." sent a announcement: "..text, 3)
			announce(text)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminannouncement'), getName(source, false, true), text), "settings", 16777214)
		end	
	end)

	RegisterServerEvent("EasyAdmin:TeleportPlayerToCoords", function(playerId,tgtCoords)
		local source=source
		if DoesPlayerHavePermission(source, "player.teleport.single") and CheckAdminCooldown(source, "teleport") then
			SetAdminCooldown(source, "teleport")
			PrintDebugMessage("Player "..getName(source,true).." requsted teleport to "..tgtCoords.x..", "..tgtCoords.y..", "..tgtCoords.z, 3)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			local playerName = getName(playerId, true, true)
			if playerId == -1 then
				playerName = GetLocalisedText("allplayers")
			end
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("teleportedtoplayer"), playerName, getName(source, false, true)), "teleport", 16777214)
			TriggerClientEvent("EasyAdmin:TeleportRequest", playerId, false, tgtCoords)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:TeleportAdminToPlayer", function(id)
		local source=source
		if not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") and CheckAdminCooldown(source, "teleport") then
			SetAdminCooldown(source, "teleport")
			local tgtPed = GetPlayerPed(id)
			if tgtPed == 0 then
				-- ped does not exist left or not loaded in yet
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
				return
			end
			if id == source then
				return
			end
			local tgtCoords = GetEntityCoords(tgtPed)
			if tgtCoords.x == 0.00 and tgtCoords.y == 0.00 then
				-- loaded in but still spawning
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
				return
			end
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("teleportedtoplayer"), getName(source, false, true), getName(id, true, true)), "teleport", 16777214)
			TriggerClientEvent('EasyAdmin:TeleportRequest', source, id,tgtCoords)
		else
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
			PrintDebugMessage('EASYADMIN FAILED TO TELEPORT'..source..' TO ID: '..id, 2)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:TeleportPlayerBack", function(id)
		local source=source
		if not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") then
			TriggerClientEvent('EasyAdmin:TeleportPlayerBack', id)
		end
	end)

	-- Slaps a player for a given amount of HP
	---@param playerId number
	---@param slapAmount number
	---@return boolean
	function slapPlayer(playerId,slapAmount)
		if not CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:SlapPlayer", playerId, slapAmount)
			return true
		else
			return false
		end
	end
	exports('slapPlayer', slapPlayer)
	
	RegisterServerEvent("EasyAdmin:SlapPlayer", function(playerId,slapAmount)
		if DoesPlayerHavePermission(source, "player.slap") and CheckAdminCooldown(source, "slap") and slapPlayer(playerId, slapAmount) then
			SetAdminCooldown(source, "slap")
			PrintDebugMessage("Player "..getName(source,true).." slapped "..getName(playerId,true).." for "..slapAmount.." HP", 3)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminslappedplayer"), getName(source, false, true), getName(playerId, true, true), slapAmount), "slap", 16777214)
		elseif CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)
	

	-- Freezes or unfreezes a player
	---@param playerId number
	---@param toggle boolean
	---@return boolean
	function freezePlayer(playerId, toggle)
		if not toggle then toggle = not FrozenPlayers[playerId] end
		if not CachedPlayers[playerId].immune then
			FrozenPlayers[playerId] = (toggle == true or nil)
			TriggerClientEvent("EasyAdmin:FreezePlayer", playerId, toggle)
			for i,_ in pairs(OnlineAdmins) do 
				TriggerLatentClientEvent("EasyAdmin:SetPlayerFrozen", i, 1000, playerId, (toggle == true or nil))
			end
			return true
		else
			return false
		end
	end
	exports('freezePlayer', freezePlayer)

	RegisterServerEvent("EasyAdmin:FreezePlayer", function(playerId,toggle)
		if DoesPlayerHavePermission(source, "player.freeze") and not CachedPlayers[playerId].immune and CheckAdminCooldown(source, "freeze") then
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			freezePlayer(playerId, toggle)
			if toggle then
				SetAdminCooldown(source, "freeze")
				SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminfrozeplayer"), getName(source, false, true), getName(playerId, true, true)), "freeze", 16777214)
				PrintDebugMessage("Player "..getName(source,true).." froze "..getName(playerId,true), 3)
			else
				SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminunfrozeplayer"), getName(source, false, true), getName(playerId, true, true)), "freeze", 16777214)
				PrintDebugMessage("Player "..getName(source,true).." unfroze "..getName(playerId,true), 3)
			end
		elseif CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)
	

	scrinprogress = false
	-- Checks if a screenshot is in progress
	---@return boolean
	function isScreenshotInProgress()
		return scrinprogress
	end
	exports('isScreenshotInProgress', isScreenshotInProgress)

	RegisterServerEvent("EasyAdmin:TakeScreenshot", function(playerId)
		if scrinprogress then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("screenshotinprogress"))
			return
		end
		local src=source
		local playerId = playerId
		local invokingResource
		if GetInvokingResource() and GetInvokingResource() ~= GetCurrentResourceName() then
			invokingResource = "`"..GetInvokingResource().."`"
		end
		
		if DoesPlayerHavePermission(source, "player.screenshot") and CheckAdminCooldown(source, "screenshot") then
			SetAdminCooldown(source, "screenshot")
			scrinprogress = true
			thistemporaryevent = RegisterServerEvent("EasyAdmin:TookScreenshot", function(result)
				if result == "ERROR" then return false end
				
				res = matchURL(tostring(result)) 
				
				PrintDebugMessage("Screenshot taken, result:\n "..res, 4)
				SendWebhookMessage(moderationNotification, string.format(GetLocalisedText("admintookscreenshot"), invokingResource or getName(src), getName(playerId, true, true), res), "screenshot", 16777214, "Screenshot Captured", res)
				TriggerClientEvent('chat:addMessage', src, { template = '<img src="{0}" style="max-width: 400px;" />', args = { res } })
				TriggerClientEvent("chat:addMessage", src, { args = { "EasyAdmin", string.format(GetLocalisedText("screenshotlink"), res) } })
				PrintDebugMessage("Screenshot for Player "..getName(playerId,true).." done, "..res.." requsted by"..getName(src,true), 3)
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
					PrintDebugMessage("Screenshot timed out", 4)
					TriggerClientEvent("EasyAdmin:showNotification", src, "Screenshot Failed!")
				end
			until not scrinprogress
		end
	end)
	
	RegisterServerEvent("EasyAdmin:mutePlayer", function(playerId)
		local src = source
		if DoesPlayerHavePermission(src,"player.mute") and not CachedPlayers[playerId].immune and CheckAdminCooldown(source, "mute") then
			SetAdminCooldown(source, "mute")
			local muted = mutePlayer(playerId, not MutedPlayers[playerId])

			if muted then
				if MutedPlayers[playerId] then
					TriggerClientEvent("EasyAdmin:showNotification", src, getName(playerId) .. " " .. GetLocalisedText("playermuted"))
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminmutedplayer"), getName(source, false, true), getName(playerId, false, true)), "mute", 16777214)
				else
					TriggerClientEvent("EasyAdmin:showNotification", src, getName(playerId) .. " " .. GetLocalisedText("playerunmuted"))
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunmutedplayer"), getName(source, false, false), getName(playerId, false, true)), "mute", 16777214)
				end
			else
				-- todo: handle false retval
			end
		end
	end)

	-- Mutes or unmutes a player
	---@param playerId number
	---@param toggle boolean
	---@return boolean
	function mutePlayer(playerId, toggle)
		if not CachedPlayers[playerId].immune then 
			if toggle and not MutedPlayers[playerId] then
				MutedPlayers[playerId] = true
				if MumbleSetPlayerMuted then -- workaround for outdated servers
					MumbleSetPlayerMuted(playerId, true)
				end
				PrintDebugMessage("muted "..getName(playerId,true), 3)
				for i,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, playerId, (MutedPlayers[playerId] == true or nil))
				end
				return true
			elseif not toggle and MutedPlayers[playerId] then
				MutedPlayers[playerId] = nil
				if MumbleSetPlayerMuted then -- workaround for outdated servers
					MumbleSetPlayerMuted(playerId, false)
				end
				PrintDebugMessage("unmuted "..getName(playerId,true), 3)
				for i,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, playerId, (MutedPlayers[playerId] == true or nil))
				end
				return true
			else 
				return false
			end
		else
			return false
		end
	end
	exports('mutePlayer', mutePlayer)
	
	RegisterServerEvent("EasyAdmin:SetAnonymous", function(playerId)
		if DoesPlayerHavePermission(source, "anon") then
			if AnonymousAdmins[source] then
				AnonymousAdmins[source] = nil
				PrintDebugMessage("Player "..getName(source,true).." un-anoned themself", 3)
			else
				AnonymousAdmins[source] = true
				PrintDebugMessage("Player "..getName(source,true).." anoned themself", 3)
			end
		end
	end)

	
	-- Gets the name of a player, optionally including identifiers
	---@param src number|string
	---@param anonymousdisabled boolean
	---@param identifierenabled boolean
	---@return string
	function getName(src,anonymousdisabled,identifierenabled)
		local identifierPref = GetConvar("ea_logIdentifier", "steam,discord,license")
		if identifierPref == "false" then identifierenabled = false end;
		local identifiers, identifier = {}, "~No Identifier~"
		if (src == 0 or src == "") then
			return "Console"
		else
			if AnonymousAdmins[src] and not anonymousdisabled then
				return GetLocalisedText("anonymous")
			elseif CachedPlayers[src] and CachedPlayers[src].name then
				
				if not identifierenabled then
					return CachedPlayers[src].name
				end

				if not CachedPlayers[src].discord then
					return CachedPlayers[src].name
				end

				return (string.format("%s [ %s ]", CachedPlayers[src].name, CachedPlayers[src].discord))

			elseif (GetPlayerName(src)) then
				local playerName = GetPlayerName(src)
				if not identifierenabled then
					return playerName
				end

				local playerDiscord = GetPlayerIdentifierByType(src, "discord") and GetPlayerIdentifierByType(src, "discord"):gsub("discord:", "") or false
				if not playerDiscord then
					return playerName
				end

				return (string.format("%s [ %s ]", playerName, playerDiscord))

			else
				return "Unknown - " .. src
			end
		end
	end
	exports('getName', getName)

	RegisterServerEvent("EasyAdmin:warnPlayer", function(id, reason)
		local src = source
		if DoesPlayerHavePermission(src,"player.warn") and not CachedPlayers[id].immune and CheckAdminCooldown(source, "warn") then
			SetAdminCooldown(source, "warn")
			reason = formatShortcuts(reason)
			local maxWarnings = GetConvarInt("ea_maxWarnings", 3)
			if not WarnedPlayers[id] then
				WarnedPlayers[id] = {name = getName(id, true), identifiers = getAllPlayerIdentifiers(id), warns = 0}
			end
			WarnedPlayers[id].warns = WarnedPlayers[id].warns+1
			TriggerClientEvent('chat:addMessage', id, { 
				template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0} </div>',
				args = {  string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings) }, color = { 255, 255, 255 } 
			})
			TriggerClientEvent("txcl:showWarning", id, getName(src), string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminwarnedplayer"), getName(src, false, true), getName(id, true, true), reason, WarnedPlayers[id].warns, maxWarnings), "warn", 16711680)
			if WarnedPlayers[id].warns >= maxWarnings then
				if GetConvar("ea_warnAction", "kick") == "kick" then
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(src, false, true), getName(id, true, true), reason), "kick", 16711680)
					DropPlayer(id, GetLocalisedText("warnkicked"))
					WarnedPlayers[id] = nil
				elseif GetConvar("ea_warnAction", "kick") == "ban" then
					local bannedIdentifiers = CachedPlayers[id].identifiers or getAllPlayerIdentifiers(id)
					local bannedUsername = CachedPlayers[id].name or getName(id, true)
					local expires = os.time()+GetConvarInt("ea_warningBanTime", 604800)
					
					reason = GetLocalisedText("warnbanned").. string.format(GetLocalisedText("reasonadd"), CachedPlayers[id].name, getName(source, true) )
					local ban = {banid = GetFreshBanId(), name = bannedUsername,identifiers = bannedIdentifiers,  banner = getName(source, true), reason = reason, expire = expires }
					updateBlacklist( ban )
					
					
					
					PrintDebugMessage("Player "..getName(source,true).." warnbanned player "..CachedPlayers[id].name.." for "..reason, 3)
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), getName(source, false, true), bannedUsername, reason, formatDateString( expires ), tostring(ban.banid) ), "ban", 16711680)
					DropPlayer(id, string.format(GetLocalisedText("banned"), reason, formatDateString( expires ) ) )
					WarnedPlayers[id] = nil
					
				end
			end
		elseif CachedPlayers[id].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)


	-- Warns a player and handles kick/ban logic if max warnings are reached
	---@param src number
	---@param id number
	---@param reason string
	---@return boolean
	function warnPlayerExport(src, id, reason)
		if not CachedPlayers[id].immune then
			local maxWarnings = GetConvarInt("ea_maxWarnings", 3)
			if not WarnedPlayers[id] then
				WarnedPlayers[id] = {name = getName(id, true), identifiers = getAllPlayerIdentifiers(id), warns = 0}
			end
			WarnedPlayers[id].warns = WarnedPlayers[id].warns+1
			TriggerClientEvent('chat:addMessage', id, { 
				template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0} </div>',
				args = {  string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings) }, color = { 255, 255, 255 } 
			})
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminwarnedplayer"), src, getName(id, true, true), reason, WarnedPlayers[id].warns, maxWarnings), "warn", 16711680)
			TriggerClientEvent("txcl:showWarning", id, src, string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
			if WarnedPlayers[id].warns >= maxWarnings then
				if GetConvar("ea_warnAction", "kick") == "kick" then
					SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), src, getName(id, true, true), reason), "kick", 16711680)
					DropPlayer(id, GetLocalisedText("warnkicked"))
					WarnedPlayers[id] = nil
				elseif GetConvar("ea_warnAction", "kick") == "ban" then
					local expires = os.time()+GetConvarInt("ea_warningBanTime", 604800)
					addBanExport(id, reason, formatDateString(expires), src)
					WarnedPlayers[id] = nil
				end
			end
			return true
		else
			return false
		end
	end

	exports('warnPlayer', warnPlayerExport)

	-- Gets the number of warnings a player has
	---@param playerId number
	---@return number
	function getPlayerWarnings(playerId)
		if not WarnedPlayers[playerId] then
			return 0
		else
			return WarnedPlayers[playerId].warns
		end
	end
	exports('getPlayerWarnings', getPlayerWarnings)
	
	AddEventHandler("EasyAdmin:GetVersion", function(cb)
		cb(GetVersion())
	end)
	
	
	
	local chatEventsSupported = false
	
	pcall(function() -- this will prevent our script from erroring if the exports are missing, also mutes any errors.
		if exports.chat.registerMessageHook and exports.chat.registerMode then
			chatEventsSupported = true
		end
	end)
	
	
	
	if chatEventsSupported then
		exports.chat:registerMessageHook(function(source, outMessage, hookRef)
			if MutedPlayers[source] then
				hookRef.cancel()
				TriggerClientEvent("EasyAdmin:showNotification", source, getName(source) .. ", " .. GetLocalisedText("playermute"))
			end
		end)
	else
		AddEventHandler('chatMessage', function(source, name, msg)
			if MutedPlayers[source] then
				CancelEvent()
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("playermute") } })
				TriggerClientEvent("EasyAdmin:showNotification", source, getName(source) .. ", " .. GetLocalisedText("playermute"))
			end
		end)
	end
	
	
	if GetConvar("ea_enableChat", "true") == "true" and chatEventsSupported then
		exports.chat:registerMode({
			name = "admins",
			displayName = "Admin Chat",
			color = "#19A2E3",
			seObject = "easyadmin.server.chat",
			cb = function(source, message, cbs)
				cbs.updateMessage({
					template = "^5[ADMIN CHAT]^7" .. ' {}'
				})
				
				cbs.setSeObject("easyadmin.server.chat")
			end
		})
	end
end)

Citizen.CreateThread(function()
	while true do
		PerformHttpRequest("https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest", checkVersion, "GET")
		Wait(3600000)
	end
end)

Citizen.CreateThread(function()
	-- Makes an HTTP request and returns the result
	---@param url string
	---@param ... any
	---@return string
	function HTTPRequest(url, ...)
		local err,response,headers
		
		PerformHttpRequest(url, function(e,r,h)
			err,response,headers = e,r,h
		end, ...)
		repeat
			Wait(10)
		until (response)
		
		return response
	end
	exports('HTTPRequest', HTTPRequest)
end)

Citizen.CreateThread(function()
	
	AddEventHandler('playerConnecting', function(playerName, setKickReason, deferrals)
		local player = source
		local numIds = getAllPlayerIdentifiers(player)
		local matchingIdentifierCount = 0
		local matchingIdentifiers = {}
		local showProgress = GetConvar("ea_presentDeferral", "true")
		
		deferrals.defer()
		Wait(0)
		local deferralText = string.format(GetLocalisedText("deferral"), 0)
		if showProgress == "false" then
			deferralText = deferralText:sub(1, -6)
		end
		
		deferrals.update(deferralText)
		PrintDebugMessage(getName(player).."'s Identifiers:\n "..table_to_string(numIds), 3)
		if not blacklist then
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			print("EasyAdmin: ^1Failed^7 to load Banlist!\n")
			print("EasyAdmin: Please check this error soon, ^1Bans *will not* work!^7\n")
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			deferrals.done("\n\nEasyAdmin: A fatal error occured, please contact a Server Administrator to resolve this issue.")
			return
		end
		Wait(0)
		
		local lastPercentage = 0
		for bi,blacklisted in ipairs(blacklist) do
			if showProgress == "true" then
				local percentage = math.round(bi/#blacklist*100)
				if bi % 12 == 0 and percentage >= lastPercentage+4 then -- only update on every 12th ban
					Wait(0)
					deferrals.update(string.format(GetLocalisedText("deferral"), percentage))
					lastPercentage = percentage
				end
			end
			for i,theId in ipairs(numIds) do
				for ci,identifier in ipairs(blacklisted.identifiers) do
					if identifier == theId and matchingIdentifiers[theId] ~= true then
						matchingIdentifierCount = matchingIdentifierCount+1 
						matchingIdentifiers[theId] = true -- make sure we remember the identifier for later
						PrintDebugMessage("IDENTIFIER MATCH! "..identifier.." Required: "..matchingIdentifierCount.."/"..minimumMatchingIdentifierCount, 3)
						local notBannedIds = checkForChangedIdentifiers(numIds, blacklisted.identifiers)
						if matchingIdentifierCount >= minimumMatchingIdentifierCount then
							if #notBannedIds > 0 then
								local newBanData = blacklisted
								newBanData.identifiers = mergeTables(blacklisted.identifiers, notBannedIds) -- add newly found identifiers to the existing ban
								updateBan(blacklisted.banid,newBanData) -- send it off!
							end
							PrintDebugMessage("Connection of "..getName(player).." Declined, Banned for "..blacklist[bi].reason..", Ban ID: "..blacklist[bi].banid.."\n", 3)
							
							local banMessageTitleColour = GetConvar("ea_banMessageTitleColour", "#354557")
							local banMessageServerName = GetConvar("ea_banMessageServerName", GetConvar("sv_projectName", "EasyAdmin"))							
							local banMessageShowStaff = GetConvar("ea_banMessageShowStaff", "true")
							local banMessageStaffName = blacklist[bi].banner
							local banMessageFooter = GetConvar("ea_banMessageFooter", "You can appeal this by ban by visiting our discord.")
							local banMessageSubHeader = GetConvar("ea_banMessageSubHeader", "You have been banned from this server.")
							local banMessageWatermark = GetConvar("ea_banMessageWatermark", "data:image/png;base64,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") 
 
							local banMessageReason = blacklist[bi].reason:gsub(string.format(", .*: %s", banMessageStaffName), "")
							-- gives us a raw ban reason with their nickname as we don't want the staff member displayed due to our new convar // "banned by:" field
							
							if banMessageShowStaff == "false" then 
								banMessageStaffName = 'Server Staff'
							end

							deferrals.done(
                        	'<div style="background-color: rgba(30, 30, 30, 0.5); padding: 20px; border: solid 2px var(--color-modal-border); border-radius: var(--border-radius-normal); margin-top: 25px; position: relative;"><h1 style="color:' .. banMessageTitleColour .. ';">' .. banMessageServerName .. '</h1><br><h2>'.. banMessageSubHeader ..'</h2><br><p style="font-size: 1.25rem; padding: 0px"><strong>Expires:</strong> ' ..
                            formatDateString(blacklist[bi].expire) .. '<br><strong>Banned By:</strong> ' .. banMessageStaffName ..
                            ' <br>            <strong>Ban Reason:</strong> ' .. banMessageReason ..
                            ' <br>            <strong>Ban ID:</strong> <code style="letter-spacing: 2px; background-color: #ff7f5059; padding: 2px 4px; border-radius: 6px;">' ..
                            blacklist[bi].banid ..
                            '</code><br><br>' .. banMessageFooter .. ' <span style="font-style: italic;"></span></p><img src="' .. banMessageWatermark ..  '" style="position: absolute;right: 15px;bottom: 15px;opacity: 65%;"></div>')
							return

						end
					end
				end
			end
		end
		
		if GetConvar("ea_enableAllowlist", "false") == "true" then
			deferrals.update(GetLocalisedText("checkingallowlist"))
			local allowlistAttempts = 0
			local allowlisted = false
			repeat
				allowlisted = DoesPlayerHavePermission(player, "player.allowlist")
				allowlistAttempts = allowlistAttempts+1
				Wait(100)
			until (allowlistAttempts >= 15 or allowlisted == true)
			
			if DoesPlayerHavePermission(player, "player.allowlist") then
				deferrals.done()
			else
				deferrals.done(GetLocalisedText("allowlist"))
				return
			end
		else
			deferrals.done()
		end
		
	end)
	
end)


curVersion, isMaster = GetVersion()
local resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"
function checkVersion()
	local remoteVersion,remoteURL = getLatestVersion()

	if GetResourceKvpString('currentVersion') ~= curVersion then
		local legacyFiles = {
			'__resource.lua',
			'version.json',
			'admin_server.lua',
			'admin_client.lua',
			'gui_c.lua',
			'util_shared.lua',
			'yarn.lock',
			'.yarn.installed',
			'server/bot/notifications.js',
			'package.json',
			'server/bot/bot.js',
			'server/bot/chat_bridge.js',
			'server/bot/functions.js',
			'server/bot/logging.js',
			'server/bot/player_events.js',
			'server/bot/reports.js',
			'server/bot/roles.js',
			'server/bot/server_status.js',
			'server/bot/commands/add_ace.js',
			'server/bot/commands/add_group.js',
			'server/bot/commands/announce.js',
			'server/bot/commands/ban.js',
			'server/bot/commands/baninfo.js',
			'server/bot/commands/cleanup.js',
			'server/bot/commands/configure.js',
			'server/bot/commands/freeze.js',
			'server/bot/commands/kick.js',
			'server/bot/commands/mute.js',
			'server/bot/commands/playerinfo.js',
			'server/bot/commands/playerlist.js',
			'server/bot/commands/refreshperms.js',
			'server/bot/commands/remove_ace.js',
			'server/bot/commands/remove_group.js',
			'server/bot/commands/screenshot.js',
			'server/bot/commands/slap.js',
			'server/bot/commands/unban.js',
			'server/bot/commands/unfreeze.js',
			'server/bot/commands/unmute.js',
			'server/bot/commands/warn.js',
			'dist/commands/configure.js'
		}
	
		for i,file in pairs(legacyFiles) do
			local fileExists = LoadResourceFile(GetCurrentResourceName(), file)
			if fileExists then
				os.remove(GetResourcePath(GetCurrentResourceName()).."/"..file)
				PrintDebugMessage("Found legacy file "..file.." in EasyAdmin Folder and attempted deletion.", 2)
			end
		end

		PrintDebugMessage('EasyAdmin has been updated, or just been installed for the first time, please restart EasyAdmin to ensure smooth operation.', 1)
		
		SetResourceKvpNoSync('currentVersion', curVersion)
	end

	if isMaster then
		PrintDebugMessage("You are using an unstable version of EasyAdmin, if this was not your intention, please download the latest stable version from "..remoteURL, 1)
	end

	if not tonumber(curVersion) then
		PrintDebugMessage("EasyAdmin's Version Number is invalid, this usually means you are using a pre-release version")
	elseif curVersion ~= remoteVersion and tonumber(curVersion) < tonumber(remoteVersion) then
		print("\n--------------------------------------------------------------------------")
		print("\n"..resourceName.." is outdated.\nNewest Version: "..remoteVersion.."\nYour Version: "..curVersion.."\nPlease update it from "..remoteURL)
		print("\n--------------------------------------------------------------------------")
		updateAvailable = remoteVersion
	elseif tonumber(curVersion) > tonumber(remoteVersion) then
		PrintDebugMessage("Your version of "..resourceName.." seems to be higher than the current stable version.", 2)
	end
	
	if GetResourceState("screenshot-basic") == "missing" then 
		PrintDebugMessage("screenshot-basic is not installed, screenshots unavailable", 3)
	else
		StartResource("screenshot-basic")
		screenshots = true
	end
	
	local onesync = GetConvar("onesync", "off")
	if (onesync ~= "off" and onesync ~= "legacy") then 
		PrintDebugMessage("Onesync is Infinity", 3)
		infinity = true
	end
	
	if GetConvar("ea_defaultKey", "none") == "none" and RedM then
		PrintDebugMessage("ea_defaultKey is not defined, EasyAdmin can only be opened using the /easyadmin command, to define a key:\nhttps://easyadmin.readthedocs.io/en/latest", 1)
	end
end


Citizen.CreateThread(function()
	function getLatestVersion()
		local latestVersion,latestURL
		
		PerformHttpRequest("https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest", function(err,response,headers)
			if err == 200 then
				local data = json.decode(response)
				latestVersion = data.tag_name
				latestURL = data.html_url
			else
				latestVersion = GetVersion()
				latestURL = "https://github.com/Blumlaut/EasyAdmin"
			end		
			PrintDebugMessage("Version check returned "..err..", Local Version: "..GetVersion()..", Remote Version: "..latestVersion, 4)
		end, "GET")
		
		repeat
			Wait(50)
		until (latestVersion and latestURL)
		return latestVersion, latestURL
	end
	exports('getLatestVersion', getLatestVersion)

end)

Citizen.CreateThread(function()
	repeat
		Wait(1000)
	until updateBlacklist
	while true do
		updateBlacklist()
		Wait(300000)
	end
end)


---------------------------------- END USEFUL

if GetConvar("ea_enableSplash", "true") == "true" then
	local version,master = GetVersion()
	if master then version = version.." (UNSTABLE PRE-RELEASE!)" end
	print("\n _______ _______ _______ __   __ _______ ______  _______ _____ __   _\n |______ |_____| |______   \\_/   |_____| |     \\ |  |  |   |   | \\  |\n |______ |     | ______|    |    |     | |_____/ |  |  | __|__ |  \\_|\n                           Version ^3"..version.."^7")
	PrintDebugMessage("Initialised.", 4)
end


-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
MutedPlayers = {} -- DO NOT TOUCH THIS
OnlineAdmins = {} -- DO NOT TOUCH THIS
ChatReminders = {} -- DO NOT TOUCH THIS
MessageShortcuts = {} -- DO NOT TOUCH THIS
WarnedPlayers = {} -- DO NOT TOUCH THIS
reports = {} -- DO NOT TOUCH THIS
FrozenPlayers = {} -- DO NOT TOUCH THIS
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
-- DO NOT TOUCH THESE
