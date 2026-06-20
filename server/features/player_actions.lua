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

RegisterServerEvent("EasyAdmin:kickPlayer", function(playerId,reason)
	local src = source
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(src, "player.kick") and CheckAdminCooldown(src, "kick") and CanTargetPlayerForModeration(src, playerId) then
		SetAdminCooldown(src, "kick")
		reason = formatShortcuts(reason)
		SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(src, false, true), getName(playerId, true, true), reason), "kick", 16711680)
		PrintDebugMessage("Kicking Player "..getName(src, true).." for "..reason, 3)
		if GetConvar("ea_enableActionHistory", "true") == "true" then
			Storage.addAction("KICK", getAllPlayerIdentifiers(playerId), reason, getName(src), getAllPlayerIdentifiers(src))
		end
		DropPlayer(playerId, string.format(GetLocalisedText("kicked"), getName(src), reason) )
	end
end)

RegisterServerEvent("EasyAdmin:requestSpectate", function(playerId)
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(source, "player.spectate") and CheckAdminCooldown(source, "spectate") then
		SetAdminCooldown(source, "spectate")
		PrintDebugMessage("Player "..getName(source,true).." Requested Spectate to "..getName(playerId,true), 3)
		local tgtPed = GetPlayerPed(playerId)
		if tgtPed == 0 then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
			return
		end

		if playerId == source and not IsDangerousDevModeEnabled() then
			return
		end

		local tgtCoords = GetEntityCoords(tgtPed)
		if tgtCoords.x == 0.00 and tgtCoords.y == 0.00 then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
			return
		end

		local playerBucket = GetPlayerRoutingBucket(playerId)
		local sourceBucket = GetPlayerRoutingBucket(source)
		if sourceBucket ~= playerBucket then
			SetPlayerRoutingBucket(source, playerBucket)
		end
		local playerData = { coords = tgtCoords, selfbucket = sourceBucket }
		TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, playerData)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText('spectatedplayer'), getName(source, false, true), getName(playerId, true, true)), "spectate", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:requestBucket", function(playerId)
	if DoesPlayerHavePermission(source, "player.spectate") then
		local playerBucket = GetPlayerRoutingBucket(playerId)
		local sourceBucket = GetPlayerRoutingBucket(source)
		if sourceBucket ~= playerBucket then
			SetPlayerRoutingBucket(source, playerBucket)
			local tgtCoords = GetEntityCoords(GetPlayerPed(playerId))
			local playerData = { coords = tgtCoords }
			TriggerClientEvent("EasyAdmin:requestSpectate", source, playerId, playerData)
		end
	end
end)

RegisterServerEvent("EasyAdmin:resetBucket", function(originalBucket)
	if DoesPlayerHavePermission(source, "player.spectate") then
		local sourceBucket = GetPlayerRoutingBucket(source)
		if sourceBucket ~= originalBucket then
			SetPlayerRoutingBucket(source, originalBucket)
		end
	end
end)

RegisterServerEvent("EasyAdmin:TeleportPlayerToCoords", function(playerId,tgtCoords)
	if playerId ~= -1 and (not playerId or not isPlayerOnline(playerId)) then
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidplayer"))
		return
	end

	local source=source
	if DoesPlayerHavePermission(source, "player.teleport.single") and CheckAdminCooldown(source, "teleport") then
		SetAdminCooldown(source, "teleport")
		PrintDebugMessage("Player "..getName(source,true).." requsted teleport to "..tgtCoords.x..", "..tgtCoords.y..", "..tgtCoords.z, 3)
		local preferredWebhook = getPreferredWebhook()
		local playerName = getName(playerId, true, true)
		if playerId == -1 then
			playerName = GetLocalisedText("allplayers")
		elseif not CanTargetPlayerForModeration(source, playerId) then
			return
		end
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("teleportedtoplayer"), playerName, getName(source, false, true)), "teleport", 16777214)
		TriggerClientEvent("EasyAdmin:TeleportRequest", playerId, false, tgtCoords)
	end
end)

