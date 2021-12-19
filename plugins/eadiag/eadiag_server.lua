Citizen.CreateThread(function()
	local diagActive = false
	RegisterCommand("eaDiag", function(source, args, rawCommand)
		if diagActive then
			PrintDebugMessage("eaDiag is still running, please wait, or report any errors!", 1)
			return false
		end

		if DoesPlayerHavePermission(source, "server") then
			diagActive = true
			
			PrintDebugMessage("eaDiag triggered, this may take a while, please do not restart EasyAdmin in the meantime.^7\n", 1)
			
			local supportData = {}
			
			PrintDebugMessage("Collecting EasyAdmin Config....^7\n", 1)
			
			local version,ismaster = GetVersion()
			supportData.config = {
				gamename = GetConvar("gamename", "not-rdr3"),
				version = version,
				ismaster = tostring(ismaster),
				ea_moderationNotification = GetConvar("ea_moderationNotification", "false"),
				ea_screenshoturl = GetConvar("ea_screenshoturl", 'https://wew.wtf/upload.php'),
				onesync = GetConvar("onesync", "off"),
				steam_webApiKey = GetConvar("steam_webApiKey", ""),
				ea_LanguageName = GetConvar("ea_LanguageName", "en"),
				ea_enableDebugging = GetConvar("ea_enableDebugging", "false"),
				ea_logLevel = GetConvar("ea_logLevel", 1),
				ea_minIdentifierMatches = GetConvarInt("ea_minIdentifierMatches", 2),
				ea_defaultKey = GetConvar("ea_defaultKey", "none"),
				ea_alwaysShowButtons = GetConvar("ea_alwaysShowButtons", "false"),
				ea_enableCallAdminCommand = GetConvar("ea_enableCallAdminCommand", "true"),
				ea_enableReportCommand = GetConvar("ea_enableReportCommand", "true"),
				ea_defaultMinReports = GetConvarInt("ea_defaultMinReports", 3),
				ea_MinReportPlayers = GetConvarInt("ea_MinReportPlayers", 12),
				ea_MinReportModifierEnabled = GetConvar("ea_MinReportModifierEnabled", "true"),
				ea_ReportBanTime = GetConvarInt("ea_ReportBanTime", 86400),
				ea_custombanlist = GetConvar("ea_custombanlist", "false"),
				ea_maxWarnings = GetConvarInt("ea_maxWarnings", 3),
				ea_warnAction = GetConvar("ea_warnAction", "kick"),
				ea_warningBanTime = GetConvarInt("ea_warningBanTime", 604800),
				ea_enableSplash = GetConvar("ea_enableSplash", "true"),
				ea_playerCacheExpiryTime = GetConvarInt("ea_playerCacheExpiryTime", 900),
				ea_chatReminderTime = GetConvarInt("ea_chatReminderTime", 0),
				ea_backupFrequency = GetConvarInt("ea_backupFrequency", 72),
				ea_maxBackupCount = GetConvarInt("ea_maxBackupCount", 10),
				ea_useTokenIdentifiers = GetConvar("ea_useTokenIdentifiers", "true"),
				ea_enableTelemetry = GetConvar("ea_enableTelemetry", "true"),
			}

			for i,v in pairs(supportData.config) do
				PrintDebugMessage(i.." = "..v, 4)
			end

			Wait(500)
			
			PrintDebugMessage("Collecting Server Config....^7\n", 1)
			
			local path = GetResourcePath(GetCurrentResourceName())
			local occurance = string.find(path, "/resources")
			local path = string.reverse(string.sub(string.reverse(path), -occurance))
			
			local servercfg = io.open(path.."server.cfg")
			if servercfg then
				supportData.serverconfig = servercfg:read("*a")
				servercfg:close()

			else
				PrintDebugMessage("Could not find your server.cfg file, it should be called `server.cfg` in the parent folder of `resources`, otherwise EasyAdmin cannot read it, this report may be incomplete.\n", 1)
			end
			
			PrintDebugMessage("Collecting easyadmin_permissions.cfg....^7\n", 1)
			local permissions = io.open(path.."easyadmin_permissions.cfg")
			if permissions then
				supportData.serverconfig = supportData.serverconfig.."\n#### The following are the contents of the easyadmin_permissions.cfg ####\n"..permissions:read("*a")
				permissions:close()
			else 
				PrintDebugMessage("Could not find your easyadmin_permissions.cfg file, it should be called `easyadmin_permissions.cfg` in the parent folder of `resources`, otherwise EasyAdmin cannot read it, this report may be incomplete.\n", 1)
			end

			PrintDebugMessage("Collecting Players....^7\n", 1)
			
			local players = {}
			for i, player in pairs(GetPlayers()) do
				players[player] = GetPlayerIdentifiers(player)
				if IsPlayerAdmin(player) then
					PrintDebugMessage(GetPlayerName(player).." is an Admin.", 1)
				end
			end

			local lines = string.split(supportData.serverconfig, "\n")

			for i, line in pairs(lines) do
				if string.find(line, "add_ace group.admin easyadmin allow") then
					adminAllowed = true
				end

				if string.find(line, "add_principal identifier.steam") then
					local steamid = string.match(line, "add_principal identifier.steam:(.*) group")
					if not string.match(steamid,"%a") then
						PrintDebugMessage("Please double check the following line: \n"..line.."\n\nthe steamid might be in decimal format, it should be hexadecimal.\n", 1)
					end
				end

				if string.find(line, "add_ace group.") then
					if string.find(line, "deny") then
						PrintDebugMessage("The following line is denying permissions, this WILL cause problems, only allow permissions you want to allow! \n"..line.."\n", 1)
					end
				end

			end




			if supportData.config.steam_webApiKey == "" then
				PrintDebugMessage("POSSIBLE ISSUE: steam_webApiKey is not defined! Steam Identifiers will not work.\n", 1)
			end

			if supportData.config.ea_custombanlist == "true" then
				PrintDebugMessage("POSSIBLE ISSUE: Custom Banlist is enabled, this is no longer supported.\n", 1)
			end

			if supportData.config.ea_minIdentifierMatches <= 1 then
				PrintDebugMessage("POSSIBLE ISSUE: ea_minIdentifierMatches should never be less than 1.\n", 1)
			end

			if type(supportData.config.ea_defaultKey) == "number" then
				PrintDebugMessage("POSSIBLE ISSUE: ea_defaultKey should be a Key, not a Control id.\n", 1)
			end

			if supportData.config.ismaster then
				PrintDebugMessage("EasyAdmin isn't using the latest stable release, this may or may not be an issue.\n", 1)
			end
			
			if updateAvailable then
				PrintDebugMessage("POSSIBLE ISSUE: EasyAdmin is outdated, you should update ASAP.\n", 1)
			end
			
			if not adminAllowed then
				PrintDebugMessage("POSSIBLE ISSUE: 'add_ace group.admin easyadmin allow' is missing \n", 1)
			end

			PrintDebugMessage("eaDiag Finished.", 1)
			diagActive=false

			


		end
	end, false)



end)