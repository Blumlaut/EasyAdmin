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
MessageShortcuts = {}
FrozenPlayers = {}
MutedPlayers = {}

local vehicleInfo = {
	netId = nil,
	seat = nil,
}

RegisterNetEvent("EasyAdmin:adminresponse", function(perms)
	permissions = perms

	for perm, val in pairs(perms) do
		if val == true then
			isAdmin = true
		end
	end
end)

RegisterNetEvent("EasyAdmin:SetSetting", function(setting,state)
	settings[setting] = state
end)

if not RedM then
	RegisterKeyMapping('easyadmin', 'Open EasyAdmin', 'keyboard', "")
end

AddEventHandler('EasyAdmin:SetLanguage', function(newstrings)
	strings = newstrings
end)

RegisterNetEvent("EasyAdmin:fillBanlist", function(thebanlist)
	banlist = thebanlist
end)

RegisterNetEvent("EasyAdmin:fillCachedPlayers", function(thecached)
	if permissions["player.ban.temporary"] or permissions["player.ban.permanent"] then
		cachedplayers = thecached
	end
end)


RegisterNetEvent("EasyAdmin:GetInfinityPlayerList", function(players)
	playerlist = players
end)

RegisterNetEvent("EasyAdmin:getServerAces", function(aces,principals)
	add_aces = aces
	add_principals = principals
	PrintDebugMessage("Recieved ACE Permissions list", 4)
end)

RegisterNetEvent("EasyAdmin:SetLanguage", function()
	if permissions["server.permissions.read"] then
		TriggerServerEvent("EasyAdmin:getServerAces")
	end
end)

RegisterNetEvent("EasyAdmin:NewReport", function(reportData)
	reports[reportData.id] = reportData
end)