RegisterServerEvent("EasyAdmin:TeleportAdminToPlayer", function(id)
	local source=source
	if CachedPlayers[id] and not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") and CheckAdminCooldown(source, "teleport") then
		SetAdminCooldown(source, "teleport")
		local tgtPed = GetPlayerPed(id)
		if tgtPed == 0 then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
			return
		end
		if id == source and not IsDangerousDevModeEnabled() then
			return
		end
		local tgtCoords = GetEntityCoords(tgtPed)
		if tgtCoords.x == 0.00 and tgtCoords.y == 0.00 then
			TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
			return
		end
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("teleportedtoplayer"), getName(source, false, true), getName(id, true, true)), "teleport", 16777214)
		TriggerClientEvent('EasyAdmin:TeleportRequest', source, id,tgtCoords)
	else
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("playernotfound"))
		PrintDebugMessage('EASYADMIN FAILED TO TELEPORT'..source..' TO ID: '..id, 2)
	end
end)

RegisterServerEvent("EasyAdmin:TeleportPlayerBack", function(id)
	local source=source
	if CachedPlayers[id] and not CachedPlayers[id].dropped and DoesPlayerHavePermission(source, "player.teleport.single") and CanTargetPlayerForModeration(source, id) then
		TriggerClientEvent('EasyAdmin:TeleportPlayerBack', id)
	end
end)

function slapPlayer(playerId,slapAmount,source)
	if CanTargetPlayerForModeration(source, playerId) then
		TriggerClientEvent("EasyAdmin:SlapPlayer", playerId, slapAmount)
		return true
	else
		return false
	end
end
exports('slapPlayer', slapPlayer)

RegisterServerEvent("EasyAdmin:SlapPlayer", function(playerId,slapAmount)
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(source, "player.slap") and CheckAdminCooldown(source, "slap") and slapPlayer(playerId, slapAmount, source) then
		SetAdminCooldown(source, "slap")
		PrintDebugMessage("Player "..getName(source,true).." slapped "..getName(playerId,true).." for "..slapAmount.." HP", 3)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminslappedplayer"), getName(source, false, true), getName(playerId, true, true), slapAmount), "slap", 16777214)
	end
end)

function freezePlayer(playerId, toggle, source)
	if not toggle then toggle = not FrozenPlayers[playerId] end
	if CanTargetPlayerForModeration(source, playerId) then
		FrozenPlayers[playerId] = (toggle == true or nil)
		TriggerClientEvent("EasyAdmin:FreezePlayer", playerId, toggle)
		for i,_ in pairs(OnlineAdmins) do
			TriggerLatentClientEvent("EasyAdmin:SetPlayerFrozen", i, 1000, playerId, (toggle == true or nil))
		end
		return true
	else
		return false
	end
end
exports('freezePlayer', freezePlayer)

RegisterServerEvent("EasyAdmin:FreezePlayer", function(playerId,toggle)
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(source, "player.freeze") and CheckAdminCooldown(source, "freeze") and freezePlayer(playerId, toggle, source) then
		local preferredWebhook = getPreferredWebhook()
		if toggle then
			SetAdminCooldown(source, "freeze")
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminfrozeplayer"), getName(source, false, true), getName(playerId, true, true)), "freeze", 16777214)
			PrintDebugMessage("Player "..getName(source,true).." froze "..getName(playerId,true), 3)
		else
			SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("adminunfrozeplayer"), getName(source, false, true), getName(playerId, true, true)), "freeze", 16777214)
			PrintDebugMessage("Player "..getName(source,true).." unfroze "..getName(playerId,true), 3)
		end
	end
end)

scrinprogress = false
function isScreenshotInProgress()
	return scrinprogress
end
exports('isScreenshotInProgress', isScreenshotInProgress)


