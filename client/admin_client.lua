------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
----
----
---- If you are a developer and want to change something, consider writing a plugin instead:
---- https://easyadmin.readthedocs.io/en/latest/plugins/
----
------------------------------------
------------------------------------

players = {}
banlist = {}
cachedplayers = {}
reports = {}
MessageShortcuts = {}
FrozenPlayers = {}
MutedPlayers = {}
MyBucket = 0

local cachedInfo = {
	ped = PlayerPedId(),
	veh = 0,
	player = PlayerId(),
}

local vehicleInfo = {
	netId = nil,
	seat = nil,
}

RegisterNetEvent("EasyAdmin:adminresponse", function(perms)
	permissions = perms

	for perm, val in pairs(perms) do
		if val == true then
			isAdmin = true
		end
	end
end)

function DoesPlayerHavePermission(player,perm)
	if not player == -1 then
		return false
	end
	return permissions[perm]
end

RegisterNetEvent("EasyAdmin:SetSetting", function(setting,state)
	settings[setting] = state
end)

RegisterNetEvent('EasyAdmin:SetLanguage', function(newstrings)
	strings = newstrings
end)

RegisterNetEvent("EasyAdmin:fillBanlist", function(thebanlist)
	banlist = thebanlist
end)

RegisterNetEvent("EasyAdmin:fillCachedPlayers", function(thecached)
	if permissions["player.ban.temporary"] or permissions["player.ban.permanent"] then
		cachedplayers = thecached
	end
end)


RegisterNetEvent("EasyAdmin:GetInfinityPlayerList", function(players)
	playerlist = players
end)

RegisterNetEvent("EasyAdmin:NewReport", function(reportData)
	reports[reportData.id] = reportData
end)

