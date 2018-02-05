isAdmin = false
showLicenses = false

settings = {
	button = 289,
	forceShowGUIButtons = false,
}

Citizen.CreateThread(function()
	local currentItemIndex = 1
	local selectedItemIndex = 1

	WarMenu.CreateMenu('admin', 'Admin Menu')
	WarMenu.CreateSubMenu('kickplayers', 'admin', 'Kick Player')
	WarMenu.CreateSubMenu('banplayers', 'admin', 'Ban Player')
	WarMenu.CreateSubMenu('unbanplayers', 'admin', 'Unban Player')
	WarMenu.CreateSubMenu('spectateplayers', 'admin', 'Spectate Players')
	WarMenu.CreateSubMenu('teleporttoplayer', 'admin', 'Teleport to Player')
	WarMenu.CreateSubMenu('settings', 'admin', 'Settings')
	TriggerServerEvent("EasyAdmin:amiadmin")




	while true do
		if WarMenu.IsMenuOpened('admin') then
			if isAdmin == false then
				WarMenu.CloseMenu()
			elseif isAdmin == true then
				if (permissions.kick or settings.forceShowGUIButtons) and WarMenu.MenuButton('Kick Player', 'kickplayers') then

				elseif (permissions.ban or settings.forceShowGUIButtons) and WarMenu.MenuButton('Ban Player', 'banplayers') then

				elseif (permissions.spectate or settings.forceShowGUIButtons) and WarMenu.MenuButton('Spectate Player', 'spectateplayers') then

				elseif (permissions.teleport or settings.forceShowGUIButtons) and WarMenu.MenuButton('Teleport to Player', 'teleporttoplayer') then

				elseif (permissions.unban or settings.forceShowGUIButtons) and WarMenu.MenuButton('Unban Player', "unbanplayers") then

				elseif WarMenu.MenuButton('Settings', "settings") then

				elseif WarMenu.Button('Close') then
					WarMenu.CloseMenu()
				end
			end
		WarMenu.Display()
		elseif WarMenu.IsMenuOpened("kickplayers") then

		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'kickplayers') then

				DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)

				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end

				local result = GetOnscreenKeyboardResult()

				if result then
					TriggerServerEvent("EasyAdmin:kickPlayer", GetPlayerServerId( thePlayer ), result)
				end
			end
		end
		WarMenu.Display()

		elseif WarMenu.IsMenuOpened("banplayers") then

		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'banplayers') then
				DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)

				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end

				local result = GetOnscreenKeyboardResult()


				if result then
					TriggerServerEvent("EasyAdmin:banPlayer", GetPlayerServerId( thePlayer ), result)
				end
			end
		end
		WarMenu.Display()


		elseif WarMenu.IsMenuOpened("spectateplayers") then

		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'spectateplayers') then
				TriggerServerEvent("EasyAdmin:requestSpectate",thePlayer)
			end
		end
		WarMenu.Display()

		elseif WarMenu.IsMenuOpened("teleporttoplayer") then

		for i,thePlayer in ipairs(players) do
			if WarMenu.MenuButton("["..GetPlayerServerId( thePlayer ).."] "..GetPlayerName( thePlayer ), 'teleporttoplayer') then
				local x,y,z = table.unpack(GetEntityCoords(GetPlayerPed(thePlayer),true))
				local heading = GetEntityHeading(GetPlayerPed(player))
				SetEntityCoords(PlayerPedId(), x,y,z,0,0,heading, false)
			end
		end
		WarMenu.Display()

		elseif WarMenu.IsMenuOpened("unbanplayers") then

		for i,theBanned in ipairs(banlist) do
			if showLicenses then
				if WarMenu.Button(theBanned) then
					TriggerServerEvent("EasyAdmin:unbanPlayer", theBanned)
					TriggerServerEvent("EasyAdmin:updateBanlist")
					Citizen.Trace("unbanning user")
				end
			else
				if WarMenu.Button(banlist.reasons[i]) then
					TriggerServerEvent("EasyAdmin:unbanPlayer", theBanned)
					Citizen.Trace("unbanning user")
					TriggerServerEvent("EasyAdmin:updateBanlist")
				end
			end
		end
		WarMenu.Display()

		elseif WarMenu.IsMenuOpened("settings") then
			if showLicenses then
				sl = "Licenses"
			else
				sl = "Reasons"
			end
			if WarMenu.Button("Banlist: Show Licenses/Reasons", sl) then
				showLicenses = not showLicenses
			elseif WarMenu.Button('Refresh Banlist') then
				TriggerServerEvent("EasyAdmin:updateBanlist")
			elseif WarMenu.Button('Refresh Permissions') then
				TriggerServerEvent("amiadmin")
			end

		WarMenu.Display()



		elseif IsControlJustReleased(0, settings.button) and isAdmin == true then --M by default
			WarMenu.OpenMenu('admin')
		end

		Citizen.Wait(0)
	end
end)

function DrawPlayerInfo(target)
	drawTarget = target
	drawInfo = true
end

function StopDrawPlayerInfo()
	drawInfo = false
	drawTarget = 0
end



Citizen.CreateThread( function()
	while true do
		Citizen.Wait(0)
		if drawInfo then
			local text = ""
			-- godmode checks
			text=text.."\nGodmode:"
			local targetPed = GetPlayerPed(drawTarget)
			local targetGod = GetPlayerInvincible(drawTarget)
			if targetGod then
				text=text.."~r~Yes~w~"
			else
				text=text.."~g~No~w~"
			end
			-- health info
			text=text.."\nHealth: "..GetEntityHealth(targetPed).."/"..GetEntityMaxHealth(targetPed)
			text=text.."\nArmor: "..GetPedArmour(targetPed)
			text=text.."\nStamina: "..GetPlayerSprintStaminaRemaining(target)
			-- misc info
			text=text.."\nWanted level: "..GetPlayerWantedLevel(target)


			SetTextFont(0)
	    SetTextProportional(1)
	    SetTextScale(0.0, 0.30)
	    SetTextDropshadow(0, 0, 0, 0, 255)
	    SetTextEdge(1, 0, 0, 0, 255)
	    SetTextDropShadow()
	    SetTextOutline()
	    SetTextEntry("STRING")
	    AddTextComponentString(text)
	    DrawText(0.05, 0.05)

		end
	end
end)