--- Complete a pending screenshot (called by client/screenshot.lua via TookScreenshot).
--- Args: targetPlayerId (the player who was captured), result (data URI or 'ERROR').
local function completeScreenshot(targetPlayerId, result)
	if scrinprogress == false then return end
	scrinprogress = false

	local adminSrc = scrinprogress_admin or source

	if result == "ERROR" then
		PrintDebugMessage("Screenshot failed for player "..getName(targetPlayerId, true), 2)
		TriggerClientEvent("EasyAdmin:showNotification", adminSrc, GetLocalisedText("screenshotinprogress") or "Screenshot Failed!")
		return
	end

	-- Send data URI to admin's NUI for display in the floating viewer
	TriggerClientEvent('EasyAdmin:ScreenshotReceived', adminSrc, result, getName(targetPlayerId, true))

	-- Also upload to external host if configured (for webhooks / chat)
	-- Skip upload if a stream is active for this player (frames stay local)
	local uploadUrl = GetConvar('ea_screenshoturl', 'none')
	local streamActive = exports.EasyAdmin:isStreamActive(targetPlayerId) or false
	if uploadUrl ~= 'none' and uploadUrl ~= '' and not streamActive then
		local field = GetConvar('ea_screenshotfield', 'files[]')
		PerformHttpRequest(uploadUrl, function(body, statusCode) 
			if statusCode and statusCode >= 200 and statusCode < 300 and body and body ~= '' then
				local res = matchURL(tostring(body)) or body
				local invokingResource
				if scrinprogress_invoking then
					invokingResource = scrinprogress_invoking
				elseif GetInvokingResource() and GetInvokingResource() ~= GetCurrentResourceName() then
					invokingResource = "`"..GetInvokingResource().."`"
				end
				PrintDebugMessage("Screenshot taken, result:\n "..res, 4)
				SendWebhookMessage(moderationNotification, string.format(GetLocalisedText("admintookscreenshot"), invokingResource or getName(adminSrc), getName(targetPlayerId, true, true), res), "screenshot", 16777214, "Screenshot Captured", res)
				TriggerClientEvent("chat:addMessage", adminSrc, { args = { "EasyAdmin", string.format(GetLocalisedText("screenshotlink"), res) } })
			end
		end, 'POST', json.encode({
			[field] = result,
		}), {
			['Content-Type'] = 'application/json',
		})
	else
		-- No external uploader or stream active — just log
		if not streamActive then
			local invokingResource
			if scrinprogress_invoking then
				invokingResource = scrinprogress_invoking
			elseif GetInvokingResource() and GetInvokingResource() ~= GetCurrentResourceName() then
				invokingResource = "`"..GetInvokingResource().."`"
			end
			PrintDebugMessage("Screenshot taken for "..getName(targetPlayerId, true) .." (no external upload)", 4)
			SendWebhookMessage(moderationNotification, string.format(GetLocalisedText("admintookscreenshot"), invokingResource or getName(adminSrc), getName(targetPlayerId, true, true), "(local)"), "screenshot", 16777214, "Screenshot Captured")
		else
			PrintDebugMessage("Screenshot taken for "..getName(targetPlayerId, true) .." (stream active, skipping upload/webhook)", 4)
		end
	end

	PrintDebugMessage("Screenshot for Player "..getName(targetPlayerId, true) .." done, requested by "..getName(adminSrc, true), 3)
end
--- Global state for tracking the in-progress screenshot.
local scrinprogress_admin = nil
local scrinprogress_target = nil
local scrinprogress_invoking = nil
local scrinprogress_timer = nil

RegisterServerEvent("EasyAdmin:TakeScreenshot", function(playerId)
	local src = source
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("invalidplayer"))
		return
	end
	if scrinprogress then
		TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("screenshotinprogress"))
		return
	end
	if DoesPlayerHavePermission(src, "player.screenshot") and CheckAdminCooldown(src, "screenshot") and CanTargetPlayerForModeration(src, playerId) then
		local invokingResource
		if GetInvokingResource() and GetInvokingResource() ~= GetCurrentResourceName() then
			invokingResource = "`"..GetInvokingResource().."`"
		end
		SetAdminCooldown(src, "screenshot")

		-- Track state for the async callback
		scrinprogress = true
		scrinprogress_admin = src
		scrinprogress_target = playerId
		scrinprogress_invoking = invokingResource

		-- 25-second timeout (non-blocking)
		scrinprogress_timer = SetTimeout(25000, function()
			if scrinprogress then
				PrintDebugMessage("Screenshot timed out for player "..getName(playerId, true), 4)
				TriggerClientEvent("EasyAdmin:showNotification", scrinprogress_admin, "Screenshot Failed!")
				scrinprogress = false
				scrinprogress_admin = nil
				scrinprogress_target = nil
				scrinprogress_invoking = nil
				scrinprogress_timer = nil
			end
		end)

		TriggerClientEvent("EasyAdmin:CaptureScreenshot", playerId, src)
	end
