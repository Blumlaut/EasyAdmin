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

AddEventHandler("EasyAdmin:GetVersion", function(cb)
	cb(GetVersion())
end)

local chatEventsSupported = false
pcall(function()
	if exports.chat.registerMessageHook and exports.chat.registerMode then
		chatEventsSupported = true
	end
end)

if chatEventsSupported then
	exports.chat:registerMessageHook(function(source, outMessage, hookRef)
		if GlobalMute then
			if not DoesPlayerHavePermission(source, "server.mute.global") then
				hookRef.cancel()
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("Global Mute is active."))
			end
			return
		end
		if MutedPlayers[source] then
			hookRef.cancel()
			TriggerClientEvent("EasyAdmin:showNotification", source, getName(source) .. ", " .. GetLocalisedText("You are muted!"))
		end
	end)
else
	AddEventHandler('chatMessage', function(source, name, msg)
		if GlobalMute then
			if not DoesPlayerHavePermission(source, "server.mute.global") then
				CancelEvent()
				TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("Global Mute is active.") } })
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("Global Mute is active."))
				return
			end
		end
		if MutedPlayers[source] then
			CancelEvent()
			TriggerClientEvent("chat:addMessage", source, { args = { "EasyAdmin", GetLocalisedText("You are muted!") } })
			TriggerClientEvent("EasyAdmin:showNotification", source, getName(source) .. ", " .. GetLocalisedText("You are muted!"))
		end
	end)
end

if GetConvar("ea_enableChat", "true") == "true" and chatEventsSupported then
	exports.chat:registerMode({
		name = "admins",
		displayName = "Admin Chat",
		color = "#19A2E3",
		seObject = "easyadmin.server.chat",
		cb = function(source, message, cbs)
			cbs.updateMessage({
				template = "^5[ADMIN CHAT]^7" .. ' {}'
			})
			cbs.setSeObject("easyadmin.server.chat")
		end
	})
end

function getLatestVersion()
	local latestVersion,latestURL
	local requestDone = false

	PerformHttpRequest("https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest", function(err,response,headers)
		if err == 200 then
			local success, data = pcall(json.decode, response)
			if success and data and data.tag_name then
				latestVersion = data.tag_name
				latestURL = data.html_url or "https://github.com/Blumlaut/EasyAdmin"
			else
				latestVersion = GetVersion()
				latestURL = "https://github.com/Blumlaut/EasyAdmin"
				PrintDebugMessage("Version check returned invalid JSON", 4)
			end
		else
			latestVersion = GetVersion()
			latestURL = "https://github.com/Blumlaut/EasyAdmin"
		end
		PrintDebugMessage("Version check returned "..err..", Local Version: "..GetVersion()..", Remote Version: "..latestVersion, 4)
		requestDone = true
	end, "GET")

	local attempts = 0
	repeat
		Wait(50)
		attempts = attempts + 1
	until (requestDone or attempts >= 100) -- 5 second timeout (100 * 50ms)

	if not requestDone then
		PrintDebugMessage("Version check timed out after 5 seconds", 2)
		latestVersion = latestVersion or GetVersion()
		latestURL = latestURL or "https://github.com/Blumlaut/EasyAdmin"
	end

	return latestVersion, latestURL
end
exports('getLatestVersion', getLatestVersion)

local curVersion, isMaster = GetVersion()
local resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"

-- Check that build artifacts exist before proceeding
local missingArtifacts = {}

if not LoadResourceFile(GetCurrentResourceName(), 'bot/dist/bot.js') then
    table.insert(missingArtifacts, 'bot/dist/bot.js')
end

if not LoadResourceFile(GetCurrentResourceName(), 'nui/dist/index.html') then
    table.insert(missingArtifacts, 'nui/dist/index.html')
end

if #missingArtifacts > 0 then
    print('^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7')
    print('')
    print('^1EasyAdmin: Build artifacts are missing!^7')
    print('')
    print('^1Missing files:^7')
    for _, file in ipairs(missingArtifacts) do
        print('  ^1-^7 ' .. file)
    end
    print('')
    print('^1EasyAdmin cannot function without its build artifacts.^7')
    print('^1Please run the build before starting the server:^7')
    print('')
    print('  ^6npm run build^7')
    print('')
    print('^1Or build individually:^7')
    print('  ^6npm run build:bot^7   -- build the Discord bot')
    print('  ^6npm run build:nui^7   -- build the NUI frontend')
    print('')
    print('^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7')
end

-- Update info state: populated by checkVersion(), consumed by NUI
local updateInfo = {
  currentVersion = curVersion,
  latestVersion = curVersion,
  available = false,
}

