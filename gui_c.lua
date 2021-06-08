------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
------------------------------------
------------------------------------

isAdmin = false
showLicenses = false
RedM = false

settings = {
	button = 289,
	forceShowGUIButtons = false,
}


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

playlist = nil

RegisterCommand('easyadmin', function(source, args)
	CreateThread(function()
		if not RedM then
			playerlist = nil
			TriggerServerEvent("EasyAdmin:GetInfinityPlayerList") -- shitty fix for bigmode
			repeat
				Wait(100)
			until playerlist
		end

		if strings then
			banLength = {
				{label = GetLocalisedText("permanent"), time = 10444633200},
				{label = GetLocalisedText("oneday"), time = 86400},
				{label = GetLocalisedText("threedays"), time = 259200},
				{label = GetLocalisedText("oneweek"), time = 518400},
				{label = GetLocalisedText("twoweeks"), time = 1123200},
				{label = GetLocalisedText("onemonth"), time = 2678400},
				{label = GetLocalisedText("oneyear"), time = 31536000},
			}
			if mainMenu and mainMenu:Visible() then
				mainMenu:Visible(false)
				_menuPool:Remove()
				TriggerEvent("EasyAdmin:MenuRemoved")
				collectgarbage()
			else
				GenerateMenu()
				mainMenu:Visible(true)
			end
		else
			TriggerServerEvent("EasyAdmin:amiadmin")
		end
	end)
end)

