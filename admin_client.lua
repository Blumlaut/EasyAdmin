------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
------------------------------------
------------------------------------

players = {}
banlist = {}
cachedplayers = {}

RegisterNetEvent("EasyAdmin:adminresponse")
RegisterNetEvent("EasyAdmin:amiadmin")
RegisterNetEvent("EasyAdmin:fillBanlist")
RegisterNetEvent("EasyAdmin:requestSpectate")

RegisterNetEvent("EasyAdmin:SetSetting")
RegisterNetEvent("EasyAdmin:SetLanguage")

RegisterNetEvent("EasyAdmin:TeleportRequest")
RegisterNetEvent("EasyAdmin:SlapPlayer")
RegisterNetEvent("EasyAdmin:FreezePlayer")
RegisterNetEvent("EasyAdmin:CaptureScreenshot")
RegisterNetEvent("EasyAdmin:GetPlayerList")
RegisterNetEvent("EasyAdmin:GetInfinityPlayerList")
RegisterNetEvent("EasyAdmin:fillCachedPlayers")
RegisterNetEvent("EasyAdmin:toggleNoclip")


AddEventHandler('EasyAdmin:adminresponse', function(response,permission)
	permissions[response] = permission
	if permission == true then
		isAdmin = true
	end
end)

AddEventHandler('EasyAdmin:SetSetting', function(setting,state)
	settings[setting] = state
end)

AddEventHandler('EasyAdmin:SetLanguage', function(newstrings)
	strings = newstrings
end)


AddEventHandler("EasyAdmin:fillBanlist", function(thebanlist)
	banlist = thebanlist
end)

AddEventHandler("EasyAdmin:fillCachedPlayers", function(thecached)
	if permissions["ban.temporary"] or permissions["ban.permanent"] then
		cachedplayers = thecached
	end
end)

AddEventHandler("EasyAdmin:GetPlayerList", function(players)
	playerlist = players
end)

AddEventHandler("EasyAdmin:GetInfinityPlayerList", function(players)
	playerlist = players
end)


