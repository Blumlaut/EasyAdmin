isAdmin = false
players = {}

RegisterNetEvent("adminresponse")
RegisterNetEvent("Z:playerUpdate")
RegisterNetEvent("amiadmin")

AddEventHandler('adminresponse', function(response)

isAdmin = response

end)






Citizen.CreateThread(function()
	local currentItemIndex = 1
	local selectedItemIndex = 1
	
	WarMenu.CreateMenu('admin', 'Admin Menu')
	WarMenu.CreateSubMenu('kickplayers', 'admin', 'Kick Player')
	WarMenu.CreateSubMenu('banplayers', 'admin', 'Ban Player')
	WarMenu.CreateSubMenu('spectateplayers', 'admin', 'Spectate Players')
	TriggerServerEvent("amiadmin")
	
	while true do
		if WarMenu.IsMenuOpened('admin') then
			if not isAdmin then
				WarMenu.CloseMenu()
			elseif isAdmin then
				if WarMenu.MenuButton('Kick Player', 'kickplayers') then
				
				elseif WarMenu.MenuButton('Ban Player', 'banplayers') then
				
				elseif WarMenu.MenuButton('Spectate Player', 'spectateplayers') then
				
				end
			end
		WarMenu.Display()
		elseif WarMenu.IsMenuOpened("kickplayers") then
		
		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'kickplayers') then
				TriggerServerEvent("kickPlayer", GetPlayerServerId( thePlayer ))
			end
		end
		WarMenu.Display()
		
		elseif WarMenu.IsMenuOpened("banplayers") then
		
		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'banplayers') then
				TriggerServerEvent("banPlayer", GetPlayerServerId( thePlayer ))
			end
		end
		WarMenu.Display()


		elseif WarMenu.IsMenuOpened("spectateplayers") then
		
		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'spectateplayers') then
				spectatePlayer(GetPlayerPed(thePlayer), GetPlayerName( thePlayer ))
			end
		end
		WarMenu.Display()

		elseif WarMenu.Button('Close') then
			WarMenu.CloseMenu()
		elseif IsControlJustReleased(0, 244) then --M by default
			WarMenu.OpenMenu('admin')
		end
		
		Citizen.Wait(0)
	end
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
		if (not IsScreenFadedOut() and not IsScreenFadingOut()) then
			DoScreenFadeOut(1000)
			while (not IsScreenFadedOut()) do
				Wait(0)
			end

			local targetx,targety,targetz = table.unpack(GetEntityCoords(target, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(true, target)

			if(IsScreenFadedOut()) then
				DoScreenFadeIn(1000)
			end
		end


		TriggerEvent("showNotification", "Spectating ~b~<C>"..name.."</C>.")
	else
		if(not IsScreenFadedOut() and not IsScreenFadingOut()) then
			DoScreenFadeOut(1000)
			while (not IsScreenFadedOut()) do
				Wait(0)
			end

			local targetx,targety,targetz = table.unpack(GetEntityCoords(target, false))

			RequestCollisionAtCoord(targetx,targety,targetz)
			NetworkSetInSpectatorMode(false, target)

			if(IsScreenFadedOut()) then
				DoScreenFadeIn(1000)
			end
		end

		TriggerEvent("showNotification", "Stopped Spectating ~b~<C>"..name.."</C>.")
	end
end