Citizen.CreateThread(function()
	if CompendiumHorseObserved then -- https://www.youtube.com/watch?v=r7qovpFAGrQ
		RedM = true
		settings.button = "PhotoModePc"
	end
	repeat
		Wait(100)
	until NativeUI
	TriggerServerEvent("EasyAdmin:amiadmin")
	TriggerServerEvent("EasyAdmin:requestBanlist")
	TriggerServerEvent("EasyAdmin:requestCachedPlayers")

	if not GetResourceKvpString("ea_menuorientation") then
		SetResourceKvp("ea_menuorientation", "right")
		SetResourceKvpInt("ea_menuwidth", 0)
		menuWidth = 0
		menuOrientation = handleOrientation("right")
	else
		menuWidth = GetResourceKvpInt("ea_menuwidth")
		menuOrientation = handleOrientation(GetResourceKvpString("ea_menuorientation"))
	end 
	local subtitle = "~b~Admin Menu"
	if settings.updateAvailable then
		subtitle = "~g~UPDATE "..settings.updateAvailable.." AVAILABLE!"
	elseif settings.alternativeTitle then
		-- if you remove this code then you're a killjoy, can't we have nice things? just once? it's not like this changes the whole admin menu or how it behaves, its a single subtitle.
		subtitle = settings.alternativeTitle
	end

	while true do
		if _menuPool then
			_menuPool:ProcessMenus()
			if not _menuPool:IsAnyMenuOpen() then 
				_menuPool:Remove()
				TriggerEvent("EasyAdmin:MenuRemoved")
				_menuPool = nil
				collectgarbage()
			end
		end
		
		if (RedM and IsControlJustReleased(0, Controls[settings.button]) ) or (not RedM and IsControlJustReleased(0, tonumber(settings.button)) and GetLastInputMethod( 0 )) then
			-- clear and re-create incase of permission change+player count change
			if not isAdmin == true then
				TriggerServerEvent("EasyAdmin:amiadmin")
				local waitTime = 0

				repeat 
					Wait(100)
					waitTime=waitTime+1
				until (isAdmin or waitTime==60)
				if not isAdmin then
				end
			end
			

			
			if not RedM and isAdmin then
				playerlist = nil
				TriggerServerEvent("EasyAdmin:GetInfinityPlayerList") -- shitty fix for bigmode
				repeat
					Wait(100)
				until playerlist
			end

			if strings and isAdmin then
				banLength = {}
				
				if permissions["ban.permanent"] then
					table.insert(banLength, {label = GetLocalisedText("permanent"), time = 10444633200})
				end

				if permissions["ban.temporary"] then
					table.insert(banLength, {label = GetLocalisedText("6hours"), time = 21600})
					table.insert(banLength, {label = GetLocalisedText("12hours"), time = 43200})
					table.insert(banLength, {label = GetLocalisedText("oneday"), time = 86400})
					table.insert(banLength, {label = GetLocalisedText("threedays"), time = 259200})
					table.insert(banLength, {label = GetLocalisedText("oneweek"), time = 518400})
					table.insert(banLength, {label = GetLocalisedText("twoweeks"), time = 1123200})
					table.insert(banLength, {label = GetLocalisedText("onemonth"), time = 2678400})
					table.insert(banLength, {label = GetLocalisedText("oneyear"), time = 31536000})
				end
				
				

				if mainMenu and mainMenu:Visible() then
					mainMenu:Visible(false)
					_menuPool:Remove()
					TriggerEvent("EasyAdmin:MenuRemoved")
					collectgarbage()
				else
					GenerateMenu()
					mainMenu:Visible(true)
				end
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

local banlistPage = 1
local playerMenus = {}
function GenerateMenu() -- this is a big ass function
	TriggerServerEvent("EasyAdmin:requestCachedPlayers")
	if _menuPool then
		_menuPool:Remove()
		TriggerEvent("EasyAdmin:MenuRemoved")
		collectgarbage()
	end
	_menuPool = NativeUI.CreatePool()
	collectgarbage()
	if not GetResourceKvpString("ea_menuorientation") then
		SetResourceKvp("ea_menuorientation", "right")
		SetResourceKvpInt("ea_menuwidth", 0)
		menuWidth = 0
		menuOrientation = handleOrientation("right")
	else
		menuWidth = GetResourceKvpInt("ea_menuwidth")
		menuOrientation = handleOrientation(GetResourceKvpString("ea_menuorientation"))
	end 
	local subtitle = "~b~Admin Menu"
	if settings.updateAvailable then
		subtitle = "~g~UPDATE "..settings.updateAvailable.." AVAILABLE!" elseif settings.alternativeTitle then subtitle = settings.alternativeTitle
	end
	mainMenu = NativeUI.CreateMenu("EasyAdmin", subtitle, menuOrientation, 0)
	_menuPool:Add(mainMenu)
	
		mainMenu:SetMenuWidthOffset(menuWidth)	
	_menuPool:ControlDisablingEnabled(false)
	_menuPool:MouseControlsEnabled(false)
	
	playermanagement = _menuPool:AddSubMenu(mainMenu, GetLocalisedText("playermanagement"),"",true)
	servermanagement = _menuPool:AddSubMenu(mainMenu, GetLocalisedText("servermanagement"),"",true)
	settingsMenu = _menuPool:AddSubMenu(mainMenu, GetLocalisedText("settings"),"",true)

	mainMenu:SetMenuWidthOffset(menuWidth)	
	playermanagement:SetMenuWidthOffset(menuWidth)	
	servermanagement:SetMenuWidthOffset(menuWidth)	
	settingsMenu:SetMenuWidthOffset(menuWidth)	

	-- util stuff
	players = {}
	local localplayers = {}

	if not RedM then
		local localplayers = playerlist
		local temp = {}
		--table.sort(localplayers)
		for i,thePlayer in pairs(localplayers) do
			table.insert(temp, thePlayer.id)
		end
		table.sort(temp)
		for i, thePlayerId in pairs(temp) do
			for _, thePlayer in pairs(localplayers) do
				if thePlayerId == thePlayer.id then
					players[i] = thePlayer
				end
			end
		end
		temp=nil
	else
		for i = 0, 128 do
			if NetworkIsPlayerActive( i ) then
			  table.insert( localplayers, GetPlayerServerId(i) )
			end
		end
		table.sort(localplayers)
		for i,thePlayer in ipairs(localplayers) do
			table.insert(players,GetPlayerFromServerId(thePlayer))
		end
	end

	TriggerEvent("EasyAdmin:BuildMainMenuOptions")

	local userSearch = NativeUI.CreateItem(GetLocalisedText("searchuser"), GetLocalisedText("searchuserguide"))
	playermanagement:AddItem(userSearch)
	userSearch.Activated = function(ParentMenu, SelectedItem)
		DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 6)

		while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
			Citizen.Wait( 0 )
		end

		local result = GetOnscreenKeyboardResult()

		if result and result ~= "" then
			local found = false
			local foundbyid = playerMenus[result] or false
			local temp = {}
			if foundbyid then
				found = true
				table.insert(temp, {id = foundbyid.id, name = foundbyid.name, menu = foundbyid.menu})
			end
			for k,v in pairs(playerMenus) do
				if string.find(v.name, result) then
					found = true
					table.insert(temp, {id = v.id, name = v.name, menu = v.menu})
				end
			end

			if found and (#temp > 1) then
				local searchsubtitle = "Found "..tostring(#temp).." results!"
				local resultMenu = NativeUI.CreateMenu("Search Results", searchsubtitle, menuOrientation, 0)
				_menuPool:Add(resultMenu)
				_menuPool:ControlDisablingEnabled(false)
				_menuPool:MouseControlsEnabled(false)

				for i,thePlayer in ipairs(temp) do
					local thisItem = NativeUI.CreateItem("["..thePlayer.id.."] "..thePlayer.name, "")
					resultMenu:AddItem(thisItem)
					thisItem.Activated = function(ParentMenu, SelectedItem)
						_menuPool:CloseAllMenus()
						Citizen.Wait(300)
						local thisMenu = thePlayer.menu
						thisMenu:Visible(true)
					end
				end
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				resultMenu:Visible(true)
				return
			end
			if found and (#temp == 1) then
				local thisMenu = temp[1].menu
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				thisMenu:Visible(true)
				return
			end
			ShowNotification("~r~No results found!")
		end
	end

	playerMenus = {}
	for i,thePlayer in pairs(players) do
		if RedM then
			thePlayer = {
				id = GetPlayerServerId(thePlayer), 
				name = GetPlayerName(thePlayer)
			}
		end
		thisPlayer = _menuPool:AddSubMenu(playermanagement,"["..thePlayer.id.."] "..thePlayer.name,"",true)
		playerMenus[tostring(thePlayer.id)] = {menu = thisPlayer, name = thePlayer.name, id = thePlayer.id }

		thisPlayer:SetMenuWidthOffset(menuWidth)
		-- generate specific menu stuff, dirty but it works for now
		if permissions["kick"] then
			local thisKickMenu = _menuPool:AddSubMenu(thisPlayer,GetLocalisedText("kickplayer"),"",true)
			thisKickMenu:SetMenuWidthOffset(menuWidth)

			local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),GetLocalisedText("kickreasonguide"))
			thisKickMenu:AddItem(thisItem)
			KickReason = GetLocalisedText("noreason")
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
					KickReason = GetLocalisedText("noreason")
				end
			end
			
			local thisItem = NativeUI.CreateItem(GetLocalisedText("confirmkick"),GetLocalisedText("confirmkickguide"))
			thisKickMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if KickReason == "" then
					KickReason = GetLocalisedText("noreason")
				end
				TriggerServerEvent("EasyAdmin:kickPlayer", thePlayer.id, KickReason)
				BanTime = 1
				BanReason = ""
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				playermanagement:Visible(true)
			end	
		end
		
		if permissions["ban.temporary"] or permissions["ban.permanent"] then
			local thisBanMenu = _menuPool:AddSubMenu(thisPlayer,GetLocalisedText("banplayer"),"",true)
			thisBanMenu:SetMenuWidthOffset(menuWidth)
			
			local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),GetLocalisedText("banreasonguide"))
			thisBanMenu:AddItem(thisItem)
			BanReason = GetLocalisedText("noreason")
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
					BanReason = GetLocalisedText("noreason")
				end
			end
			local bt = {}
			for i,a in ipairs(banLength) do
				table.insert(bt, a.label)
			end
			
			local thisItem = NativeUI.CreateListItem(GetLocalisedText("banlength"),bt, 1,GetLocalisedText("banlengthguide") )
			thisBanMenu:AddItem(thisItem)
			local BanTime = 1
			thisItem.OnListChanged = function(sender,item,index)
				BanTime = index
			end
		
			local thisItem = NativeUI.CreateItem(GetLocalisedText("confirmban"),GetLocalisedText("confirmbanguide"))
			thisBanMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if BanReason == "" then
					BanReason = GetLocalisedText("noreason")
				end
				TriggerServerEvent("EasyAdmin:banPlayer", thePlayer.id, BanReason, banLength[BanTime].time, thePlayer.name )
				BanTime = 1
				BanReason = ""
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				playermanagement:Visible(true)
			end	
			
		end
		
		if permissions["mute"] then			
			local thisItem = NativeUI.CreateItem(GetLocalisedText("mute"),GetLocalisedText("muteguide"))
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:mutePlayer", thePlayer.id)
			end
		end

		if permissions["spectate"] then
			local thisItem = NativeUI.CreateItem(GetLocalisedText("spectateplayer"), "")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:requestSpectate",thePlayer.id)
			end
		end
		
		if permissions["teleport.player"] then
			local thisItem = NativeUI.CreateItem(GetLocalisedText("teleporttoplayer"),"")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if settings.infinity and not RedM then
					TriggerServerEvent('EasyAdmin:TeleportAdminToPlayer', thePlayer.id)
				else
					local x,y,z = table.unpack(GetEntityCoords(GetPlayerPed(GetPlayerFromServerId(thePlayer.id)),true))
					local heading = GetEntityHeading(GetPlayerPed(player))
					SetEntityCoords(PlayerPedId(), x,y,z,0,0,heading, false)
				end
			end
		end
		
		if permissions["teleport.player"] then
			local thisItem = NativeUI.CreateItem(GetLocalisedText("teleportplayertome"),"")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				local coords = GetEntityCoords(PlayerPedId(),true)
				TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", thePlayer.id, coords)
			end
		end
		
		if permissions["slap"] then
			local thisItem = NativeUI.CreateSliderItem(GetLocalisedText("slapplayer"), SlapAmount, 20, false, false)
			thisPlayer:AddItem(thisItem)
			thisItem.OnSliderSelected = function(index)
				TriggerServerEvent("EasyAdmin:SlapPlayer", thePlayer.id, index*10)
			end
		end

		if permissions["freeze"] and not RedM then
			local sl = {GetLocalisedText("on"), GetLocalisedText("off")}
			local thisItem = NativeUI.CreateListItem(GetLocalisedText("setplayerfrozen"), sl, 1)
			thisPlayer:AddItem(thisItem)
			thisPlayer.OnListSelect = function(sender, item, index)
					if item == thisItem then
							i = item:IndexToItem(index)
							if i == GetLocalisedText("on") then
								TriggerServerEvent("EasyAdmin:FreezePlayer", thePlayer.id, true)
							else
								TriggerServerEvent("EasyAdmin:FreezePlayer", thePlayer.id, false)
							end
					end
			end
		end
	
		if permissions["screenshot"] then
			local thisItem = NativeUI.CreateItem(GetLocalisedText("takescreenshot"),"")
			thisPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				TriggerServerEvent("EasyAdmin:TakeScreenshot", thePlayer.id)
			end
		end

		if permissions["warn"] then
			local thisWarnMenu = _menuPool:AddSubMenu(thisPlayer,GetLocalisedText("warnplayer"),"",true)
			thisWarnMenu:SetMenuWidthOffset(menuWidth)
			
			local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),GetLocalisedText("warnreasonguide"))
			thisWarnMenu:AddItem(thisItem)
			WarnReason = GetLocalisedText("noreason")
			thisItem:RightLabel(WarnReason)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
				
				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end
				
				local result = GetOnscreenKeyboardResult()
				
				if result and result ~= "" then
					WarnReason = result
					thisItem:RightLabel(result) -- this is broken for now
				else
					WarnReason = GetLocalisedText("noreason")
				end
			end
			
			local thisItem = NativeUI.CreateItem(GetLocalisedText("confirmwarn"),GetLocalisedText("confirmwarnguide"))
			thisWarnMenu:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				if WarnReason == "" then
					WarnReason = GetLocalisedText("noreason")
				end
				TriggerServerEvent("EasyAdmin:warnPlayer", thePlayer.id, WarnReason)
				BanTime = 1
				BanReason = ""
				_menuPool:CloseAllMenus()
				Citizen.Wait(800)
				GenerateMenu()
				playermanagement:Visible(true)
			end	
		end


		TriggerEvent("EasyAdmin:BuildPlayerOptions", thePlayer.id)
		
		if GetResourceState("es_extended") == "started" and not ESX then
			local thisItem = NativeUI.CreateItem("~y~[ESX]~s~ Options","You can buy the ESX Plugin from https://blumlaut.tebex.io to use this Feature.") -- create our new item
			thisPlayer:AddItem(thisItem)
		end
		
		_menuPool:ControlDisablingEnabled(false)
		_menuPool:MouseControlsEnabled(false)
	end
	
	
	thisPlayer = _menuPool:AddSubMenu(playermanagement,GetLocalisedText("allplayers"),"",true)
	thisPlayer:SetMenuWidthOffset(menuWidth)
	if permissions["teleport.everyone"] then
		-- "all players" function
		local thisItem = NativeUI.CreateItem(GetLocalisedText("teleporttome"), GetLocalisedText("teleporttomeguide"))
		thisPlayer:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			local pCoords = GetEntityCoords(PlayerPedId(),true)
			TriggerServerEvent("EasyAdmin:TeleportPlayerToCoords", -1, pCoords)
		end
	end

	CachedList = _menuPool:AddSubMenu(playermanagement,GetLocalisedText("cachedplayers"),"",true)
	CachedList:SetMenuWidthOffset(menuWidth)
	if permissions["ban.temporary"] or permissions["ban.permanent"] then
		for i, cachedplayer in pairs(cachedplayers) do
			if cachedplayer.droppedTime and not cachedplayer.immune then
				thisPlayer = _menuPool:AddSubMenu(CachedList,"["..cachedplayer.id.."] "..cachedplayer.name,"",true)
				thisPlayer:SetMenuWidthOffset(menuWidth)
				local thisBanMenu = _menuPool:AddSubMenu(thisPlayer,GetLocalisedText("banplayer"),"",true)
				thisBanMenu:SetMenuWidthOffset(menuWidth)
				
				local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),GetLocalisedText("banreasonguide"))
				thisBanMenu:AddItem(thisItem)
				BanReason = GetLocalisedText("noreason")
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
						BanReason = GetLocalisedText("noreason")
					end
				end
				local bt = {}
				for i,a in ipairs(banLength) do
					table.insert(bt, a.label)
				end
				
				local thisItem = NativeUI.CreateListItem(GetLocalisedText("banlength"),bt, 1,GetLocalisedText("banlengthguide") )
				thisBanMenu:AddItem(thisItem)
				local BanTime = 1
				thisItem.OnListChanged = function(sender,item,index)
					BanTime = index
				end
			
				local thisItem = NativeUI.CreateItem(GetLocalisedText("confirmban"),GetLocalisedText("confirmbanguide"))
				thisBanMenu:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					if BanReason == "" then
						BanReason = GetLocalisedText("noreason")
					end
					TriggerServerEvent("EasyAdmin:offlinebanPlayer", cachedplayer.id, BanReason, banLength[BanTime].time, cachedplayer.name)
					BanTime = 1
					BanReason = ""
					_menuPool:CloseAllMenus()
					Citizen.Wait(800)
					GenerateMenu()
					playermanagement:Visible(true)
				end	
				TriggerEvent("EasyAdmin:BuildCachedOptions", cachedplayer.id)
			end
		end
	end

	if permissions["manageserver"] then
		local thisItem = NativeUI.CreateItem(GetLocalisedText("setgametype"), GetLocalisedText("setgametypeguide"))
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
		
		local thisItem = NativeUI.CreateItem(GetLocalisedText("setmapname"), GetLocalisedText("setmapnameguide"))
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
		
		local thisItem = NativeUI.CreateItem(GetLocalisedText("startresourcebyname"), GetLocalisedText("startresourcebynameguide"))
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
		
		local thisItem = NativeUI.CreateItem(GetLocalisedText("stopresourcebyname"), GetLocalisedText("stopresourcebynameguide"))
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
					TriggerEvent("chat:addMessage", { args = { "EasyAdmin", GetLocalisedText("badidea") } })
				end
			end
		end

		local thisItem = NativeUI.CreateItem(GetLocalisedText("setconvar"), GetLocalisedText("setconvarguide"))
		servermanagement:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			AddTextEntry("EA_SETCONVAR_1", GetLocalisedText("convarname"))
			AddTextEntry("EA_SETCONVAR_2", GetLocalisedText("convarvalue"))
			DisplayOnscreenKeyboard(1, "EA_SETCONVAR_1", "", "", "", "", "", 64 + 1)
			
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			
			if result then
				DisplayOnscreenKeyboard(1, "EA_SETCONVAR_2", "", "", "", "", "", 64 + 1)
			
				while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
					Citizen.Wait( 0 )
				end
				
				local result2 = GetOnscreenKeyboardResult()

				if result2 then
					TriggerServerEvent("EasyAdmin:SetConvar", result, result2)
				end
			end
		end

		TriggerEvent("EasyAdmin:BuildServerManagementOptions")

	end
	
	if permissions["unban"] then
		unbanPlayer = _menuPool:AddSubMenu(servermanagement,GetLocalisedText("viewbanlist"),"",true)
		unbanPlayer:SetMenuWidthOffset(menuWidth)
		local reason = ""
		local identifier = ""


		local thisItem = NativeUI.CreateItem(GetLocalisedText("searchbans"), "")
		unbanPlayer:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			-- TODO
			DisplayOnscreenKeyboard(1, "FMMC_KEY_TIP8", "", "", "", "", "", 128 + 1)
				
			while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do
				Citizen.Wait( 0 )
			end
			
			local result = GetOnscreenKeyboardResult()
			local foundBan = false
			if result then
				for i,theBanned in ipairs(banlist) do
					if foundBan then
						break
					end
					if tostring(theBanned.banid) == result then
						foundBan=true
						foundBanid=i
						break
					end 
					if theBanned.name then
						if string.find(theBanned.name, result) then
							foundBan=true
							foundBanid=i
							break
						end
					end
					if string.find((theBanned.reason or "No Reason"), result) then
						foundBan=true
						foundBanid=i
						break
					end
					for _, identifier in pairs(theBanned.identifiers) do
						if string.find(identifier, result) then
							foundBan=true
							foundBanid=i
							break
						end
					end
				end
			end
			_menuPool:CloseAllMenus()
			Citizen.Wait(300)
			if foundBan then
				_menuPool:Remove()
				TriggerEvent("EasyAdmin:MenuRemoved")
				_menuPool = NativeUI.CreatePool()
				collectgarbage()
				if not GetResourceKvpString("ea_menuorientation") then
					SetResourceKvp("ea_menuorientation", "right")
					SetResourceKvpInt("ea_menuwidth", 0)
					menuWidth = 0
					menuOrientation = handleOrientation("right")
				else
					menuWidth = GetResourceKvpInt("ea_menuwidth")
					menuOrientation = handleOrientation(GetResourceKvpString("ea_menuorientation"))
				end 
				
				mainMenu = NativeUI.CreateMenu("EasyAdmin", "~b~Ban Infos", menuOrientation, 0)
				_menuPool:Add(mainMenu)
				
					mainMenu:SetMenuWidthOffset(menuWidth)	
				_menuPool:ControlDisablingEnabled(false)
				_menuPool:MouseControlsEnabled(false)


				
				local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),banlist[foundBanid].reason)
				mainMenu:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					--nothing
				end	

				if banlist[foundBanid].name then
					local thisItem = NativeUI.CreateItem("Name: "..banlist[foundBanid].name)
					mainMenu:AddItem(thisItem)
					thisItem.Activated = function(ParentMenu,SelectedItem)
						--nothing
					end	
				end
				
				for _, identifier in pairs(banlist[foundBanid].identifiers) do
					if not (GetConvar("ea_IpPrivacy", "false") == "true" and string.split(identifier, ":")[1] == "ip") then
						local thisItem = NativeUI.CreateItem(string.format(GetLocalisedText("identifier"), string.split(identifier, ":")[1]),identifier)
						mainMenu:AddItem(thisItem)
						thisItem.Activated = function(ParentMenu,SelectedItem)
							--nothing
						end	
					end
				end

				local thisItem = NativeUI.CreateItem(GetLocalisedText("unbanplayer"), GetLocalisedText("unbanplayerguide"))
				mainMenu:AddItem(thisItem)
				thisItem.Activated = function(ParentMenu,SelectedItem)
					TriggerServerEvent("EasyAdmin:unbanPlayer", banlist[foundBanid].banid)
					TriggerServerEvent("EasyAdmin:requestBanlist")
					_menuPool:CloseAllMenus()
					Citizen.Wait(800)
					GenerateMenu()
					unbanPlayer:Visible(true)
				end	


				mainMenu:Visible(true)
			else
				ShowNotification(GetLocalisedText("searchbansfail"))
				GenerateMenu()
				unbanPlayer:Visible(true)
			end

		end	

		for i,theBanned in ipairs(banlist) do
			if i<(banlistPage*10)+1 and i>(banlistPage*10)-10 then
				if theBanned then
					reason = theBanned.reason or "No Reason"
					local thisItem = NativeUI.CreateItem(reason, "")
					unbanPlayer:AddItem(thisItem)
					thisItem.Activated = function(ParentMenu,SelectedItem)

						_menuPool:Remove()
						TriggerEvent("EasyAdmin:MenuRemoved")
						_menuPool = NativeUI.CreatePool()
						collectgarbage()
						if not GetResourceKvpString("ea_menuorientation") then
							SetResourceKvp("ea_menuorientation", "right")
							SetResourceKvpInt("ea_menuwidth", 0)
							menuWidth = 0
							menuOrientation = handleOrientation("right")
						else
							menuWidth = GetResourceKvpInt("ea_menuwidth")
							menuOrientation = handleOrientation(GetResourceKvpString("ea_menuorientation"))
						end 
						
						mainMenu = NativeUI.CreateMenu("EasyAdmin", "~b~Ban Infos", menuOrientation, 0)
						_menuPool:Add(mainMenu)
						
							mainMenu:SetMenuWidthOffset(menuWidth)	
						_menuPool:ControlDisablingEnabled(false)
						_menuPool:MouseControlsEnabled(false)
		
		
						
						local thisItem = NativeUI.CreateItem(GetLocalisedText("reason"),banlist[i].reason)
						mainMenu:AddItem(thisItem)
						thisItem.Activated = function(ParentMenu,SelectedItem)
							--nothing
						end	
		
						if banlist[i].name then
							local thisItem = NativeUI.CreateItem("Name: "..banlist[i].name)
							mainMenu:AddItem(thisItem)
							thisItem.Activated = function(ParentMenu,SelectedItem)
								--nothing
							end	
						end
						
						for _, identifier in pairs(banlist[i].identifiers) do
							if not (GetConvar("ea_IpPrivacy", "false") == "true" and string.split(identifier, ":")[1] == "ip") then
								local thisItem = NativeUI.CreateItem(string.format(GetLocalisedText("identifier"), string.split(identifier, ":")[1]),identifier)
								mainMenu:AddItem(thisItem)
								thisItem.Activated = function(ParentMenu,SelectedItem)
									--nothing
								end	
							end
						end
		
						local thisItem = NativeUI.CreateItem(GetLocalisedText("unbanplayer"), GetLocalisedText("unbanplayerguide"))
						mainMenu:AddItem(thisItem)
						thisItem.Activated = function(ParentMenu,SelectedItem)
							TriggerServerEvent("EasyAdmin:unbanPlayer", banlist[i].banid)
							TriggerServerEvent("EasyAdmin:requestBanlist")
							_menuPool:CloseAllMenus()
							Citizen.Wait(800)
							GenerateMenu()
							unbanPlayer:Visible(true)
						end	
		
		
						mainMenu:Visible(true)
					end	
				end
			end
		end


		if #banlist > (banlistPage*10) then 
			local thisItem = NativeUI.CreateItem(GetLocalisedText("lastpage"), "")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				banlistPage = math.ceil(#banlist/10)
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				GenerateMenu()
				unbanPlayer:Visible(true)
			end	
		end

		if banlistPage>1 then 
			local thisItem = NativeUI.CreateItem(GetLocalisedText("firstpage"), "")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				banlistPage = 1
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				GenerateMenu()
				unbanPlayer:Visible(true)
			end	
			local thisItem = NativeUI.CreateItem(GetLocalisedText("previouspage"), "")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				banlistPage=banlistPage-1
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				GenerateMenu()
				unbanPlayer:Visible(true)
			end	
		end
		if #banlist > (banlistPage*10) then
			local thisItem = NativeUI.CreateItem(GetLocalisedText("nextpage"), "")
			unbanPlayer:AddItem(thisItem)
			thisItem.Activated = function(ParentMenu,SelectedItem)
				banlistPage=banlistPage+1
				_menuPool:CloseAllMenus()
				Citizen.Wait(300)
				GenerateMenu()
				unbanPlayer:Visible(true)
			end	
		end 


	end
	


	if permissions["unban"] then
		local sl = {GetLocalisedText("unbanreasons"), GetLocalisedText("unbanlicenses")}
		local thisItem = NativeUI.CreateListItem(GetLocalisedText("banlistshowtype"), sl, 1,GetLocalisedText("banlistshowtypeguide"))
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnListChange = function(sender, item, index)
				if item == thisItem then
						i = item:IndexToItem(index)
						if i == GetLocalisedText(unbanreasons) then
							showLicenses = false
						else
							showLicenses = true
						end
				end
		end
	end
	
	
	if permissions["unban"] then
		local thisItem = NativeUI.CreateItem(GetLocalisedText("refreshbanlist"), GetLocalisedText("refreshbanlistguide"))
		settingsMenu:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			TriggerServerEvent("EasyAdmin:updateBanlist")
		end
	end

	if permissions["ban.temporary"] or permissions["ban.permanent"] then
		local thisItem = NativeUI.CreateItem(GetLocalisedText("refreshcachedplayers"), GetLocalisedText("refreshcachedplayersguide"))
		settingsMenu:AddItem(thisItem)
		thisItem.Activated = function(ParentMenu,SelectedItem)
			TriggerServerEvent("EasyAdmin:requestCachedPlayers")
		end
	end
	
	local thisItem = NativeUI.CreateItem(GetLocalisedText("refreshpermissions"), GetLocalisedText("refreshpermissionsguide"))
	settingsMenu:AddItem(thisItem)
	thisItem.Activated = function(ParentMenu,SelectedItem)
		TriggerServerEvent("EasyAdmin:amiadmin")
	end
	
	local sl = {GetLocalisedText("left"), GetLocalisedText("middle"), GetLocalisedText("right")}
	local thisItem = NativeUI.CreateListItem(GetLocalisedText("menuOrientation"), sl, 1, GetLocalisedText("menuOrientationguide"))
	settingsMenu:AddItem(thisItem)
	settingsMenu.OnListChange = function(sender, item, index)
			if item == thisItem then
					i = item:IndexToItem(index)
					if i == GetLocalisedText("left") then
						SetResourceKvp("ea_menuorientation", "left")
					elseif i == GetLocalisedText("middle") then
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
	local thisItem = NativeUI.CreateSliderItem(GetLocalisedText("menuOffset"), sl, thisi, GetLocalisedText("menuOffsetguide"), false)
	settingsMenu:AddItem(thisItem)
	thisItem.OnSliderSelected = function(index)
		i = thisItem:IndexToItem(index)
		SetResourceKvpInt("ea_menuwidth", i)
		menuWidth = i
	end
	thisi = nil
	sl = nil


	local thisItem = NativeUI.CreateItem(GetLocalisedText("resetmenuOffset"), "")
	settingsMenu:AddItem(thisItem)
	thisItem.Activated = function(ParentMenu,SelectedItem)
		SetResourceKvpInt("ea_menuwidth", 0)
		menuWidth = 0
	end
	
	if permissions["anon"] then
		local thisItem = NativeUI.CreateCheckboxItem(GetLocalisedText("anonymous"), anonymous or false, GetLocalisedText("anonymousguide"))
		settingsMenu:AddItem(thisItem)
		settingsMenu.OnCheckboxChange = function(sender, item, checked_)
			if item == thisItem then
				anonymous = checked_
				TriggerServerEvent("EasyAdmin:SetAnonymous", checked_)
			end
		end
	end

	TriggerEvent("EasyAdmin:BuildSettingsOptions")
	_menuPool:ControlDisablingEnabled(false)
	_menuPool:MouseControlsEnabled(false)
	
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
				table.insert(text,GetLocalisedText("godmodedetected"))
			else
				table.insert(text,GetLocalisedText("godmodenotdetected"))
			end
			if not CanPedRagdoll(targetPed) and not IsPedInAnyVehicle(targetPed, false) and (GetPedParachuteState(targetPed) == -1 or GetPedParachuteState(targetPed) == 0) and not IsPedInParachuteFreeFall(targetPed) then
				table.insert(text,GetLocalisedText("antiragdoll"))
			end
			-- health info
			table.insert(text,GetLocalisedText("health")..": "..GetEntityHealth(targetPed).."/"..GetEntityMaxHealth(targetPed))
			table.insert(text,GetLocalisedText("armor")..": "..GetPedArmour(targetPed))
			-- misc info
			table.insert(text,GetLocalisedText("wantedlevel")..": "..GetPlayerWantedLevel(drawTarget))
			table.insert(text,GetLocalisedText("exitspectator"))
			
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
			
			if (not RedM and IsControlJustPressed(0,103) or (RedM and IsControlJustReleased(0, Controls["VehExit"]))) then
				local targetPed = PlayerPedId()
				local targetPlayer = -1
				local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))
				print("pressed E")
				spectatePlayer(targetPed,targetPlayer,GetPlayerName(targetPlayer))
				TriggerEvent('EasyAdmin:FreezePlayer', false)
				--SetEntityCoords(PlayerPedId(), oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
				if not RedM then
					TriggerEvent('EasyAdmin:FreezePlayer', false)
				end
	
				StopDrawPlayerInfo()
				ShowNotification(GetLocalisedText("stoppedSpectating"))
			end
		else
			Citizen.Wait(1000)
		end
	end
end)
