players = {}
banlist = {}
banlist.reasons = {}
permissions = {
	ban = false,
	kick = false,
	spectate = false,
	unban = false,
	teleport = false,
}

RegisterNetEvent("EasyAdmin:adminresponse")
RegisterNetEvent("EasyAdmin:amiadmin")
RegisterNetEvent("EasyAdmin:fillBanlist")
RegisterNetEvent("EasyAdmin:requestSpectate")

RegisterNetEvent("EasyAdmin:SetSetting")


AddEventHandler('EasyAdmin:adminresponse', function(response,permission)
	permissions[response] = permission
	if permission == true then
		isAdmin = true
	end
end)

AddEventHandler('EasyAdmin:SetSetting', function(setting,state)
	settings[setting] = state
end)


AddEventHandler("EasyAdmin:fillBanlist", function(thebanlist,thebanlistreasons)
	banlist = thebanlist
	banlist.reasons = thebanlistreasons
end)

Citizen.CreateThread( function()
	while true do
		Citizen.Wait(0)
			players = {}
			for i = 0, 31 do
			if NetworkIsPlayerActive( i ) then
				table.insert( players, i )
			end
		end
	end
end)

AddEventHandler('EasyAdmin:requestSpectate', function(playerId)
	spectatePlayer(GetPlayerPed(playerId),GetPlayerName(playerId))
end)

function spectatePlayer(target,name)
	local playerPed = PlayerPedId() -- yourself
	enable = true
	if target == playerPed then enable = false end

	if(enable)then

			local targetx,targety,targetz = table.unpack(GetEntityCoords(target, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(true, target)



		ShowNotification("Spectating ~b~<C>"..name.."</C>.")
	else

			local targetx,targety,targetz = table.unpack(GetEntityCoords(target, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(false, target)


		ShowNotification("Stopped Spectating.")
	end
end

function ShowNotification(text)
	SetNotificationTextEntry("STRING")
	AddTextComponentString(text)
	DrawNotification(0,1)
end
