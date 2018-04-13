isAdmin = false
showLicenses = false

settings = {
	button = 289,
	forceShowGUIButtons = false,
}

_menuPool = NativeUI.CreatePool()
mainMenu = NativeUI.CreateMenu("Admin Menu", "~b~Admin Menu")
_menuPool:Add(mainMenu)



Citizen.CreateThread(function()
	local currentItemIndex = 1
	local selectedItemIndex = 1
	NativeUI.CreatePool()
	TriggerServerEvent("EasyAdmin:amiadmin")
	TriggerServerEvent("EasyAdmin:updateBanlist")
	
	
	
	while true do
		_menuPool:ProcessMenus()
		if IsControlJustReleased(0, settings.button) and isAdmin == true then --M by default
			-- clear and re-create incase of permission change+player count change
			GenerateMenu()
			mainMenu:Visible(not mainMenu:Visible())
		end
		
		Citizen.Wait(1)
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

function GenerateMenu() -- this is a big ass function
	mainMenu:Clear()
	playermanagement = _menuPool:AddSubMenu(mainMenu, "Player Management")
	servermanagement = _menuPool:AddSubMenu(mainMenu, "Server Management")
	settingsMenu = _menuPool:AddSubMenu(mainMenu, "Settings")
	
	-- show menu
	
	-- util stuff
	
	for i = 0, 256, 1 do
		if NetworkIsPlayerActive(i) then
			thisPlayer = _menuPool:AddSubMenu(playermanagement,"["..GetPlayerServerId(i).."] "..GetPlayerName(i))
			-- generate specific menu stuff, dirty but it works for now
			if permissions.kick then
				local thisItem = NativeUI.CreateItem("Kick Player","")
				thisPlayer:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
					
					while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
						Citizen.Wait( 0 )
					end
					
					local result = GetOnscreenKeyboardResult()
					
					if result then
						TriggerServerEvent("EasyAdmin:kickPlayer", GetPlayerServerId( i ), result)
					end
				end
			end
			
			if permissions.ban then
				local thisItem = NativeUI.CreateItem("Ban Player","~r~~h~NOTE:~h~~w~ Pressing Confirm will ban this Player.")
				thisPlayer:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
					
					while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
						Citizen.Wait( 0 )
					end
					
					local result = GetOnscreenKeyboardResult()
					
					if result then
						TriggerServerEvent("EasyAdmin:banPlayer", GetPlayerServerId( i ), result)
					end
				end
			end
			
			if permissions.spectate then
				local thisItem = NativeUI.CreateItem("Spectate Player", "")
				thisPlayer:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					TriggerServerEvent("EasyAdmin:requestSpectate",i)
				end
			end
			
			if permissions.teleport then
				local thisItem = NativeUI.CreateItem("Teleport to Player","")
				thisPlayer:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					local x,y,z = table.unpack(GetEntityCoords(GetPlayerPed(i),true))
					local heading = GetEntityHeading(GetPlayerPed(player))
					SetEntityCoords(PlayerPedId(), x,y,z,0,0,heading, false)
				end
			end
			
			if permissions.teleport then
				local thisItem = NativeUI.CreateItem("Teleport Player to Me","")
				thisPlayer:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
					TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", GetPlayerServerId(i), px,py,pz)
				end
			end
		end
	end
	
	if permissions.unban then
		unbanPlayer = _menuPool:AddSubMenu(servermanagement,"Unban Player")
		for i,theBanned in ipairs(banlist) do
			if showLicenses then 
				reason = theBanned
			else
				reason = banlist.reasons[i]
			end
			local thisItem = NativeUI.CreateItem(reason, "~r~~h~NOTE:~h~~w~ Pressing Confirm will unban this Player.")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:unbanPlayer", theBanned)
				TriggerServerEvent("EasyAdmin:updateBanlist")
				mainMenu:Visible(false)
				GenerateMenu()
			end
		end
	end
	
	thisPlayer = _menuPool:AddSubMenu(playermanagement,"All Players")
	
	if permissions.teleport then
		-- "all players" function
		local thisItem = NativeUI.CreateItem("Teleport To Me", "~r~~h~NOTE:~h~~w~ This will teleport ~h~all~h~ players to you.")
		thisPlayer:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
			TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", -1, px,py,pz)
		end
	end


	if permissions.unban then
		local sl = {"Reasons", "Licenses"}
		local thisItem = NativeUI.CreateListItem("~h~Banlist:~h~ Show Type", sl, 1,"Toggle Between Ban Reasons or Identifiers in the 'Unban Player' Menu.\nRequires Reopening.")
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnListChange = function(sender, item, index)
				if item == thisItem then
						i = item:IndexToItem(index)
						if i == "Reasons" then
							showLicenses = false
						else
							showLicenses = true
						end
				end
		end
	end
	
	
	if permissions.unban then
		local thisItem = NativeUI.CreateItem("Refresh Banlist", "This Refreshes the Banlist in the 'Unban Player' Menu.\nRequires Reopening.")
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnItemSelect = function(sender, item, index)
			if item == thisItem then
				TriggerServerEvent("EasyAdmin:updateBanlist")
			end
		end
	end
	
	local thisItem = NativeUI.CreateItem("Refresh Permissions", "This Refreshes your current Permissions.\nRequires Reopening.")
	settingsMenu:AddItem(thisItem)
	settingsMenu.OnItemSelect = function(sender, item, index)
		if item == thisItem then
			TriggerServerEvent("amiadmin")
		end
	end
	

	
	
	_menuPool:RefreshIndex() -- refresh indexes
end


Citizen.CreateThread( function()
	while true do
		Citizen.Wait(0)
		if drawInfo then
			local text = {}
			-- cheat checks
			local targetPed = GetPlayerPed(drawTarget)
			local targetGod = GetPlayerInvincible(drawTarget)
			if targetGod then
				table.insert(text,"Godmode: ~r~Detected~w~")
			else
				table.insert(text,"Godmode: ~g~None Detected~w~")
			end
			if not CanPedRagdoll(targetPed) and not IsPedInAnyVehicle(targetPed, false) and (GetPedParachuteState(targetPed) == -1 or GetPedParachuteState(targetPed) == 0) and not IsPedInParachuteFreeFall(targetPed) then
				table.insert(text,"~r~Anti-Ragdoll~w~")
			end
			-- health info
			table.insert(text,"Health: "..GetEntityHealth(targetPed).."/"..GetEntityMaxHealth(targetPed))
			table.insert(text,"Armor: "..GetPedArmour(targetPed))
			-- misc info
			table.insert(text,"Wanted level: "..GetPlayerWantedLevel(drawTarget))
			
			for i,theText in pairs(text) do
				SetTextFont(0)
				SetTextProportional(1)
				SetTextScale(0.0, 0.30)
				SetTextDropshadow(0, 0, 0, 0, 255)
				SetTextEdge(1, 0, 0, 0, 255)
				SetTextDropShadow()
				SetTextOutline()
				SetTextEntry("STRING")
				AddTextComponentString(theText)
				DrawText(0.3, 0.7+(i/30))
			end
			
		end
	end
end)