RegisterNetEvent("EasyAdmin:ClaimedReport", function(reportData)
	reports[reportData.id] = reportData
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		for i, menu in pairs(reportMenus) do
			for o,item in pairs(menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("claimreport") then
					setMenuItemTitle(item, GetLocalisedText("claimedby"))
					item:RightLabel(reportData.claimedName)
				end
			end
		end
	end
end)

RegisterNetEvent("EasyAdmin:RemoveReport", function(reportData)
	reports[reportData.id] = nil 
end)


RegisterNetEvent("EasyAdmin:fillShortcuts", function (shortcuts)
	MessageShortcuts = shortcuts
end)

RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(player,state)
	FrozenPlayers[player] = state
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		if playerMenus[tostring(player)].menu then
			for o,item in pairs(playerMenus[tostring(player)].menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("setplayerfrozen") then
					item.Checked = state
				end
			end
		end
	end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(player,state)
	MutedPlayers[player] = state
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		if playerMenus[tostring(player)].menu then
			for o,item in pairs(playerMenus[tostring(player)].menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("mute") then
					item.Checked = state
				end
			end
		end
	end
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

RegisterNetEvent("EasyAdmin:requestSpectate", function(playerServerId, tgtCoords)
	local localPlayerPed = PlayerPedId()

	if IsPedInAnyVehicle(localPlayerPed) then
		local vehicle = GetVehiclePedIsIn(localPlayerPed, false)
		local numVehSeats = GetVehicleModelNumberOfSeats(GetEntityModel(vehicle))
		vehicleInfo.netId = VehToNet(vehicle)
		for i = -1, numVehSeats do
			if GetPedInVehicleSeat(vehicle, i) == localPlayerPed then
				vehicleInfo.seat = i
				break
			end
		end
	end

	if ((not tgtCoords) or (tgtCoords.z == 0.0)) then tgtCoords = GetEntityCoords(GetPlayerPed(GetPlayerFromServerId(playerServerId))) end
	if playerServerId == GetPlayerServerId(PlayerId()) then 
		if oldCoords then
			RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
			Wait(500)
			SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
			oldCoords=nil
		end
		spectatePlayer(localPlayerPed,GetPlayerFromServerId(PlayerId()),GetPlayerName(PlayerId()))
		frozen = false
		return 
	else
		if not oldCoords then
			oldCoords = GetEntityCoords(localPlayerPed)
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
	RegisterNetEvent("EasyAdmin:requestCleanup", function(type)
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
		TriggerEvent("EasyAdmin:showNotification", string.format(GetLocalisedText("finishedcleaning"), GetLocalisedText(type)))
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


RegisterNetEvent("EasyAdmin:TeleportPlayerBack", function(id, tgtCoords)
	if lastLocation then
		SetEntityCoords(PlayerPedId(), lastLocation,0,0,0, false)
		lastLocation=nil
	end
end)

RegisterNetEvent("EasyAdmin:TeleportRequest", function(id, tgtCoords)
	if id then
		if (tgtCoords.x == 0.0 and tgtCoords.y == 0.0 and tgtCoords.z == 0.0) then
			local tgtPed = GetPlayerPed(GetPlayerFromServerId(id))
			tgtCoords = GetEntityCoords(tgtPed)
		end
		lastLocation = tgtCoords
		SetEntityCoords(PlayerPedId(), tgtCoords,0,0,0, false)
	else
		lastLocation = tgtCoords
		SetEntityCoords(PlayerPedId(), tgtCoords,0,0,0, false)
	end
end)

RegisterNetEvent("EasyAdmin:SlapPlayer", function(slapAmount)
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

RegisterNetEvent("EasyAdmin:FreezePlayer", function(toggle)
	frozen = toggle
	local playerPed = PlayerPedId()
	FreezeEntityPosition(playerPed, frozen)
	if IsPedInAnyVehicle(playerPed, false) then
		FreezeEntityPosition(GetVehiclePedIsIn(playerPed, false), frozen)
	end 
end)


RegisterNetEvent("EasyAdmin:CaptureScreenshot", function(toggle, url, field)
	exports['screenshot-basic']:requestScreenshotUpload(GetConvar("ea_screenshoturl", 'https://wew.wtf/upload.php'), GetConvar("ea_screenshotfield", 'files[]'), function(data)
		TriggerLatentServerEvent("EasyAdmin:TookScreenshot", 100000, data)
	end)
end)

function spectatePlayer(targetPed,target,name)
	local playerPed = PlayerPedId() -- yourself
	enable = true
	if (target == PlayerId() or target == -1) then 
		enable = false
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
		TriggerEvent("EasyAdmin:showNotification", string.format(GetLocalisedText("spectatingUser"), name))
	else
		if oldCoords then
			RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
			Wait(500)
			SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
			oldCoords=nil
		end
		NetworkSetInSpectatorMode(false, targetPed)
		StopDrawPlayerInfo()
		TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("stoppedSpectating"))
		frozen = false
		Citizen.Wait(200) -- to prevent staying invisible
		SetEntityVisible(playerPed, true, 0)
		SetEntityCollision(playerPed, true, true)
		SetEntityInvincible(playerPed, false)
		NetworkSetEntityInvisibleToNetwork(playerPed, false)
		if vehicleInfo.netId and vehicleInfo.seat then
			local vehicle = NetToVeh(vehicleInfo.netId)
			if DoesEntityExist(vehicle) then
				if IsVehicleSeatFree(vehicle, vehicleInfo.seat) then
					SetPedIntoVehicle(playerPed, vehicle, vehicleInfo.seat)
				else
					TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("spectatevehicleseatoccupied"))
				end
			else
				TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("spectatenovehiclefound"))
			end

			vehicleInfo.netId = nil
			vehicleInfo.seat = nil
		end
	end
end

function ShowNotification(text)
	if not RedM then
		local notificationTxd = CreateRuntimeTxd("easyadmin_notification")
		CreateRuntimeTextureFromImage(notificationTxd, 'small_logo', 'dependencies/images/small-logo-bg.png')
		BeginTextCommandThefeedPost("STRING")
		AddTextComponentSubstringPlayerName(text)

		local title = "~bold~EasyAdmin"
		local subtitle = GetLocalisedText("notification")
		local iconType = 0
		local flash = false

		EndTextCommandThefeedPostMessagetext("easyadmin_notification", "small_logo", flash, iconType, title, subtitle)
		local showInBrief = false
		local blink = false
		EndTextCommandThefeedPostTicker(blink, showInBrief)

	else
		-- someone who has RedM installed please write some code for this
		
	end
end

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	TriggerEvent("EasyAdmin:receivedNotification")
	if not WasEventCanceled() then
		ShowNotification(text)
	end
end)