end)

--- Result callback from client/screenshot.lua.
--- Receives: result (hosted URL, data URI, or 'ERROR').
RegisterServerEvent("EasyAdmin:TookScreenshot", function(result)
	if scrinprogress_timer then
		ClearTimeout(scrinprogress_timer)
		scrinprogress_timer = nil
	end
	completeScreenshot(scrinprogress_target, result)
end)

RegisterServerEvent("EasyAdmin:mutePlayer", function(playerId)
	local src = source
	if not playerId or not isPlayerOnline(playerId) then
		TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(src,"player.mute") and CheckAdminCooldown(src, "mute") then
		SetAdminCooldown(src, "mute")
		local muted = mutePlayer(playerId, not MutedPlayers[playerId], src)
		if muted then
			if MutedPlayers[playerId] then
				TriggerClientEvent("EasyAdmin:showNotification", src, getName(playerId) .. " " .. GetLocalisedText("playermuted"))
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminmutedplayer"), getName(src, false, true), getName(playerId, false, true)), "mute", 16777214)
			else
				TriggerClientEvent("EasyAdmin:showNotification", src, getName(playerId) .. " " .. GetLocalisedText("playerunmuted"))
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunmutedplayer"), getName(src, false, false), getName(playerId, false, true)), "mute", 16777214)
			end
		end
	end
end)

function mutePlayer(playerId, toggle, source)
	if CanTargetPlayerForModeration(source, playerId) then
		if toggle and not MutedPlayers[playerId] then
			MutedPlayers[playerId] = true
			if MumbleSetPlayerMuted then
				MumbleSetPlayerMuted(playerId, true)
			end
			PrintDebugMessage("muted "..getName(playerId,true), 3)
			for i,_ in pairs(OnlineAdmins) do
				TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, playerId, (MutedPlayers[playerId] == true or nil))
			end
			return true
		elseif not toggle and MutedPlayers[playerId] then
			MutedPlayers[playerId] = nil
			if MumbleSetPlayerMuted then
				MumbleSetPlayerMuted(playerId, false)
			end
			PrintDebugMessage("unmuted "..getName(playerId,true), 3)
			for i,_ in pairs(OnlineAdmins) do
				TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, playerId, (MutedPlayers[playerId] == true or nil))
			end
			return true
		else
			return false
		end
	else
		return false
	end
end
exports('mutePlayer', mutePlayer)

