players = {}
banlist = {}
banlist.reasons = {}

RegisterNetEvent("adminresponse")
RegisterNetEvent("Z:playerUpdate")
RegisterNetEvent("amiadmin")
RegisterNetEvent("fillBanlist")

AddEventHandler('adminresponse', function(response)
isAdmin = response
TriggerServerEvent("updateBanlist")
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


function spectatePlayer(target,name)
	local playerPed = GetPlayerPed(-1) -- yourself
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