RegisterNetEvent("EasyAdmin:ClaimedReport", function(reportData)
	reports[reportData.id] = reportData
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		for i, menu in pairs(reportMenus) do
			for o,item in pairs(menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("claimreport") then
					setMenuItemTitle(item, GetLocalisedText("claimedby"))
					item:RightLabel(reportData.claimedName)
				end
			end
		end
	end
end)

RegisterNetEvent("EasyAdmin:RemoveReport", function(reportData)
	reports[reportData.id] = nil 
end)


RegisterNetEvent("EasyAdmin:fillShortcuts", function (shortcuts)
	MessageShortcuts = shortcuts
end)

RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(player,state)
	FrozenPlayers[player] = state
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		if playerMenus[tostring(player)].menu then
			for o,item in pairs(playerMenus[tostring(player)].menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("setplayerfrozen") then
					item.Checked = state
				end
			end
		end
	end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(player,state)
	MutedPlayers[player] = state
	if _menuPool and _menuPool:IsAnyMenuOpen() then
		if playerMenus[tostring(player)].menu then
			for o,item in pairs(playerMenus[tostring(player)].menu.Items) do 
				if getMenuItemTitle(item) == GetLocalisedText("mute") then
					item.Checked = state
				end
			end
		end
	end
end)

function FreezeMyself(state)

	if state then
		if frozen then return end -- prevents double threads
		CreateThread(function()
	
			while frozen do 
	
				FreezeEntityPosition(cachedInfo.ped, frozen)
				if cachedInfo.veh ~= 0 then
					FreezeEntityPosition(cachedInfo.veh, frozen)
				end
				DisablePlayerFiring(cachedInfo.player, true)
	
				Wait(0)
	
			end
	
		end)
	else
		-- unfreeze
		local localPlayerPedId = PlayerPedId()
		FreezeEntityPosition(localPlayerPedId, false)
		if IsPedInAnyVehicle(localPlayerPedId, true) then
			FreezeEntityPosition(GetVehiclePedIsIn(localPlayerPedId, true), false)
		end
	end

end

RegisterNetEvent("EasyAdmin:CopyDiscord", function(discord)
	copyToClipboard(discord)
end)

RegisterNetEvent("EasyAdmin:requestSpectate", function(playerServerId, playerData)
	
	local localPlayerPed = PlayerPedId()
	
	if IsPedInAnyVehicle(localPlayerPed) then
		local vehicle = GetVehiclePedIsIn(localPlayerPed, false)
		local numVehSeats = GetVehicleModelNumberOfSeats(GetEntityModel(vehicle))
		vehicleInfo.netId = VehToNet(vehicle)
		for i = -1, numVehSeats do
			if GetPedInVehicleSeat(vehicle, i) == localPlayerPed then
				vehicleInfo.seat = i
				break
			end
		end
	end

	if playerData.selfbucket then
		-- cache old bucket to restore at end of spectate
		if not IsSpectating then
			MyBucket = playerData.selfbucket
		end
	end

	local tgtCoords = playerData.coords
	
	if ((not tgtCoords) or (tgtCoords.z == 0.0)) then tgtCoords = GetEntityCoords(GetPlayerPed(GetPlayerFromServerId(playerServerId))) end
	
	if not IsSpectating then
		oldCoords = GetEntityCoords(PlayerPedId())
	end

	SetEntityCoords(localPlayerPed, tgtCoords.x, tgtCoords.y, tgtCoords.z - 10.0, 0, 0, 0, false)
	frozen = true
	FreezeMyself(true)
	stopSpectateUpdate = true
	local playerId = GetPlayerFromServerId(playerServerId)
	local timer = 0
	repeat
		Wait(200)
		playerId = GetPlayerFromServerId(playerServerId)
		timer = timer + 1
	until ( (GetPlayerPed(playerId) > 0) and (playerId ~= -1) or timer > 25)
	if timer >= 25 then
		return
	end
	spectatePlayer(GetPlayerPed(playerId),playerId,GetPlayerName(playerId))
	stopSpectateUpdate = false 
end)

Citizen.CreateThread(function()
	RegisterNetEvent("EasyAdmin:requestCleanup", function(type, radius)

		local toDelete = {}
		local deletionText = ""
		if type == "cars" then
			toDelete = GetGamePool("CVehicle")
			deletionText = GetLocalisedText("cleaningcar")
		elseif type == "peds" then
			toDelete = GetGamePool("CPed")
			deletionText = GetLocalisedText("cleaningped")
		elseif type == "props" then
			toDelete = mergeTables(GetGamePool("CObject"), GetGamePool("CPickup"))
			deletionText = GetLocalisedText("cleaningprop")
		end

		for _,entity in pairs(toDelete) do
			PrintDebugMessage("starting deletion for entity "..entity, 4)
			if DoesEntityExist(entity) then
				if (type == "cars" and not IsPedAPlayer(GetPedInVehicleSeat(entity, -1))) then
					if not NetworkHasControlOfEntity(entity) then
						local i=0
						repeat 
							NetworkRequestControlOfEntity(entity)
							i=i+1
							Wait(150)
						until (NetworkHasControlOfEntity(entity) or i==500)
					end

					-- draw text
					SetTextFont(2)
					SetTextColour(255, 255, 255, 200)
					SetTextProportional(1)
					SetTextScale(0.0, 0.6)
					SetTextDropshadow(0, 0, 0, 0, 255)
					SetTextEdge(1, 0, 0, 0, 255)
					SetTextDropShadow()
					SetTextOutline()
					SetTextEntry("STRING")
					AddTextComponentString(string.format(deletionText, entity))
					EndTextCommandDisplayText(0.45, 0.95)

					-- delete entity
					if radius == "global" then
						PrintDebugMessage("deleting entity "..entity, 3)
						SetEntityAsNoLongerNeeded(entity)
						DeleteEntity(entity)
					else
						local entityCoords = GetEntityCoords(entity)
						local playerCoords = GetEntityCoords(PlayerPedId())
						if #(playerCoords - entityCoords) < radius then
							PrintDebugMessage("deleting entity "..entity, 3)
							SetEntityAsNoLongerNeeded(entity)
							DeleteEntity(entity)
						end
					end
					Wait(1)
				end
				toDelete[i] = nil
			end
		end
	end)
end)

Citizen.CreateThread( function()
	while true do
		Citizen.Wait(500)
		local localPlayerPed = PlayerPedId()
		if drawInfo and not stopSpectateUpdate then
			local targetPed = GetPlayerPed(drawTarget)
			local targetGod = GetPlayerInvincible(drawTarget)
			
			local tgtCoords = GetEntityCoords(targetPed)
			if tgtCoords and tgtCoords.x ~= 0 then
				SetEntityCoords(localPlayerPed, tgtCoords.x, tgtCoords.y, tgtCoords.z - 10.0, 0, 0, 0, false)
			end
		else
			Citizen.Wait(1000)
		end
		cachedInfo = {
			ped = localPlayerPed,
			veh = GetVehiclePedIsIn(localPlayerPed, false),
			player = PlayerId(),
		}
	end
end)


RegisterNetEvent("EasyAdmin:TeleportPlayerBack", function(id, tgtCoords)
	if lastLocation then
		SetEntityCoords(PlayerPedId(), lastLocation,0,0,0, false)
		lastLocation=nil
	end
end)

RegisterNetEvent("EasyAdmin:TeleportRequest", function(id, tgtCoords)
	if id then
		if (tgtCoords.x == 0.0 and tgtCoords.y == 0.0 and tgtCoords.z == 0.0) then
			local tgtPed = GetPlayerPed(GetPlayerFromServerId(id))
			tgtCoords = GetEntityCoords(tgtPed)
		end
		lastLocation = GetEntityCoords(PlayerPedId())
		SetEntityCoords(PlayerPedId(), tgtCoords,0,0,0, false)
	else
		lastLocation = GetEntityCoords(PlayerPedId())
		SetEntityCoords(PlayerPedId(), tgtCoords,0,0,0, false)
	end
end)

RegisterNetEvent("EasyAdmin:SlapPlayer", function(slapAmount)
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

RegisterNetEvent("EasyAdmin:FreezePlayer", function(toggle)
	frozen = toggle
	FreezeMyself(frozen)
end)


RegisterNetEvent("EasyAdmin:CaptureScreenshot", function(toggle, url, field)
	exports['screenshot-basic']:requestScreenshotUpload(GetConvar("ea_screenshoturl", 'https://wew.wtf/upload.php'), GetConvar("ea_screenshotfield", 'files[]'), function(data)
		TriggerLatentServerEvent("EasyAdmin:TookScreenshot", 100000, data)
	end)
end)

function spectatePlayer(targetPed,target,name)
	local playerPed = PlayerPedId() -- yourself
	enable = true
	if (target == PlayerId() or target == -1) then 
		enable = false
	end

	if(enable)then
		SetEntityVisible(playerPed, false, 0)
		SetEntityCollision(playerPed, false, false)
		SetEntityInvincible(playerPed, true)
		NetworkSetEntityInvisibleToNetwork(playerPed, true)
		Wait(200) -- to prevent target player seeing you
		if targetPed == playerPed then
			Wait(500)
			targetPed = GetPlayerPed(target)
		end
		local targetx,targety,targetz = table.unpack(GetEntityCoords(targetPed, false))
		RequestCollisionAtCoord(targetx,targety,targetz)
		NetworkSetInSpectatorMode(true, targetPed)
		
		DrawPlayerInfo(target)
		TriggerEvent("EasyAdmin:showNotification", string.format(GetLocalisedText("spectatingUser"), name))
	else
		if oldCoords then
			RequestCollisionAtCoord(oldCoords.x, oldCoords.y, oldCoords.z)
			Wait(500)
			SetEntityCoords(playerPed, oldCoords.x, oldCoords.y, oldCoords.z, 0, 0, 0, false)
		end
		NetworkSetInSpectatorMode(false, targetPed)
		StopDrawPlayerInfo()
		TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("stoppedSpectating"))
		frozen = false
		FreezeMyself(false)
		Wait(200) -- to prevent staying invisible
		SetEntityVisible(playerPed, true, 0)
		SetEntityCollision(playerPed, true, true)
		SetEntityInvincible(playerPed, false)
		NetworkSetEntityInvisibleToNetwork(playerPed, false)
		if vehicleInfo.netId and vehicleInfo.seat then
			local vehicle = NetToVeh(vehicleInfo.netId)
			if DoesEntityExist(vehicle) then
				if IsVehicleSeatFree(vehicle, vehicleInfo.seat) then
					SetPedIntoVehicle(playerPed, vehicle, vehicleInfo.seat)
				else
					TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("spectatevehicleseatoccupied"))
				end
			else
				TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("spectatenovehiclefound"))
			end

			vehicleInfo.netId = nil
			vehicleInfo.seat = nil
		end
	end
end

---Displays a notification message to the player with EasyAdmin branding.
---@param text string @The message text to display in the notification
function ShowNotification(text)
	if not RedM then
		local notificationTxd = CreateRuntimeTxd("easyadmin_notification")
		CreateRuntimeTextureFromImage(notificationTxd, 'small_logo', 'dependencies/images/small-logo-bg.png')
		BeginTextCommandThefeedPost("STRING")
		AddTextComponentSubstringPlayerName(text)

		local title = "~bold~EasyAdmin"
		local subtitle = GetLocalisedText("notification")
		local iconType = 0
		local flash = false

		EndTextCommandThefeedPostMessagetext("easyadmin_notification", "small_logo", flash, iconType, title, subtitle)
		local showInBrief = false
		local blink = false
		EndTextCommandThefeedPostTicker(blink, showInBrief)

	else
		-- someone who has RedM installed please write some code for this
		
	end
end

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	TriggerEvent("EasyAdmin:receivedNotification")
	if not WasEventCanceled() then
		ShowNotification(text)
	end
end)