function checkVersion()
	local remoteVersion,remoteURL = getLatestVersion()

	if KvpGet('scurrentVersion') ~= curVersion then
		local legacyFiles = {
			'__resource.lua', 'version.json', 'admin_server.lua', 'admin_client.lua', 'gui_c.lua', 'util_shared.lua', 'yarn.lock', '.yarn.installed',
			'server/bot/notifications.js', 'package.json', 'server/bot/bot.js', 'server/bot/chat_bridge.js', 'server/bot/functions.js', 'server/bot/logging.js',
			'server/bot/player_events.js', 'server/bot/reports.js', 'server/bot/roles.js', 'server/bot/server_status.js', 'server/bot/commands/add_ace.js',
			'server/bot/commands/add_group.js', 'server/bot/commands/announce.js', 'server/bot/commands/ban.js', 'server/bot/commands/baninfo.js',
			'server/bot/commands/cleanup.js', 'server/bot/commands/configure.js', 'server/bot/commands/freeze.js', 'server/bot/commands/kick.js',
			'server/bot/commands/mute.js', 'server/bot/commands/playerinfo.js', 'server/bot/commands/playerlist.js', 'server/bot/commands/refreshperms.js',
			'server/bot/commands/remove_ace.js', 'server/bot/commands/remove_group.js', 'server/bot/commands/screenshot.js', 'server/bot/commands/slap.js',
			'server/bot/commands/unban.js', 'server/bot/commands/unfreeze.js', 'server/bot/commands/unmute.js', 'server/bot/commands/warn.js',
			'bot/dist/commands/configure.js'
		}

		for i,file in pairs(legacyFiles) do
			local fileExists = LoadResourceFile(GetCurrentResourceName(), file)
			if fileExists then
				os.remove(GetResourcePath(GetCurrentResourceName()).."/"..file)
				PrintDebugMessage("Found legacy file "..file.." in EasyAdmin Folder and attempted deletion.", 2)
			end
		end

		PrintDebugMessage('EasyAdmin has been updated, or just been installed for the first time, please restart EasyAdmin to ensure smooth operation.', 1)
		KvpSetNoSync('scurrentVersion', curVersion)
	end

	if isMaster then
		PrintDebugMessage("You are using an unstable version of EasyAdmin, if this was not your intention, please download the latest stable version from "..remoteURL, 1)
	end

	local cmp = compareVersions(curVersion, remoteVersion)
	if cmp < 0 then
		print("\n--------------------------------------------------------------------------")
		print("\n"..resourceName.." is outdated.\nNewest Version: "..remoteVersion.."\nYour Version: "..curVersion.."\nPlease update it from "..remoteURL)
		print("\n--------------------------------------------------------------------------")
		updateAvailable = remoteVersion
		updateInfo.latestVersion = remoteVersion
		updateInfo.available = true
		-- Push update notification to all online admins
		for adminId,_ in pairs(OnlineAdmins or {}) do
			TriggerClientEvent('EasyAdmin:updateInfo', adminId, updateInfo)
		end
	elseif cmp > 0 then
		PrintDebugMessage("Your version of "..resourceName.." seems to be higher than the current stable version.", 2)
	end
end
exports('checkVersion', checkVersion)

function initEnvironmentChecks()
	-- Screenshot capture is now first-party (client/screenshot.lua + NUI)
	screenshots = true

	local onesync = GetConvar("onesync", "off")
	if (onesync ~= "off" and onesync ~= "legacy") then
		PrintDebugMessage("Onesync is Infinity", 3)
		infinity = true
	end

	if GetConvar("ea_defaultKey", "none") == "none" and RedM then
		PrintDebugMessage("ea_defaultKey is not defined, EasyAdmin can only be opened using the /easyadmin command, to define a key:\nhttps://easyadmin.readthedocs.io/en/latest", 1)
	end
end

function HTTPRequest(url, ...)
	local err,response,headers,requestDone

	PerformHttpRequest(url, function(e,r,h)
		err,response,headers = e,r,h
		requestDone = true
	end, ...)

	local attempts = 0
	repeat
		Wait(10)
		attempts = attempts + 1
	until (requestDone or attempts >= 500) -- 5 second timeout (500 * 10ms)

	if not requestDone then
		PrintDebugMessage("HTTPRequest to "..url.." timed out after 5 seconds", 2)
		return nil, "timeout"
	end

	return response, err
end
exports('HTTPRequest', HTTPRequest)

-- NUI requests current update info (sent when menu opens)
RegisterServerEvent('EasyAdmin:requestUpdateInfo', function()
  local src = source
  if not IsPlayerAdmin(src) then return end
  TriggerClientEvent('EasyAdmin:updateInfo', src, updateInfo)
end)

Citizen.CreateThread(function()
	while true do
		checkVersion()
		Wait(3600000)
	end
end)

