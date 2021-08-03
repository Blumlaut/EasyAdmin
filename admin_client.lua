------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
------------------------------------
------------------------------------

players = {}
banlist = {}
cachedplayers = {}
reports = {}
add_aces, add_principals = {}, {}
RegisterNetEvent("EasyAdmin:adminresponse")
RegisterNetEvent("EasyAdmin:amiadmin")
RegisterNetEvent("EasyAdmin:fillBanlist")
RegisterNetEvent("EasyAdmin:requestSpectate")
RegisterNetEvent("EasyAdmin:requestCleanup")

RegisterNetEvent("EasyAdmin:SetSetting")
RegisterNetEvent("EasyAdmin:SetLanguage")

RegisterNetEvent("EasyAdmin:TeleportRequest")
RegisterNetEvent("EasyAdmin:SlapPlayer")
RegisterNetEvent("EasyAdmin:FreezePlayer")
RegisterNetEvent("EasyAdmin:CaptureScreenshot")
RegisterNetEvent("EasyAdmin:GetPlayerList")
RegisterNetEvent("EasyAdmin:GetInfinityPlayerList")
RegisterNetEvent("EasyAdmin:fillCachedPlayers")


AddEventHandler('EasyAdmin:adminresponse', function(perms)
	permissions = perms

	for perm, val in pairs(perms) do
		if val == true then
			isAdmin = true
		end
	end
end)

AddEventHandler('EasyAdmin:SetSetting', function(setting,state)
	settings[setting] = state
	if setting == "button" and state ~= "none" then
		if (not RedM and not tonumber(settings.button)) then
			RegisterKeyMapping('easyadmin', 'Open EasyAdmin', 'keyboard', settings.button)
		end
	end
end)

AddEventHandler('EasyAdmin:SetLanguage', function(newstrings)
	strings = newstrings
end)


AddEventHandler("EasyAdmin:fillBanlist", function(thebanlist)
	banlist = thebanlist
end)

AddEventHandler("EasyAdmin:fillCachedPlayers", function(thecached)
	if permissions["player.ban.temporary"] or permissions["player.ban.permanent"] then
		cachedplayers = thecached
	end
end)

AddEventHandler("EasyAdmin:GetPlayerList", function(players)
	playerlist = players
end)

AddEventHandler("EasyAdmin:GetInfinityPlayerList", function(players)
	playerlist = players
end)

RegisterNetEvent("EasyAdmin:getServerAces")
AddEventHandler("EasyAdmin:getServerAces", function(aces,principals)
	add_aces = aces
	add_principals = principals
	PrintDebugMessage("Recieved ACE Permissions list", 4)
end)

RegisterNetEvent("EasyAdmin:SetLanguage")
AddEventHandler("EasyAdmin:SetLanguage", function()
	if permissions["server.permissions.read"] then
		TriggerServerEvent("EasyAdmin:getServerAces")
	end
end)

RegisterNetEvent("EasyAdmin:NewReport")
AddEventHandler("EasyAdmin:NewReport", function(reportData)
	reports[reportData.id] = reportData
end)

RegisterNetEvent("EasyAdmin:RemoveReport")
AddEventHandler("EasyAdmin:RemoveReport", function(reportData)
	reports[reportData.id] = nil 
end)


Citizen.CreateThread( function()
	while true do
		Citizen.Wait(0)
		if frozen then
			local localPlayerPedId = PlayerPedId()
			FreezeEntityPosition(localPlayerPedId, frozen)
			if IsPedInAnyVehicle(localPlayerPedId, true) then
				FreezeEntityPosition(GetVehiclePedIsIn(localPlayerPedId, false), frozen)
			end 
		else
			Citizen.Wait(200)
		end
	end
end)

AddEventHandler('EasyAdmin:requestSpectate', function(playerServerId, tgtCoords)
	local localPlayerPed = PlayerPedId()
	if ((not tgtCoords) or (tgtCoords.z == 0.0)) then tgtCoords = GetEntityCoords(GetPlayerPed(GetPlayerFromServerId(playerServerId))) end
	if playerServerId == GetPlayerServerId(PlayerId()) then 
		if oldCoords then
			RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
			Wait(500)
			SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
			oldCoords=nil
		end
		spectatePlayer(GetPlayerPed(PlayerId()),GetPlayerFromServerId(PlayerId()),GetPlayerName(PlayerId()))
		frozen = false
		return 
	else
		if not oldCoords then
			oldCoords = GetEntityCoords(PlayerPedId())
		end
	end
	SetEntityCoords(localPlayerPed, tgtCoords.x, tgtCoords.y, tgtCoords.z - 10.0, 0, 0, 0, false)
	frozen = true
	stopSpectateUpdate = true
	local adminPed = localPlayerPed
	local playerId = GetPlayerFromServerId(playerServerId)
	repeat
		Wait(200)
		playerId = GetPlayerFromServerId(playerServerId)
	until ((GetPlayerPed(playerId) > 0) and (playerId ~= -1))
	spectatePlayer(GetPlayerPed(playerId),playerId,GetPlayerName(playerId))
	stopSpectateUpdate = false 
end)

