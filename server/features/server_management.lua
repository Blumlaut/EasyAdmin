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

RegisterServerEvent("EasyAdmin:JoinPlayerRoutingBucket", function(playerId)
	if DoesPlayerHavePermission(source, "player.bucket.join") then
		SetPlayerRoutingBucket(source, GetPlayerRoutingBucket(playerId))
	end
end)

RegisterServerEvent("EasyAdmin:ForcePlayerRoutingBucket", function(playerId)
	if DoesPlayerHavePermission(source, "player.bucket.force") and CanTargetPlayerForModeration(source, playerId) then
		SetPlayerRoutingBucket(playerId, GetPlayerRoutingBucket(source))
	end
end)

function cleanupArea(type, radius, player)
	if not radius then radius = "global" end
	if (onesync ~= "off" and onesync ~= "legacy") then
		local toDelete = {}
		if type == "cars" then
			toDelete = GetAllVehicles()
		elseif type == "peds" then
			toDelete = GetAllPeds()
		elseif type == "props" then
			toDelete = GetAllObjects()
		end
		PrintDebugMessage("server-known entities: "..table_to_string(toDelete), 4)
		for _,entity in pairs(toDelete) do
			PrintDebugMessage("starting deletion for entity "..entity, 4)
			if DoesEntityExist(entity) and not (type == "cars" and IsPedAPlayer(GetPedInVehicleSeat(entity, -1))) and not (type == "peds" and IsPedAPlayer(entity)) then
				if radius == "global" then
					PrintDebugMessage("deleting entity "..entity, 3)
					DeleteEntity(entity)
				else
					local entityCoords = GetEntityCoords(entity)
					local playerCoords = GetEntityCoords(GetPlayerPed(player))
					if #(playerCoords - entityCoords) < radius then
						PrintDebugMessage("deleting entity "..entity, 3)
						DeleteEntity(entity)
					end
				end
			end
		end
		return true
	else
		return false
	end
end
exports('cleanupArea', cleanupArea)