Citizen.CreateThread(function()
	AddEventHandler('playerConnecting', function(playerName, setKickReason, deferrals)
		local player = source
		local numIds = getAllPlayerIdentifiers(player)
		local showProgress = GetConvar("ea_presentDeferral", "true")
		local loglevel = GetConvarInt("ea_logLevel", 1)

		deferrals.defer()
		Wait(0)
		local deferralText = GetLocalisedText("Checking Banlist, please wait.. ({progress}%%)", { progress = 0 })
		if showProgress == "false" then
			deferralText = deferralText:sub(1, -6)
		end
		deferrals.update(deferralText)

		if loglevel >= 3 then
			PrintDebugMessage(getName(player).."'s Identifiers:\n "..table_to_string(numIds), 3)
		end

		if not blacklist then
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			print("EasyAdmin: ^1Failed^7 to load Banlist!\n")
			print("EasyAdmin: Please check this error soon, ^1Bans *will not* work!^7\n")
			print("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
			deferrals.done("\n\nEasyAdmin: A fatal error occured, please contact a Server Administrator to resolve this issue.")
			return
		end
		Wait(0)

		local matchedBan = nil
		local checkedBans = {}

		for _, pid in ipairs(numIds) do
			local ban = banIndex[pid]
			if ban and not checkedBans[ban.banid] then
				checkedBans[ban.banid] = true
				if DoIdentifiersMatch(numIds, ban.identifiers) then
					matchedBan = ban
					if loglevel >= 3 then
						PrintDebugMessage("IDENTIFIER MATCH for ban "..ban.banid, 3)
					end
					break
				end
			end
		end

		if matchedBan then
			local notBannedIds = checkForChangedIdentifiers(numIds, matchedBan.identifiers)
			if #notBannedIds > 0 then
				local newBanData = matchedBan
				newBanData.identifiers = mergeTables(matchedBan.identifiers, notBannedIds)
				updateBan(matchedBan.banid, newBanData)
			end

			if loglevel >= 3 then
				PrintDebugMessage("Connection of "..getName(player).." Declined, Banned for "..matchedBan.reason..", Ban ID: "..matchedBan.banid.."\n", 3)
			end

			local banMessageTitleColour = GetConvar("ea_banMessageTitleColour", "#354557")
			local banMessageServerName = GetConvar("ea_banMessageServerName", GetConvar("sv_projectName", "EasyAdmin"))
			local banMessageShowStaff = GetConvar("ea_banMessageShowStaff", "true")
			local banMessageStaffName = matchedBan.banner
			local banMessageFooter = GetConvar("ea_banMessageFooter", "You can appeal this by ban by visiting our discord.")
			local banMessageSubHeader = GetConvar("ea_banMessageSubHeader", "You have been banned from this server.")
			local banMessageWatermark = GetConvar("ea_banMessageWatermark", DefaultWatermark)
			local banMessageReason = matchedBan.reason:gsub(string.format(", .*: %s", banMessageStaffName), "")

			if banMessageShowStaff == "false" then
				banMessageStaffName = 'Server Staff'
			end

			deferrals.done('<div style="background-color: rgba(30, 30, 30, 0.5); padding: 20px; border: solid 2px var(--color-modal-border); border-radius: var(--border-radius-normal); margin-top: 25px; position: relative;"><h1 style="color:' .. banMessageTitleColour .. ';">' .. banMessageServerName .. '</h1><br><h2>'.. banMessageSubHeader ..'</h2><br><p style="font-size: 1.25rem; padding: 0px"><strong>Expires:</strong> ' .. formatDateString(matchedBan.expire) .. '<br><strong>Banned By:</strong> ' .. banMessageStaffName .. ' <br>            <strong>Ban Reason:</strong> ' .. banMessageReason .. ' <br>            <strong>Ban ID:</strong> <code style="letter-spacing: 2px; background-color: #ff7f5059; padding: 2px 4px; border-radius: 6px;">' .. matchedBan.banid .. '</code><br><br>' .. banMessageFooter .. ' <span style="font-style: italic;"></span></p><img src="' .. banMessageWatermark ..  '" style="position: absolute;right: 15px;bottom: 15px;opacity: 65%;"></div>')
			return
		end

		if GetConvar("ea_enableAllowlist", "false") == "true" then
			deferrals.update(GetLocalisedText("Checking allowlist.."))
			local allowlistAttempts = 0
			local allowlisted = false
			repeat
				allowlisted = DoesPlayerHavePermission(player, "player.allowlist")
				allowlistAttempts = allowlistAttempts+1
				Wait(100)
			until (allowlistAttempts >= 15 or allowlisted == true)

			if DoesPlayerHavePermission(player, "player.allowlist") then
				deferrals.done()
			else
				deferrals.done(GetLocalisedText("You are not allowlisted on this server"))
				return
			end
		else
			deferrals.done()
		end
	end)
end)

Citizen.CreateThread(function()
	repeat
		Wait(1000)
	until updateBlacklist
	while true do
		updateBlacklist()
		Wait(300000)
	end
end)

if GetConvar("ea_enableSplash", "true") == "true" then
	local version,master = GetVersion()
	if master then version = version.." (UNSTABLE PRE-RELEASE!)" end
	print("\n _______ _______ _______ __   __ _______ ______  _______ _____ __   _\n |______ |_____| |______   \\_/   |_____| |     \\ |  |  |   |   | \\  |\n |______ |     | ______|    |    |     | |_____/ |  |  | __|__ |  \\_|\n                           Version ^3"..version.."^7")
	PrintDebugMessage("Initialised.", 4)
end