Citizen.CreateThread(function()
	AddEventHandler('EasyAdmin:requestCleanup', function(type)
		if type == "cars" then
			
			local toDelete = GetGamePool("CVehicle")
			for _,veh in pairs(toDelete) do
				PrintDebugMessage("starting deletion for veh "..veh, 4)
				if DoesEntityExist(veh) then
					if not IsPedAPlayer(GetPedInVehicleSeat(veh, -1)) then
						if not NetworkHasControlOfEntity(veh) then
							local i=0
							repeat 
								NetworkRequestControlOfEntity(veh)
								i=i+1
								Wait(150)
							until (NetworkHasControlOfEntity(veh) or i==500)
						end
						PrintDebugMessage("deleting veh "..veh, 3)
						
						-- draw
						SetTextFont(2)
						SetTextColour(255, 255, 255, 200)
						SetTextProportional(1)
						SetTextScale(0.0, 0.6)
						SetTextDropshadow(0, 0, 0, 0, 255)
						SetTextEdge(1, 0, 0, 0, 255)
						SetTextDropShadow()
						SetTextOutline()
						SetTextEntry("STRING")
						AddTextComponentString(string.format(GetLocalisedText("cleaningcar"), veh))
						EndTextCommandDisplayText(0.45, 0.95)
						SetEntityAsNoLongerNeeded(veh)
						DeleteEntity(veh)
						Wait(1)
					end
				end
				toDelete[i] = nil
			end
		elseif type == "peds" then
			local toDelete = GetGamePool("CPed")
			for _,ped in pairs(toDelete) do
				PrintDebugMessage("starting deletion for ped "..ped, 4)
				if DoesEntityExist(ped) and not IsPedAPlayer(ped) then
					if not NetworkHasControlOfEntity(ped) then
						local i=0
						repeat 
							NetworkRequestControlOfEntity(ped)
							i=i+1
							Wait(150)
						until (NetworkHasControlOfEntity(ped) or i==500)
					end
					PrintDebugMessage("deleting ped "..ped, 3)
					
					-- draw
					SetTextFont(2)
					SetTextColour(255, 255, 255, 200)
					SetTextProportional(1)
					SetTextScale(0.0, 0.6)
					SetTextDropshadow(0, 0, 0, 0, 255)
					SetTextEdge(1, 0, 0, 0, 255)
					SetTextDropShadow()
					SetTextOutline()
					SetTextEntry("STRING")
					AddTextComponentString(string.format(GetLocalisedText("cleaningped"), ped))
					EndTextCommandDisplayText(0.45, 0.95)
					SetEntityAsNoLongerNeeded(ped)
					DeleteEntity(ped)
					Wait(1)
				end
				toDelete[i] = nil
			end
			
		elseif type == "props" then
			local toDelete = mergeTables(GetGamePool("CObject"), GetGamePool("CPickup"))
			for _,object in pairs(toDelete) do
				PrintDebugMessage("starting deletion for object "..object, 4)
				if DoesEntityExist(object) then
					if not NetworkHasControlOfEntity(object) then
						local i=0
						repeat 
							NetworkRequestControlOfEntity(object)
							i=i+1
							Wait(150)
						until (NetworkHasControlOfEntity(object) or i==500)
					end
					PrintDebugMessage("deleting object "..object, 3)
					
					-- draw
					SetTextFont(2)
					SetTextColour(255, 255, 255, 200)
					SetTextProportional(1)
					SetTextScale(0.0, 0.6)
					SetTextDropshadow(0, 0, 0, 0, 255)
					SetTextEdge(1, 0, 0, 0, 255)
					SetTextDropShadow()
					SetTextOutline()
					SetTextEntry("STRING")
					AddTextComponentString(string.format(GetLocalisedText("cleaningprop"), object))
					EndTextCommandDisplayText(0.45, 0.95)
					DetachEntity(object, false, false)
					if IsObjectAPickup(object) then 
						RemovePickup(object)
					end
					SetEntityAsNoLongerNeeded(object)
					DeleteEntity(object)
					Wait(1)
				end
				toDelete[i] = nil
			end
		end
		ShowNotification(string.format(GetLocalisedText("finishedcleaning"), GetLocalisedText(type)))
	end)
end)
Citizen.CreateThread( function()
	while true do
		Citizen.Wait(500)
		if drawInfo and not stopSpectateUpdate then
			local localPlayerPed = PlayerPedId()
			local targetPed = GetPlayerPed(drawTarget)
			local targetGod = GetPlayerInvincible(drawTarget)
			
			local tgtCoords = GetEntityCoords(targetPed)
			if tgtCoords and tgtCoords.x ~= 0 then
				SetEntityCoords(localPlayerPed, tgtCoords.x, tgtCoords.y, tgtCoords.z - 10.0, 0, 0, 0, false)
			end
		else
			Citizen.Wait(1000)
		end
	end
end)


