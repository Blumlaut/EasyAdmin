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

RegisterServerEvent("EasyAdmin:JoinPlayerRoutingBucket", function(playerId)
	if DoesPlayerHavePermission(source, "player.bucket") then
		SetPlayerRoutingBucket(source, GetPlayerRoutingBucket(playerId))
	end
end)

RegisterServerEvent("EasyAdmin:ForcePlayerRoutingBucket", function(playerId)
	if DoesPlayerHavePermission(source, "player.bucket") and CanTargetPlayerForModeration(source, playerId) then
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
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('admincleanedup'), getName(source, false, true), type, radius), "cleanup", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:SetGameType", function(text)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..text, 3)
		SetGameType(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), "gametype", text), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:SetMapName", function(text)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..text, 3)
		SetMapName(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), "mapname", text), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:StartResource", function(text)
	if DoesPlayerHavePermission(source, "server.resources.start") then
		PrintDebugMessage("Player "..getName(source,true).." started Resource "..text, 3)
		StartResource(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminstartedresource'), getName(source, false, true), text), "settings", 65280)
	end
end)

RegisterServerEvent("EasyAdmin:StopResource", function(text)
	if DoesPlayerHavePermission(source, "server.resources.stop") then
		PrintDebugMessage("Player "..getName(source,true).." stopped Resource "..text, 3)
		StopResource(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminstoppedresource'), getName(source, false, true), text), "settings", 16711680)
	end
end)

RegisterServerEvent("EasyAdmin:SetConvar", function(convarname, convarvalue)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set convar "..convarname.. " to "..convarvalue, 3)
		SetConvar(convarname, convarvalue)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminchangedconvar'), getName(source, false, true), convarname, convarvalue), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:Announce", function(text)
	if DoesPlayerHavePermission(source, "server.announce") then
		PrintDebugMessage("Player "..getName(source,true).." sent a announcement: "..text, 3)
		announce(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('adminannouncement'), getName(source, false, true), text), "settings", 16777214)
	end
end)

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
