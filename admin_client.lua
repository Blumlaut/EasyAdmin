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
	if permissions.ban then
		cachedplayers = thecached
	end
end)

AddEventHandler("EasyAdmin:GetPlayerList", function(players)
	playerlist = players
end)

AddEventHandler("EasyAdmin:GetInfinityPlayerList", function(players)
	playerlist = players
end)

Citizen.CreateThread( function()
  while true do
    Citizen.Wait(0)
		if frozen then
			FreezeEntityPosition(PlayerPedId(), frozen)
			if IsPedInAnyVehicle(PlayerPedId(), true) then
				FreezeEntityPosition(GetVehiclePedIsIn(PlayerPedId(), false), frozen)
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
	local adminPed = localPlayerPed
	local playerId = GetPlayerFromServerId(playerServerId)
	repeat
		Wait(200)
		playerId = GetPlayerFromServerId(playerServerId)
	until ((GetPlayerPed(playerId) > 0) and (playerId ~= -1))
	spectatePlayer(GetPlayerPed(playerId),playerId,GetPlayerName(playerId))
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
	if (target == PlayerId() or target == -1) then enable = false end
	if(enable)then
			if targetPed == playerPed then
				Wait(500)
				targetPed = GetPlayerPed(target)
			end
			local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(true, targetPed)

			DrawPlayerInfo(target)
			if not RedM then
				ShowNotification(string.format(GetLocalisedText("spectatingUser"), name))
			end
	else
			if oldCoords then
				RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
				Wait(500)
				SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
				oldCoords=nil
			end
			NetworkSetInSpectatorMode(false, targetPed)
			StopDrawPlayerInfo()
			if not RedM then
				ShowNotification(GetLocalisedText("stoppedSpectating"))
			end
			frozen = false

	end
end

function ShowNotification(text)
	SetNotificationTextEntry("STRING")
	AddTextComponentString(text)
	DrawNotification(0,1)
end