AddEventHandler('EasyAdmin:TeleportRequest', function(id, tgtCoords)
	if id then
		if (tgtCoords.x == 0.0 and tgtCoords.y == 0.0 and tgtCoords.z == 0.0) then
			local tgtPed = GetPlayerPed(GetPlayerFromServerId(id))
			tgtCoords = GetEntityCoords(tgtPed)
		end
		SetEntityCoords(PlayerPedId(), tgtCoords.x, tgtCoords.y, tgtCoords.z,0,0,0, false)
	else
		SetEntityCoords(PlayerPedId(), tgtCoords.x, tgtCoords.y, tgtCoords.z,0,0,0, false)
	end
end)

AddEventHandler('EasyAdmin:SlapPlayer', function(slapAmount)
	local ped = PlayerPedId()
	if slapAmount > GetEntityHealth(ped) then
		ApplyDamageToPed(ped, 5000, false, true,true)
	else
		ApplyDamageToPed(ped, slapAmount, false, true,true)
	end
end)


RegisterCommand("kick", function(source, args, rawCommand)
	local source=source
	local reason = ""
	for i,theArg in pairs(args) do
		if i ~= 1 then -- make sure we are not adding the kicked player as a reason
			reason = reason.." "..theArg
		end
	end
	if args[1] and tonumber(args[1]) then
		TriggerServerEvent("EasyAdmin:kickPlayer", tonumber(args[1]), reason)
	end
end, false)

RegisterCommand("ban", function(source, args, rawCommand)
	if args[1] and tonumber(args[1]) then
		local reason = ""
		for i,theArg in pairs(args) do
			if i ~= 1 then
				reason = reason.." "..theArg
			end
		end
		if args[1] and tonumber(args[1]) then
			TriggerServerEvent("EasyAdmin:banPlayer", tonumber(args[1]), reason, false, GetPlayerName(args[1]))
		end
	end
end, false)

AddEventHandler('EasyAdmin:FreezePlayer', function(toggle)
	frozen = toggle
	FreezeEntityPosition(PlayerPedId(), frozen)
	if IsPedInAnyVehicle(PlayerPedId(), false) then
		FreezeEntityPosition(GetVehiclePedIsIn(PlayerPedId(), false), frozen)
	end 
end)


AddEventHandler('EasyAdmin:CaptureScreenshot', function(toggle, url, field)
	exports['screenshot-basic']:requestScreenshotUpload(GetConvar("ea_screenshoturl", 'https://wew.wtf/upload.php'), GetConvar("ea_screenshotfield", 'files[]'), function(data)
		TriggerServerEvent("EasyAdmin:TookScreenshot", data)
	end)
end)

function spectatePlayer(targetPed,target,name)
	local playerPed = PlayerPedId() -- yourself
	enable = true
	if (target == PlayerId() or target == -1) then 
		enable = false
		print("Target Player is ourselves, disabling spectate.")
	end
	if(enable)then
		SetEntityVisible(playerPed, false, 0)
		SetEntityCollision(playerPed, false, false)
		SetEntityInvincible(playerPed, true)
		NetworkSetEntityInvisibleToNetwork(playerPed, true)
		Citizen.Wait(200) -- to prevent target player seeing you
		if targetPed == playerPed then
			Wait(500)
			targetPed = GetPlayerPed(target)
		end
		local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))
		RequestCollisionAtCoord(targetx,targety,targetz)
		NetworkSetInSpectatorMode(true, targetPed)
		
		DrawPlayerInfo(target)
		ShowNotification(string.format(GetLocalisedText("spectatingUser"), name))
	else
		if oldCoords then
			RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
			Wait(500)
			SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
			oldCoords=nil
		end
		NetworkSetInSpectatorMode(false, targetPed)
		StopDrawPlayerInfo()
		ShowNotification(GetLocalisedText("stoppedSpectating"))
		frozen = false
		Citizen.Wait(200) -- to prevent staying invisible
		SetEntityVisible(playerPed, true, 0)
		SetEntityCollision(playerPed, true, true)
		SetEntityInvincible(playerPed, false)
		NetworkSetEntityInvisibleToNetwork(playerPed, false)
	end
end

function ShowNotification(text)
	if not RedM then
		SetNotificationTextEntry("STRING")
		AddTextComponentString(text)
		DrawNotification(0,1)
	else
		-- someone who has RedM installed please write some code for this
		
	end
end
RegisterNetEvent("EasyAdmin:showNotification")
AddEventHandler("EasyAdmin:showNotification", function(text, important)
	if not RedM then
		BeginTextCommandThefeedPost("STRING")
		AddTextComponentString(text)
		EndTextCommandThefeedPostTicker(important or false,0)
	end
end)
