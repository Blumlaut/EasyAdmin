isAdmin = false
showLicenses = false

settings = {
	button = 289,
	forceShowGUIButtons = false,
}

permissions = {
	ban = false,
	kick = false,
	spectate = false,
	unban = false,
	teleport = false,
	manageserver = false,
	slap = false,
	freeze = false,
}

_menuPool = NativeUI.CreatePool()

-- generate "slap" table once
local SlapAmount = {}
for i=1,20 do
	table.insert(SlapAmount,i)
end

function handleOrientation(orientation)
	if orientation == "right" then
		return 1320
	elseif orientation == "middle" then
		return 730
	elseif orientation == "left" then
		return 0
	end
end

Citizen.CreateThread(function()
	TriggerServerEvent("EasyAdmin:amiadmin")
	TriggerServerEvent("EasyAdmin:updateBanlist")
	if not GetResourceKvpString("ea_menuorientation") then
		SetResourceKvp("ea_menuorientation", "right")
		SetResourceKvpInt("ea_menuwidth", 0)
		menuWidth = 0
		menuOrientation = handleOrientation("right")
	else
		menuWidth = GetResourceKvpInt("ea_menuwidth")
		menuOrientation = handleOrientation(GetResourceKvpString("ea_menuorientation"))
	end 
	mainMenu = NativeUI.CreateMenu("EasyAdmin", "~b~Admin Menu", menuOrientation, 0)
	_menuPool:Add(mainMenu)
	
		mainMenu:SetMenuWidthOffset(menuWidth)	
	_menuPool:ControlDisablingEnabled(false)
	_menuPool:MouseControlsEnabled(false)
	
		
	while true do
		_menuPool:ProcessMenus()
		if IsControlJustReleased(0, settings.button) and isAdmin == true then --M by default
			-- clear and re-create incase of permission change+player count change
			if strings then
				banLength = {
					{label = strings.permanent, time = 10444633200},
					{label = strings.oneday, time = 86400},
					{label = strings.threedays, time = 172800},
					{label = strings.oneweek, time = 518400},
					{label = strings.twoweeks, time = 1123200},
					{label = strings.onemonth, time = 2678400},
					{label = strings.oneyear, time = 31536000},
				}
				
				
				GenerateMenu()
				mainMenu:Visible(not mainMenu:Visible())
			else
				TriggerServerEvent("EasyAdmin:amiadmin")
			end
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
	playermanagement = _menuPool:AddSubMenu(mainMenu, strings.playermanagement,"",true)
	servermanagement = _menuPool:AddSubMenu(mainMenu, strings.servermanagement,"",true)
	settingsMenu = _menuPool:AddSubMenu(mainMenu, strings.settings,"",true)

	mainMenu:SetMenuWidthOffset(menuWidth)	
	playermanagement:SetMenuWidthOffset(menuWidth)	
	servermanagement:SetMenuWidthOffset(menuWidth)	
	settingsMenu:SetMenuWidthOffset(menuWidth)	

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
		thisPlayer:SetMenuWidthOffset(menuWidth)
		-- generate specific menu stuff, dirty but it works for now
		if permissions.kick then
			local thisKickMenu = _menuPool:AddSubMenu(thisPlayer,strings.kickplayer,"",true)
			thisKickMenu:SetMenuWidthOffset(menuWidth)
			
			local thisItem = NativeUI.CreateItem(strings.reason,strings.kickreasonguide)
			thisKickMenu:AddItem(thisItem)
			KickReason = strings.noreason
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
					KickReason = strings.noreason
				end
			end
			
			local thisItem = NativeUI.CreateItem(strings.confirmkick,strings.confirmkickguide)
			thisKickMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if KickReason == "" then
					KickReason = strings.noreason
				end
				TriggerServerEvent("EasyAdmin:kickPlayer", GetPlayerServerId( thePlayer ), KickReason)
				BanTime = 1
				BanReason = ""
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				playermanagement:Visible(true)
			end	
		end
		
		if permissions.ban then
			local thisBanMenu = _menuPool:AddSubMenu(thisPlayer,strings.banplayer,"",true)
			thisBanMenu:SetMenuWidthOffset(menuWidth)
			
			local thisItem = NativeUI.CreateItem(strings.reason,strings.banreasonguide)
			thisBanMenu:AddItem(thisItem)
			BanReason = strings.noreason
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
					BanReason = strings.noreason
				end
			end
			local bt = {}
			for i,a in ipairs(banLength) do
				table.insert(bt, a.label)
			end
			
			local thisItem = NativeUI.CreateListItem(strings.banlength,bt, 1,strings.banlengthguide )
			thisBanMenu:AddItem(thisItem)
			local BanTime = 1
			thisItem.OnListChanged = function(sender,item,index)
				BanTime = index
			end
		
			local thisItem = NativeUI.CreateItem(strings.confirmban,strings.confirmbanguide)
			thisBanMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if BanReason == "" then
					BanReason = strings.noreason
				end
				TriggerServerEvent("EasyAdmin:banPlayer", GetPlayerServerId( thePlayer ), BanReason, banLength[BanTime].time)
				BanTime = 1
				BanReason = ""
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				playermanagement:Visible(true)
			end	
			
		end
		
		if permissions.spectate then
			local thisItem = NativeUI.CreateItem(strings.spectateplayer, "")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:requestSpectate",thePlayer)
			end
		end
		
		if permissions.teleport then
			local thisItem = NativeUI.CreateItem(strings.teleporttoplayer,"")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				local x,y,z = table.unpack(GetEntityCoords(GetPlayerPed(thePlayer),true))
				local heading = GetEntityHeading(GetPlayerPed(player))
				SetEntityCoords(PlayerPedId(), x,y,z,0,0,heading, false)
			end
		end
		
		if permissions.teleport then
			local thisItem = NativeUI.CreateItem(strings.teleportplayertome,"")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
				TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", GetPlayerServerId(thePlayer), px,py,pz)
			end
		end
		
		if permissions.slap then
			local thisItem = NativeUI.CreateSliderItem(strings.slapplayer, SlapAmount, 20, false, false)
			thisPlayer:AddItem(thisItem)
			thisItem.OnSliderSelected = function(index)
				TriggerServerEvent("EasyAdmin:SlapPlayer", GetPlayerServerId(thePlayer), index*10)
			end
		end

		if permissions.freeze then
			local sl = {strings.on, strings.off}
			local thisItem = NativeUI.CreateListItem(strings.setplayerfrozen, sl, 1)
			thisPlayer:AddItem(thisItem)
			thisPlayer.OnListSelect = function(sender, item, index)
					if item == thisItem then
							i = item:IndexToItem(index)
							Citizen.Trace(i)
							if i == strings.on then
								TriggerServerEvent("EasyAdmin:FreezePlayer", GetPlayerServerId(thePlayer), true)
							else
								TriggerServerEvent("EasyAdmin:FreezePlayer", GetPlayerServerId(thePlayer), false)
							end
					end
			end
		end
		_menuPool:ControlDisablingEnabled(false)
		_menuPool:MouseControlsEnabled(false)
	end
	
	
	thisPlayer = _menuPool:AddSubMenu(playermanagement,strings.allplayers,"",true)
	thisPlayer:SetMenuWidthOffset(menuWidth)
	if permissions.teleport then
		-- "all players" function
		local thisItem = NativeUI.CreateItem(strings.teleporttome, strings.teleporttomeguide)
		thisPlayer:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			local px,py,pz = table.unpack(GetEntityCoords(PlayerPedId(),true))
			TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", -1, px,py,pz)
		end
	end

	if permissions.manageserver then
		local thisItem = NativeUI.CreateItem(strings.setgametype, strings.setgametypeguide)
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
		
		local thisItem = NativeUI.CreateItem(strings.setmapname, strings.setmapnameguide)
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
		
		local thisItem = NativeUI.CreateItem(strings.startresourcebyname, strings.startresourcebynameguide)
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
		
		local thisItem = NativeUI.CreateItem(strings.stopresourcebyname, strings.stopresourcebynameguide)
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
					TriggerEvent("chat:addMessage", { args = { "EasyAdmin", strings.badidea } })
				end
			end
		end
		
	end
	
	if permissions.unban then
		unbanPlayer = _menuPool:AddSubMenu(servermanagement,strings.unbanplayer,"",true)
		unbanPlayer:SetMenuWidthOffset(menuWidth)
		
		local reason = ""
		local identifier = ""
		for i,theBanned in ipairs(banlist) do
			identifier = banlist[i].identifier
			if showLicenses then 
				reason = banlist[i].identifier
				
			else
				reason = banlist[i].reason
			end
			local thisItem = NativeUI.CreateItem(reason, strings.unbanplayerguide)
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:unbanPlayer", identifier)
				TriggerServerEvent("EasyAdmin:updateBanlist")
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				unbanPlayer:Visible(true)
			end
		end
	end
	


	if permissions.unban then
		local sl = {strings.unbanreasons, strings.unbanlicenses}
		local thisItem = NativeUI.CreateListItem(strings.banlistshowtype, sl, 1,strings.banlistshowtypeguide)
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnListChange = function(sender, item, index)
				if item == thisItem then
						i = item:IndexToItem(index)
						if i == strings.unbanreasons then
							showLicenses = false
						else
							showLicenses = true
						end
				end
		end
	end
	
	
	if permissions.unban then
		local thisItem = NativeUI.CreateItem(strings.refreshbanlist, strings.refreshbanlistguide)
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnItemSelect = function(sender, item, index)
			if item == thisItem then
				TriggerServerEvent("EasyAdmin:updateBanlist")
			end
		end
	end
	
	local thisItem = NativeUI.CreateItem(strings.refreshpermissions, strings.refreshpermissionsguide)
	settingsMenu:AddItem(thisItem)
	settingsMenu.OnItemSelect = function(sender, item, index)
		if item == thisItem then
			TriggerServerEvent("amiadmin")
		end
	end
	
	local sl = {strings.left, strings.middle, strings.right}
	local thisItem = NativeUI.CreateListItem(strings.menuOrientation, sl, 1, strings.menuOrientationguide)
	settingsMenu:AddItem(thisItem)
	settingsMenu.OnListChange = function(sender, item, index)
			if item == thisItem then
					i = item:IndexToItem(index)
					if i == strings.left then
						SetResourceKvp("ea_menuorientation", "left")
					elseif i == strings.middle then
						SetResourceKvp("ea_menuorientation", "middle")
					else
						SetResourceKvp("ea_menuorientation", "right")
					end
			end
	end
	local sl = {}
	for i=0,150,10 do
		table.insert(sl,i)
	end
	local thisi = 0
	for i,a in ipairs(sl) do
		if menuWidth == a then
			thisi = i
		end
	end
	local thisItem = NativeUI.CreateSliderItem(strings.menuOffset, sl, thisi, strings.menuOffsetguide, false)
	settingsMenu:AddItem(thisItem)
	thisItem.OnSliderSelected = function(index)
		i = thisItem:IndexToItem(index)
		SetResourceKvpInt("ea_menuwidth", i)
		menuWidth = i
	end


	local thisItem = NativeUI.CreateItem(strings.resetmenuOffset, "")
	settingsMenu:AddItem(thisItem)
	settingsMenu.OnItemSelect = function(sender, item, index)
		if item == thisItem then
			SetResourceKvpInt("ea_menuwidth", 0)
			menuWidth = 0
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
				table.insert(text,strings.godmodedetected)
			else
				table.insert(text,strings.godmodenotdetected)
			end
			if not CanPedRagdoll(targetPed) and not IsPedInAnyVehicle(targetPed, false) and (GetPedParachuteState(targetPed) == -1 or GetPedParachuteState(targetPed) == 0) and not IsPedInParachuteFreeFall(targetPed) then
				table.insert(text,strings.antiragdoll)
			end
			-- health info
			table.insert(text,strings.health..": "..GetEntityHealth(targetPed).."/"..GetEntityMaxHealth(targetPed))
			table.insert(text,strings.armor..": "..GetPedArmour(targetPed))
			-- misc info
			table.insert(text,strings.wantedlevel..": "..GetPlayerWantedLevel(drawTarget))
			table.insert(text,strings.exitspectator)
			
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
				ShowNotification(strings.stoppedSpectating)
			end 
			
		end
	end
end)