RegisterServerEvent("EasyAdmin:warnPlayer", function(id, reason)
	local src = source
	if not id or not isPlayerOnline(id) then
		TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("invalidplayer"))
		return
	end

	if DoesPlayerHavePermission(src,"player.warn") and CheckAdminCooldown(src, "warn") and CanTargetPlayerForModeration(src, id) then
		SetAdminCooldown(src, "warn")
		reason = formatShortcuts(reason)
		local maxWarnings = GetConvarInt("ea_maxWarnings", 3)
		if not WarnedPlayers[id] then
			WarnedPlayers[id] = {name = getName(id, true), identifiers = getAllPlayerIdentifiers(id), warns = 0}
		end
		WarnedPlayers[id].warns = WarnedPlayers[id].warns+1
		TriggerClientEvent('chat:addMessage', id, {
			template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0} </div>',
			args = {  string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings) }, color = { 255, 255, 255 }
		})
		TriggerClientEvent("EasyAdmin:showWarning", id, getName(src), string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
		SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminwarnedplayer"), getName(src, false, true), getName(id, true, true), reason, WarnedPlayers[id].warns, maxWarnings), "warn", 16711680)
		if GetConvar("ea_enableActionHistory", "true") == "true" then
 			Storage.addAction("WARN", getAllPlayerIdentifiers(id), reason, getName(src, true, false), getAllPlayerIdentifiers(src))
 		end
		if WarnedPlayers[id].warns >= maxWarnings then
			if GetConvar("ea_warnAction", "kick") == "kick" then
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), getName(src, false, true), getName(id, true, true), reason), "kick", 16711680)
				DropPlayer(id, GetLocalisedText("warnkicked"))
				WarnedPlayers[id] = nil
				if GetConvar("ea_enableActionHistory", "true") == "true" then Storage.addAction("KICK", getCachedPlayerIdentifiers(id) or getAllPlayerIdentifiers(id), "Reached maximum warnings", getName(src, true, false), getAllPlayerIdentifiers(src)) end
			elseif GetConvar("ea_warnAction", "kick") == "ban" then
				local bannedIdentifiers = getCachedPlayerIdentifiers(id) or getAllPlayerIdentifiers(id)
				local bannedUsername = getCachedPlayerName(id) or getName(id, true)
				local expires = os.time()+GetConvarInt("ea_warningBanTime", 604800)

				reason = GetLocalisedText("warnbanned").. string.format(GetLocalisedText("reasonadd"), getCachedPlayerName(id), getName(src, true) )
				local banId = GetFreshBanId()
				Storage.addBan(banId, bannedUsername, bannedIdentifiers, getName(src, true), reason, expires, formatDateString(expires), "BAN", os.time())
				Storage.addAction("BAN", bannedIdentifiers, "Reached maximum warnings", getName(src, true), getAllPlayerIdentifiers(src), banId)

				PrintDebugMessage("Player "..getName(src,true).." warnbanned player "..getCachedPlayerName(id).." for "..reason, 3)
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), getName(src, false, true), bannedUsername, reason, formatDateString( expires ), tostring(banId) ), "ban", 16711680)
				DropPlayer(id, string.format(GetLocalisedText("banned"), reason, formatDateString( expires ) ) )
				WarnedPlayers[id] = nil
			end
		end
	end
end)

function warnPlayerExport(src, id, reason)
	if not id or not isPlayerOnline(id) then
		return false
	end

	if CanTargetPlayerForModeration(src, id) then
		local maxWarnings = GetConvarInt("ea_maxWarnings", 3)
		if not WarnedPlayers[id] then
			WarnedPlayers[id] = {name = getName(id, true), identifiers = getAllPlayerIdentifiers(id), warns = 0}
		end
		WarnedPlayers[id].warns = WarnedPlayers[id].warns+1
		TriggerClientEvent('chat:addMessage', id, {
			template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0} </div>',
			args = {  string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings) }, color = { 255, 255, 255 }
		})
		SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminwarnedplayer"), src, getName(id, true, true), reason, WarnedPlayers[id].warns, maxWarnings), "warn", 16711680)
		TriggerClientEvent("EasyAdmin:showWarning", id, src, string.format(GetLocalisedText("warned"), reason, WarnedPlayers[id].warns, maxWarnings), GetLocalisedText("warnedtitle"), GetLocalisedText("warnedby"),GetLocalisedText("warndismiss"))
		if WarnedPlayers[id].warns >= maxWarnings then
			if GetConvar("ea_warnAction", "kick") == "kick" then
				SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminkickedplayer"), src, getName(id, true, true), reason), "kick", 16711680)
				DropPlayer(id, GetLocalisedText("warnkicked"))
				WarnedPlayers[id] = nil
			elseif GetConvar("ea_warnAction", "kick") == "ban" then
				local expires = os.time()+GetConvarInt("ea_warningBanTime", 604800)
				addBanExport(id, reason, formatDateString(expires), src)
				WarnedPlayers[id] = nil
			end
		end
		return true
	else
		return false
	end
end
exports('warnPlayer', warnPlayerExport)

function getPlayerWarnings(playerId)
	if not WarnedPlayers[playerId] then
		return 0
	else
		return WarnedPlayers[playerId].warns
	end
end
exports('getPlayerWarnings', getPlayerWarnings)
