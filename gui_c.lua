isAdmin = false
showLicenses = false

settings = {
	button = 289,
	forceShowGUIButtons = false,
}

_menuPool = NativeUI.CreatePool()
mainMenu = NativeUI.CreateMenu("EasyAdmin", "~b~Admin Menu", 1320, 0)
_menuPool:Add(mainMenu)

banLength = {
	{label = "Permanent", time = 1924300800},
	{label = "1 Day", time = 86400},
	{label = "3 Days", time = 172800},
	{label = "1 Week", time = 518400},
	{label = "2 Weeks", time = 1123200},
	{label = "1 Month", time = 2678400},
	{label = "1 Year", time = 31536000},
}

Citizen.CreateThread(function()
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
	playermanagement = _menuPool:AddSubMenu(mainMenu, "Player Management","",true)
	servermanagement = _menuPool:AddSubMenu(mainMenu, "Server Management","",true)
	settingsMenu = _menuPool:AddSubMenu(mainMenu, "Settings","",true)
	
	-- show menu
	
	-- util stuff
	players = {}
	local localplayers = {}
	for i = 0, 31 do
		if NetworkIsPlayerActive( i ) then
			table.insert( localplayers, GetPlayerServerId(i) )
		end
	end
	table.sort(localplayers)
	for i,thePlayer in ipairs(localplayers) do
		--Citizen.Trace(thePlayer)
		table.insert(players,GetPlayerFromServerId(thePlayer))
	end

	for i,thePlayer in ipairs(players) do
		thisPlayer = _menuPool:AddSubMenu(playermanagement,"["..GetPlayerServerId(thePlayer).."] "..GetPlayerName(thePlayer),"",true)
		-- generate specific menu stuff, dirty but it works for now
		if permissions.kick then
			local thisKickMenu = _menuPool:AddSubMenu(thisPlayer,"Kick Player","",true)
			
			local thisItem = NativeUI.CreateItem("Reason","Add a reason to the kick.")
			thisKickMenu:AddItem(thisItem)
			KickReason = "No Reason Specified"
			thisItem:RightLabel(KickReason)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
				
				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end
				
				local result = GetOnscreenKeyboardResult()
				
				if result and result ~= "" then
					KickReason = result
					thisItem:RightLabel(result) -- this is broken for now
				else
					KickReason = "No Reason Specified"
				end
			end
			
			local thisItem = NativeUI.CreateItem("Confirm Kick","~r~~h~NOTE:~h~~w~ Pressing Confirm will kick this Player with the specified settings.")
			thisKickMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if KickReason == "" then
					KickReason = "No Reason Specified"
				end
				TriggerServerEvent("EasyAdmin:kickPlayer", GetPlayerServerId( thePlayer ), KickReason)
				BanTime = 1
				BanReason = ""
			end	
		end
		
		if permissions.ban then
			local thisBanMenu = _menuPool:AddSubMenu(thisPlayer,"Ban Player","",true)
			
			local thisItem = NativeUI.CreateItem("Reason","Add a reason to the ban.")
			thisBanMenu:AddItem(thisItem)
			BanReason = "No Reason Specified"
			thisItem:RightLabel(BanReason)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
				
				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end
				
				local result = GetOnscreenKeyboardResult()
				
				if result and result ~= "" then
					BanReason = result
					thisItem:RightLabel(result) -- this is broken for now
				else
					BanReason = "No Reason Specified"
				end
			end
			local bt = {}
			for i,a in ipairs(banLength) do
				table.insert(bt, a.label)
			end
			
			local thisItem = NativeUI.CreateListItem("Ban Length",bt, 1,"Until when should the Player be banned?" )
			thisBanMenu:AddItem(thisItem)
			local BanTime = 1
			thisItem.OnListChanged = function(sender,item,index)
				BanTime = index
			end
		
			local thisItem = NativeUI.CreateItem("Confirm Ban","~r~~h~NOTE:~h~~w~ Pressing Confirm will ban this Player with the specified settings.")
			thisBanMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if BanReason == "" then
					BanReason = "No Reason Specified"
				end
				TriggerServerEvent("EasyAdmin:banPlayer", GetPlayerServerId( thePlayer ), BanReason, banLength[BanTime].time)
				BanTime = 1
				BanReason = ""
			end	
			
		end
		
		if permissions.spectate then
			local thisItem = NativeUI.CreateItem("Spectate Player", "")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:requestSpectate",thePlayer)
			end
		end
		
		if permissions.teleport then
			local thisItem = NativeUI.CreateItem("Teleport to Player","")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				local x,y,z = table.unpack(GetEntityCoords(GetPlayerPed(thePlayer),true))
				local heading = GetEntityHeading(GetPlayerPed(player))
				SetEntityCoords(PlayerPedId(), x,y,z,0,0,heading, false)
			end
		end
		
		if permissions.teleport then
			local thisItem = NativeUI.CreateItem("Teleport Player to Me","")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
				TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", GetPlayerServerId(thePlayer), px,py,pz)
			end
		end
	end
	
	thisPlayer = _menuPool:AddSubMenu(playermanagement,"All Players","",true)
	
	if permissions.teleport then
		-- "all players" function
		local thisItem = NativeUI.CreateItem("Teleport To Me", "~r~~h~NOTE:~h~~w~ This will teleport ~h~all~h~ players to you.")
		thisPlayer:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
			TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", -1, px,py,pz)
		end
	end

	if permissions.manageserver then
		local thisItem = NativeUI.CreateItem("Set Game Type", "~r~~h~NOTE:~h~~w~ This will set the Game Type as listed on the Serverlist.")
		servermanagement:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 32 + 1)
			
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			
			if result then
				TriggerServerEvent("EasyAdmin:SetGameType", result)
			end
		end
		
		local thisItem = NativeUI.CreateItem("Set Map Name", "~r~~h~NOTE:~h~~w~ This will set the Map Name as listed on the Serverlist.")
		servermanagement:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 32 + 1)
			
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			
			if result then
				TriggerServerEvent("EasyAdmin:SetMapName", result)
			end
		end
		
		local thisItem = NativeUI.CreateItem("Start Resource by Name", "~r~~h~NOTE:~h~~w~ This will start a resource installed on the server.")
		servermanagement:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 32 + 1)
			
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			
			if result then
				TriggerServerEvent("EasyAdmin:StartResource", result)
			end
		end
		
		local thisItem = NativeUI.CreateItem("Stop Resource by Name", "~r~~h~NOTE:~h~~w~ This will stop a resource installed on the server.")
		servermanagement:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 32 + 1)
			
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			
			if result then
				if result ~= GetCurrentResourceName() and result ~= "NativeUI" then
					TriggerServerEvent("EasyAdmin:StopResource", result)
				else
					TriggerEvent("chat:addMessage", { args = { "EasyAdmin", "Don't do that, please." } })
				end
			end
		end
		
	end
	
	if permissions.unban then
		unbanPlayer = _menuPool:AddSubMenu(servermanagement,"Unban Player","",true)
		local reason = ""
		local identifier = ""
		for i,theBanned in ipairs(banlist) do
			identifier = banlist[i].identifier
			if showLicenses then 
				reason = banlist[i].identifier
				
			else
				reason = banlist[i].reason
			end
			local thisItem = NativeUI.CreateItem(reason, "~r~~h~NOTE:~h~~w~ Pressing Confirm will unban this Player.")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:unbanPlayer", identifier)
				TriggerServerEvent("EasyAdmin:updateBanlist")
				mainMenu:Visible(false)
				GenerateMenu()
			end
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
			table.insert(text,"Press E to exit spectator mode.")
			
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
				EndTextCommandDisplayText(0.3, 0.7+(i/30))
			end
			
			if IsControlJustPressed(0,103) then
				local targetPed = PlayerPedId()
				local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))
	
				RequestCollisionAtCoord(targetx,targety,targetz)
				NetworkSetInSpectatorMode(false, targetPed)
	
				StopDrawPlayerInfo()
				ShowNotification("Stopped Spectating.")
			end 
			
		end
	end
end)