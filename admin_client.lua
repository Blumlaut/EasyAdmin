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
	cachedplayers = thecached
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

AddEventHandler('EasyAdmin:requestSpectate', function(playerId, tgtCoords)
	local oldCoords = GetEntityCoords(PlayerPedId())
	local playerId = GetPlayerFromServerId(playerId)
	if not tgtCoords or tgtCoords.z == 0 then tgtCoords = GetEntityCoords(GetPlayerPed(playerId)) end
	if GetPlayerPed(playerId) == PlayerPedId() then return end
	frozen = true
	SetEntityCoords(PlayerPedId(), tgtCoords.x, tgtCoords.y, tgtCoords.z - 10.0, 0, 0, 0, false)
	Wait(500)
	local adminPed = PlayerPedId()
	spectatePlayer(GetPlayerPed(playerId),playerId,GetPlayerName(playerId))
	Wait(500)
	SetEntityCoords(PlayerPedId(), oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
end)

AddEventHandler('EasyAdmin:TeleportRequest', function(tgtCoords)
	SetEntityCoords(PlayerPedId(), tgtCoords.x, tgtCoords.y, tgtCoords.z,0,0,0, false)
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
	if targetPed == playerPed then enable = false end
	enable = true

	if(enable)then

			local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(true, targetPed)

			DrawPlayerInfo(target)
			if not RedM then
				ShowNotification(string.format(GetLocalisedText("spectatingUser"), name))
			end
	else
			local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
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