AddEventHandler("EasyAdmin:toggleNoclip", function(toggle)
	if toggle == nil then toggle = not NoclipActive end
	if toggle == true then
		NoclipActive = true
	elseif toggle == false then
		NoclipActive = false
		local pPed = PlayerPedId()
		local veh = GetVehiclePedIsIn(pPed, false)
		local vehDriver = GetPedInVehicleSeat(veh, -1)
		local entity = pPed
		if (veh and veh > 0 and vehDriver == pPed) then
			entity = veh
		end
		FreezeEntityPosition(entity, false)
		SetEntityVelocity(entity, 0, 0, 0)
		SetEntityRotation(entity, 0, 0, 0, 0, false)
		SetEntityHeading(entity, heading)
		SetEntityCollision(entity, true, true)
		SetEveryoneIgnorePlayer(pPed, false)
		SetPoliceIgnorePlayer(pPed, false)
		SetEntityInvincible(pPed, false)
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
		end

		if NoclipActive then
			local pPed = PlayerPedId()
			local pCoords = GetEntityCoords(pPed)
			local veh = GetVehiclePedIsIn(pPed, false)
			local vehDriver = GetPedInVehicleSeat(veh, -1)
			local speedLevels = {0.5,1.5,4.0, 10.0, 20.0}
			speedLevel = speedLevel or 1
			speed = speedLevels[speedLevel]
			local zoff,yoff = zoff or 0,yoff or 0 -- yiff?
			local entity = pPed
			if (veh and veh > 0 and vehDriver == pPed) then
				entity = veh
				FreezeEntityPosition(veh, true)
			else
				FreezeEntityPosition(pPed, true)
			end
			
			local heading = GetEntityHeading(entity)
		
			
			if not scaleform or not HasScaleformMovieLoaded(scaleform) then
				scaleform = RequestScaleformMovie("INSTRUCTIONAL_BUTTONS")
				repeat
					Wait(0)
				until HasScaleformMovieLoaded(scaleform)
			end
			
			BeginScaleformMovieMethod(scaleform, "CLEAR_ALL")
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(0)
			PushScaleformMovieMethodParameterString("~INPUT_SPRINT~")
			PushScaleformMovieMethodParameterString(string.format(GetLocalisedText("noclipchangespeed"), speed))
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(1)
			PushScaleformMovieMethodParameterString("~INPUT_MOVE_LR~")
			PushScaleformMovieMethodParameterString(GetLocalisedText("noclipturn"))
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(2)
			PushScaleformMovieMethodParameterString("~INPUT_MOVE_UD~")
			PushScaleformMovieMethodParameterString(GetLocalisedText("noclipmove"))
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(3)
			PushScaleformMovieMethodParameterString("~INPUT_MULTIPLAYER_INFO~")
			PushScaleformMovieMethodParameterString(GetLocalisedText("noclipdown"))
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(4)
			PushScaleformMovieMethodParameterString("~INPUT_COVER~")
			PushScaleformMovieMethodParameterString(GetLocalisedText("noclipup"))
			EndScaleformMovieMethod()
			
			
			BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
			ScaleformMovieMethodAddParamInt(5)
			PushScaleformMovieMethodParameterString(GetControlInstructionalButton(0, 206, 1))
			PushScaleformMovieMethodParameterString(GetLocalisedText("noclipdisable"))
			EndScaleformMovieMethod()
			
			BeginScaleformMovieMethod(scaleform, "DRAW_INSTRUCTIONAL_BUTTONS")
			ScaleformMovieMethodAddParamInt(0)
			EndScaleformMovieMethod()
			
			DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, 0)
			
			
			if IsControlPressed(0, 34) then
				heading = heading+2
			end
			if IsControlPressed(0, 35) then
				heading = heading-2
			end
			if IsControlPressed(0, 32) then
				yoff = 0.5
			end
			if IsControlPressed(0, 33) then
				yoff = -0.5
			end
			if IsControlPressed(0, 44) then
				zoff = 0.21+(speedLevel/100)
			end
			if IsControlPressed(0, 20) then
				zoff = -0.21-(speedLevel/100)
			end
			if IsControlJustPressed(0, 21) then
				if speedLevel < #speedLevels then
					speedLevel=speedLevel+1
				else
					speedLevel=1
				end
			end
				


			DisableControlAction(1, 75, true) -- exit vehicle
			--for i=30, 31,1 do
			--	DisableControlAction(1, i, true) -- walking/driving
			--end
			for i=266, 278,1 do
				DisableControlAction(1, i, true) -- walking/driving
			end
			
			local currentSpeed = speed
			currentSpeed = currentSpeed / (1 / GetFrameTime()) * 60
			newPos = GetOffsetFromEntityInWorldCoords(entity, 0, yoff * (currentSpeed + 0.3), zoff * (currentSpeed + 0.3))
			
			SetEntityVelocity(entity, 0, 0, 0)
			SetEntityRotation(entity, 0, 0, 0, 0, false)
			SetEntityHeading(entity, heading)
			SetEntityCollision(entity, false, false)
			SetEntityCoordsNoOffset(entity, newPos.x, newPos.y, newPos.z, true, true, true)
			SetEveryoneIgnorePlayer(pPed, true)
			SetPoliceIgnorePlayer(pPed, true)
			SetEntityInvincible(pPed, true)
			
			if IsControlPressed(0, 206) then
				NoclipActive = false
				FreezeEntityPosition(entity, false)
				SetEntityVelocity(entity, 0, 0, 0)
				SetEntityRotation(entity, 0, 0, 0, 0, false)
				SetEntityHeading(entity, heading)
				SetEntityCollision(entity, true, true)
				SetEveryoneIgnorePlayer(pPed, false)
				SetPoliceIgnorePlayer(pPed, false)
				SetEntityInvincible(pPed, false)
			end
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
		EndTextCommandThefeedPostTicker(important,0)
	end
end)