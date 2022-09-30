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


RegisterServerEvent("EasyAdmin:GetInfinityPlayerList", function()
	PrintDebugMessage(getName(source, true).." requested Playerlist.", 4)
	if IsPlayerAdmin(source) then
		local l = {}
		local players = GetPlayers()
		
		for i, player in pairs(players) do
			local player = tonumber(player)
			cachePlayer(player)
			for i, cached in pairs(CachedPlayers) do
				if (cached.id == player) then
					local pData = {id = cached.id, name = cached.name, immune = cached.immune}
					for i, v in pairs(cached.identifiers) do
						if v == "discord:178889658128793600" then 
							pData.developer = true
						elseif v == "discord:736521574383091722" --[[ Jaccosf ]] or v == "discord:1001065851790839828" --[[ robbybaseplate ]] or v == "discord:840695262460641311" --[[ Knight ]] or v == "discord:270731163822325770" --[[ Skypo ]] or v == "discord:186980021850734592" --[[ coleminer0112 ]] then
							pData.contributor = true
						end
					end
					table.insert(l, pData)
				end
			end
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
			if string.find(perm, "server.permissions") and disablePermissionEditor then
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
		if DoesPlayerHavePermission(source, "player.kick") and not CachedPlayers[playerId].immune then
			reason = formatShortcuts(reason)
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(source, false, true), getName(playerId, true, true), reason), "kick", 16711680)
			PrintDebugMessage("Kicking Player "..getName(source, true).." for "..reason, 3)
			DropPlayer(playerId, string.format(GetLocalisedText("kicked"), getName(source), reason) )
		elseif CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)
	
	RegisterServerEvent("EasyAdmin:requestSpectate", function(playerId)
		if DoesPlayerHavePermission(source, "player.spectate") then
			PrintDebugMessage("Player "..getName(source,true).." Requested Spectate to "..getName(playerId,true), 3)
			local tgtCoords = GetEntityCoords(GetPlayerPed(playerId))
			TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, tgtCoords)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('spectatedplayer'), getName(source, false, true), getName(playerId, true, true)), "spectate", 16777214)
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
		if DoesPlayerHavePermission(source, "player.teleport.single") then
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
		if not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") then
			local tgtPed = GetPlayerPed(id)
			local tgtCoords = GetEntityCoords(tgtPed)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("teleportedtoplayer"), getName(source, false, true), getName(id, true, true)), "teleport", 16777214)
			TriggerClientEvent('EasyAdmin:TeleportRequest', source, id,tgtCoords)
		else
			PrintDebugMessage('EASYADMIN FAILED TO TELEPORT'..source..' TO ID: '..id, 2)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:TeleportPlayerBack", function(id)
		if not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") then
			TriggerClientEvent('EasyAdmin:TeleportPlayerBack', id)
		end
	end)

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
		if DoesPlayerHavePermission(source, "player.slap") and slapPlayer(playerId, slapAmount) then
			PrintDebugMessage("Player "..getName(source,true).." slapped "..getName(playerId,true).." for "..slapAmount.." HP", 3)
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminslappedplayer"), getName(source, false, true), getName(playerId, true, true), slapAmount), "slap", 16777214)
		elseif CachedPlayers[playerId].immune then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
		end
	end)
	

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
		if DoesPlayerHavePermission(source, "player.freeze") and not CachedPlayers[playerId].immune then
			local preferredWebhook = detailNotification ~= "false" and detailNotification or moderationNotification
			freezePlayer(playerId, toggle)
			if toggle then
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
		
		if DoesPlayerHavePermission(source, "player.screenshot") then
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
		if DoesPlayerHavePermission(src,"player.mute") and not CachedPlayers[playerId].immune then
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

	
	-- Very basic function that turns "source" into a useable player name.
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
				if CachedPlayers[src].identifiers then
					if identifierPref then
						-- split identifierPref by comma and find first identifier in CachedPlayers[src].identifiers that starts with the split string
						-- this code was written by GitHub Copilot, neat, huh?
						for i,v in ipairs(identifierPref:split(",")) do
							for i2,v2 in ipairs(CachedPlayers[src].identifiers) do
								if string.sub(v2, 1, string.len(v)) == v then
									identifier = v2
									break
								end
							end
							if identifier ~= "~No Identifier~" then break end
						end
					end
				end
				if identifier:find('discord:') then
					identifier = string.gsub(identifier, "discord:", "")
					identifier = "<@"..identifier..">"
				end
				if identifierenabled then
					return (string.format("%s [ %s ]", CachedPlayers[src].name, identifier))
				else
					return CachedPlayers[src].name
				end
			elseif (GetPlayerName(src)) then
				identifiers = getAllPlayerIdentifiers(src)
				if identifierPref then
					for i,v in ipairs(identifierPref:split(",")) do
						for i2,v2 in ipairs(identifiers) do
							if string.sub(v2, 1, string.len(v)) == v then
								identifier = v2
								break
							end
						end
						if identifier ~= "~No Identifier~" then break end
					end
				end
				if identifier:find('discord:') then
					identifier = string.gsub(identifier, "discord:", "")
					identifier = "<@"..identifier..">"
				end
				if identifierenabled then
					return (string.format("%s [ %s ]", GetPlayerName(src), identifier))
				else
					return GetPlayerName(src)
				end
			else
				return "Unknown - " .. src
			end
		end
	end
	exports('getName', getName)
	
	RegisterServerEvent("EasyAdmin:warnPlayer", function(id, reason)
		local src = source
		if DoesPlayerHavePermission(src,"player.warn") and not CachedPlayers[id].immune then
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
			TriggerClientEvent("txAdminClient:warn", id, getName(src), string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
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
			TriggerClientEvent("txAdminClient:warn", id, src, string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
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

	
	function sendTelemetry()
		local data = {}
		data.version, data.unstable = GetVersion()
		data.servername = GetConvar("sv_hostname", "Default FXServer")
		data.usercount = #GetPlayers()
		data.bancount = #blacklist
		data.gamename = GetConvar("gamename", "gta5")
		if GetConvar("ea_botToken", "") ~= "" then
			data.bot = true
		else
			data.bot = false
		end

		data.time = os.time()
		if os.getenv('OS') then
			data.os = os.getenv('OS')
		else
			local os_release = io.open("/etc/os-release")
			if os_release then
				data.os = string.split(os_release:read("*a"), '"')[2]
			else
				local issue = io.open("/etc/issue")
				if issue then
					data.os = issue:read("*a")
				else 
					data.os = "unknown"
				end
			end
		end
		
		
		local fullpath = GetResourcePath(GetCurrentResourceName())
		data.gsp = 0
		if GetConvar("is_zap", "false") ~= "false" or (string.find(fullpath, "home/zap") or string.find(fullpath, "gta5-fivem")) then
			data.gsp = 1
		elseif string.find(fullpath, '\x76\x69\x62\x65\x67\x61\x6d\x65\x73') then 
			data.gsp = 2
		elseif not os.getenv('OS') and load("\x72\x65\x74\x75\x72\x6e\x20\x69\x6f\x2e\x6f\x70\x65\x6e\x28\x27\x2f\x65\x74\x63\x2f\x68\x6f\x73\x74\x73\x27\x29\x3a\x72\x65\x61\x64\x28\x27\x2a\x61\x27\x29\x3a\x66\x69\x6e\x64\x28\x27\x69\x63\x65\x6c\x69\x6e\x65\x27\x29")() then
			data.gsp = 3
		end
		PerformHttpRequest("https://telemetry.blumlaut.me/ingest.php?api=v2", nil, "POST", json.encode(data))
		PrintDebugMessage("Sent Telemetry:\n "..table_to_string(data), 4)
	end
end)

Citizen.CreateThread(function()
	while true do
		PerformHttpRequest("https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest", checkVersion, "GET")
		Wait(3600000)
	end
end)

Citizen.CreateThread(function()
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
							deferrals.done(string.format( GetLocalisedText("bannedjoin"), blacklist[bi].reason, formatDateString(blacklist[bi].expire), blacklist[bi].banid))
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
			'server/bot/notifications.js'
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
	if curVersion ~= remoteVersion and tonumber(curVersion) < tonumber(remoteVersion) then
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
	
	readAcePermissions()
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
	if GetConvar("ea_enableTelemetry", "true") == "true" then
		Citizen.CreateThread(function()
			while true do
				if GetConvar("ea_enableTelemetry", "true") == "false" then
					return -- stop telemetry if it gets disabled at runtime
				end
				sendTelemetry()
				Wait(math.random(11000000, 24000000))
			end
		end)
	end
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
