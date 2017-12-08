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

RegisterNetEvent("adminresponse")
RegisterNetEvent("Z:playerUpdate")
RegisterNetEvent("amiadmin")
RegisterNetEvent("fillBanlist")
RegisterNetEvent("requestSpectate")

AddEventHandler('adminresponse', function(response,permission)
	permissions[response] = permission
	if permission == true then
		isAdmin = true
	end
end)


AddEventHandler("fillBanlist", function(thebanlist,thebanlistreasons)
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

AddEventHandler('requestSpectate', function(playerId)
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