RegisterServerEvent("EasyAdmin:requestCleanup", function(type, radius, deep)
	local source=source
	if DoesPlayerHavePermission(source, "server.cleanup."..type) then
		PrintDebugMessage("Player "..getName(source,true).." Requested Cleanup for "..type, 3)
		cleanupArea(type, radius, source)

		if deep then
			TriggerClientEvent("EasyAdmin:requestCleanup", source, type, radius)
		end
		TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("Finished cleaning {type}", { type = GetLocalisedText(type) }))
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** Cleaned up all **{type}** in a **{radius}** radius.", { by = getName(source, false, true), type = type, radius = radius }), "cleanup", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:SetGameType", function(text)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set Gametype to "..text, 3)
		SetGameType(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** changed convar **{name}** to **{value}**", { by = getName(source, false, true), name = "gametype", value = text }), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:SetMapName", function(text)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set Map Name to "..text, 3)
		SetMapName(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** changed convar **{name}** to **{value}**", { by = getName(source, false, true), name = "mapname", value = text }), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:StartResource", function(text)
	if DoesPlayerHavePermission(source, "server.resources.start") then
		PrintDebugMessage("Player "..getName(source,true).." started Resource "..text, 3)
		StartResource(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** started resource **{name}**", { by = getName(source, false, true), name = text }), "settings", 65280)
	end
end)

RegisterServerEvent("EasyAdmin:StopResource", function(text)
	if DoesPlayerHavePermission(source, "server.resources.stop") then
		PrintDebugMessage("Player "..getName(source,true).." stopped Resource "..text, 3)
		StopResource(text)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** stopped resource **{name}**", { by = getName(source, false, true), name = text }), "settings", 16711680)
	end
end)

RegisterServerEvent("EasyAdmin:SetConvar", function(convarname, convarvalue)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set convar "..convarname.. " to "..convarvalue, 3)
		SetConvar(convarname, convarvalue)
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** changed convar **{name}** to **{value}**", { by = getName(source, false, true), name = convarname, value = convarvalue }), "settings", 16777214)
	end
end)

-- Known convars the NUI can browse and edit.
-- setType: 'set' = SetConvar (server-only), 'setr' = SetConvarReplicated (synced to clients),
--          'sets' = SetConvarServerInfo (appears in server browser / info.json)
local KNOWN_CONVARS = {
	-- FiveM: Server Identity (sets — server info)
	{ key = 'sv_hostname', label = 'Server Hostname', category = 'FiveM: Server', setType = 'set' },
	{ key = 'sv_projectName', label = 'Project Name', category = 'FiveM: Server', setType = 'sets' },
	{ key = 'sv_projectDesc', label = 'Project Description', category = 'FiveM: Server', setType = 'sets' },
	{ key = 'sv_maxClients', label = 'Max Clients', category = 'FiveM: Server', setType = 'set' },
	{ key = 'gametype', label = 'Gametype', category = 'FiveM: Server', setType = 'set' },
	{ key = 'mapname', label = 'Map Name', category = 'FiveM: Server', setType = 'set' },
	{ key = 'sv_appearAllowlisted', label = 'Appear Allowlisted', category = 'FiveM: Server', setType = 'sets' },
	{ key = 'sv_allowlistInstructions', label = 'Allowlist Instructions', category = 'FiveM: Server', setType = 'sets' },
	-- FiveM: Network
	{ key = 'onesync', label = 'OneSync', category = 'FiveM: Network', setType = 'set' },
	{ key = 'sv_endpointPrivacy', label = 'Endpoint Privacy', category = 'FiveM: Network', setType = 'set' },
	{ key = 'net_tcpConnLimit', label = 'TCP Connection Limit', category = 'FiveM: Network', setType = 'set' },
	{ key = 'sv_requestParanoia', label = 'Request Paranoia (0-3)', category = 'FiveM: Network', setType = 'set' },
	-- FiveM: Security
	{ key = 'sv_authMaxVariance', label = 'Auth Max Variance (1-5)', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_authMinTrust', label = 'Auth Min Trust (1-5)', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_pureLevel', label = 'Pure Level', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_filterRequestControl', label = 'Filter Request Control', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_enableNetworkedSounds', label = 'Enable Networked Sounds', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_enableNetworkedPhoneExplosions', label = 'Enable Phone Explosions', category = 'FiveM: Security', setType = 'set' },
	{ key = 'sv_enableNetworkedScriptEntityStates', label = 'Enable Script Entity States', category = 'FiveM: Security', setType = 'set' },
	-- FiveM: Replicated
	{ key = 'sv_stateBagStrictMode', label = 'StateBag Strict Mode', category = 'FiveM: Replicated', setType = 'setr' },
	-- EasyAdmin: General
	{ key = 'ea_LanguageName', label = 'Language', category = 'EasyAdmin: General', setType = 'set' },
	{ key = 'ea_defaultKey', label = 'Menu Key', category = 'EasyAdmin: General', setType = 'set' },
	{ key = 'ea_logLevel', label = 'Log Level', category = 'EasyAdmin: General', setType = 'set' },
	{ key = 'ea_presentDeferral', label = 'Show Loading Progress', category = 'EasyAdmin: General', setType = 'set' },
	{ key = 'ea_enableSplash', label = 'Enable Splash Art', category = 'EasyAdmin: General', setType = 'set' },
	{ key = 'ea_dangerousDevMode', label = 'Dangerous Dev Mode', category = 'EasyAdmin: General', setType = 'set' },
	-- EasyAdmin: Players
	{ key = 'ea_minIdentifierMatches', label = 'Min Identifier Matches', category = 'EasyAdmin: Players', setType = 'set' },
	{ key = 'ea_useTokenIdentifiers', label = 'Use Token Identifiers', category = 'EasyAdmin: Players', setType = 'set' },
	{ key = 'ea_logIdentifier', label = 'Log Identifier', category = 'EasyAdmin: Players', setType = 'set' },
	{ key = 'ea_IpPrivacy', label = 'Hide IP in GUI', category = 'EasyAdmin: Players', setType = 'set' },
	{ key = 'ea_playerCacheExpiryTime', label = 'Player Cache Expiry (s)', category = 'EasyAdmin: Players', setType = 'set' },
	-- EasyAdmin: Moderation
	{ key = 'ea_enableChat', label = 'Enable Chat', category = 'EasyAdmin: Moderation', setType = 'set' },
	{ key = 'ea_maxWarnings', label = 'Max Warnings', category = 'EasyAdmin: Moderation', setType = 'set' },
	{ key = 'ea_warnAction', label = 'Max Warn Action', category = 'EasyAdmin: Moderation', setType = 'set' },
	{ key = 'ea_warningBanTime', label = 'Warning Ban Time (s)', category = 'EasyAdmin: Moderation', setType = 'set' },
	{ key = 'ea_moderationNotification', label = 'Moderation Webhook URL', category = 'EasyAdmin: Moderation', setType = 'set' },
	-- EasyAdmin: Reports
	{ key = 'ea_enableReportCommand', label = 'Enable Report Command', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_reportCommandName', label = 'Report Command Name', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_reportNotification', label = 'Report Webhook URL', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_enableReportScreenshots', label = 'Report Screenshots', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_defaultMinReports', label = 'Default Min Reports', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_ReportBanTime', label = 'Report Ban Time (s)', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_MinReportModifierEnabled', label = 'Min Report Modifier Enabled', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_MinReportPlayers', label = 'Min Report Players', category = 'EasyAdmin: Reports', setType = 'set' },
	{ key = 'ea_MinReportModifier', label = 'Min Report Modifier', category = 'EasyAdmin: Reports', setType = 'set' },
	-- EasyAdmin: Call Admin
	{ key = 'ea_enableCallAdminCommand', label = 'Enable Call Admin', category = 'EasyAdmin: Call Admin', setType = 'set' },
	{ key = 'ea_callAdminCommandName', label = 'Call Admin Command', category = 'EasyAdmin: Call Admin', setType = 'set' },
	{ key = 'ea_callAdminCooldown', label = 'Call Admin Cooldown (s)', category = 'EasyAdmin: Call Admin', setType = 'set' },
	-- EasyAdmin: Ban Message
	{ key = 'ea_banMessageServerName', label = 'Ban Message Server Name', category = 'EasyAdmin: Ban Message', setType = 'set' },
	{ key = 'ea_banMessageShowStaff', label = 'Ban Message Show Staff', category = 'EasyAdmin: Ban Message', setType = 'set' },
	{ key = 'ea_banMessageSubHeader', label = 'Ban Message Sub Header', category = 'EasyAdmin: Ban Message', setType = 'set' },
	{ key = 'ea_banMessageFooter', label = 'Ban Message Footer', category = 'EasyAdmin: Ban Message', setType = 'set' },
	{ key = 'ea_banMessageTitleColour', label = 'Ban Message Title Colour', category = 'EasyAdmin: Ban Message', setType = 'set' },
	{ key = 'ea_banMessageWatermark', label = 'Ban Message Watermark', category = 'EasyAdmin: Ban Message', setType = 'set' },
	-- EasyAdmin: History & Notes
	{ key = 'ea_enableActionHistory', label = 'Enable Action History', category = 'EasyAdmin: History', setType = 'set' },
	{ key = 'ea_actionHistoryExpiry', label = 'Action History Expiry (days)', category = 'EasyAdmin: History', setType = 'set' },
	{ key = 'ea_enableAdminNotes', label = 'Enable Admin Notes', category = 'EasyAdmin: History', setType = 'set' },
	-- EasyAdmin: Backups
	{ key = 'ea_custombanlist', label = 'Custom Banlist', category = 'EasyAdmin: Backups', setType = 'set' },
	{ key = 'ea_backupFrequency', label = 'Backup Frequency (h)', category = 'EasyAdmin: Backups', setType = 'set' },
	{ key = 'ea_maxBackupCount', label = 'Max Backup Count', category = 'EasyAdmin: Backups', setType = 'set' },
	-- EasyAdmin: Screenshots & Streams
	{ key = 'ea_screenshoturl', label = 'Screenshot Uploader URL', category = 'EasyAdmin: Media', setType = 'set' },
	{ key = 'ea_screenshotfield', label = 'Screenshot Field Name', category = 'EasyAdmin: Media', setType = 'set' },
	{ key = 'ea_screenshotMaxResolution', label = 'Screenshot Max Resolution', category = 'EasyAdmin: Media', setType = 'set' },
	{ key = 'ea_screenshotQuality', label = 'Screenshot Quality', category = 'EasyAdmin: Media', setType = 'set' },
	{ key = 'ea_streamMaxResolution', label = 'Stream Max Resolution', category = 'EasyAdmin: Media', setType = 'set' },
	{ key = 'ea_streamTargetFps', label = 'Stream Target FPS', category = 'EasyAdmin: Media', setType = 'set' },
	-- EasyAdmin: Discord Bot
	{ key = 'ea_botToken', label = 'Bot Token', category = 'EasyAdmin: Discord', setType = 'set' },
	{ key = 'ea_botLogChannel', label = 'Bot Log Channel', category = 'EasyAdmin: Discord', setType = 'set' },
	{ key = 'ea_botStatusChannel', label = 'Bot Status Channel', category = 'EasyAdmin: Discord', setType = 'set' },
	-- EasyAdmin: Allowlist
	{ key = 'ea_enableAllowlist', label = 'Enable Allowlist', category = 'EasyAdmin: Allowlist', setType = 'set' },
	{ key = 'ea_routingBucketOptions', label = 'Routing Bucket Options', category = 'EasyAdmin: Allowlist', setType = 'set' },
}

-- Set a convar using the correct function for its type
local function setConvarWithType(key, value, setType)
	if setType == 'setr' then
		SetConvarReplicated(key, value)
	elseif setType == 'sets' then
		SetConvarServerInfo(key, value)
	else
		SetConvar(key, value)
	end
end

RegisterServerEvent("EasyAdmin:requestConvars", function()
	local src = source
	if not DoesPlayerHavePermission(src, "server.convars") then return end

	local convars = {}
	for _, def in ipairs(KNOWN_CONVARS) do
		local value = GetConvar(def.key, nil)
		table.insert(convars, {
			key = def.key,
			label = def.label,
			category = def.category,
			value = value,
			setType = def.setType,
		})
	end

	TriggerClientEvent("EasyAdmin:convarsResult", src, convars)
end)

-- Override SetConvar handler to use the correct type when a setType is provided
RegisterServerEvent("EasyAdmin:SetConvar", function(convarname, convarvalue, setType)
	if DoesPlayerHavePermission(source, "server.convars") then
		PrintDebugMessage("Player "..getName(source,true).." set convar "..convarname.. " to "..convarvalue, 3)
		setConvarWithType(convarname, convarvalue, setType or 'set')
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** changed convar **{name}** to **{value}**", { by = getName(source, false, true), name = convarname, value = convarvalue }), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:requestServerInfo", function()
	local src = source
	if not DoesPlayerHavePermission(src, "server.convars") then return end

	TriggerClientEvent("EasyAdmin:serverInfoResult", src, {
		gametype = GetConvar('gametype', ''),
		mapname = GetConvar('mapname', 'none'),
		hostname = GetConvar('sv_hostname', ''),
		maxClients = GetConvar('sv_maxClients', '48'),
		projectName = GetConvar('sv_projectName', ''),
	})
end)

RegisterServerEvent("EasyAdmin:Announce", function(text)
	if DoesPlayerHavePermission(source, "server.announce") then
		local src = source
		PrintDebugMessage("Player "..getName(src,true).." sent a announcement: "..text, 3)
		announce(text, { name = getName(src, true), id = src })
		local preferredWebhook = getPreferredWebhook()
		SendWebhookMessage(preferredWebhook, GetLocalisedText("**{by}** sent an announcement: **{message}**", { by = getName(source, false, true), message = text }), "settings", 16777214)
	end
end)

RegisterServerEvent("EasyAdmin:SetAnonymous", function(playerId)
	if DoesPlayerHavePermission(source, "anon") then
		if AnonymousAdmins[source] then
			AnonymousAdmins[source] = nil
			PrintDebugMessage("Player "..getName(source,true).." un-anoned themself", 3)
		else
			AnonymousAdmins[source] = true
			PrintDebugMessage("Player "..getName(source,true).." anoned themself", 3)
		end
	end
end)
