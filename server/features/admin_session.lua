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

AddEventHandler('playerDropped', function (reason)
	local src = source
	if OnlineAdmins[src] then
		OnlineAdmins[src] = nil
	end
	if FrozenPlayers[src] then
		FrozenPlayers[src] = nil
		for i,_ in pairs(OnlineAdmins) do
			TriggerLatentClientEvent("EasyAdmin:SetPlayerFrozen", i, 1000, src, nil)
		end
	end
	if MutedPlayers[src] then
		MutedPlayers[src] = nil
		for i,_ in pairs(OnlineAdmins) do
			TriggerLatentClientEvent("EasyAdmin:SetPlayerMuted", i, 1000, src, nil)
		end
	end
	PrintDebugMessage(src.." disconnected.", 4)
end)

RegisterServerEvent("EasyAdmin:GetInfinityPlayerList", function()
	local src = source
	PrintDebugMessage(getName(src, true).." requested Playerlist.", 4)
	if IsPlayerAdmin(src) then
		local l = {}
		local players = GetPlayers()

		for i, player in pairs(players) do
			local player = tonumber(player)
			local cachedPlayer = cachePlayer(player)
			local pData = { id = cachedPlayer.id, name = cachedPlayer.name, immune = cachedPlayer.immune, discord = cachedPlayer.discord, contributor = Contributors[cachedPlayer.discord], developer = cachedPlayer.discord == "178889658128793600", admin = OnlineAdmins[player] }
			l[#l + 1] = pData
		end

		TriggerLatentClientEvent("EasyAdmin:GetInfinityPlayerList", src, 200000, l)
	end
end)

RegisterServerEvent("EasyAdmin:getPlayerIdentifiers", function(playerId)
	local src = source
	if not IsPlayerAdmin(src) then return end
	local pid = tonumber(playerId)
	if not pid then return end

	local onlineIdentifiers = GetPlayerIdentifiers(pid)
	if #onlineIdentifiers > 0 then
		TriggerClientEvent("EasyAdmin:playerIdentifiersResult", src, pid, onlineIdentifiers)
		return
	end

	local cached = CachedPlayers[pid]
	if cached and cached.identifiers then
		TriggerClientEvent("EasyAdmin:playerIdentifiersResult", src, pid, cached.identifiers)
		return
	end

	TriggerClientEvent("EasyAdmin:playerIdentifiersResult", src, pid, {})
end)

Citizen.CreateThread(function()
	if not CachedPlayers or GetVersion() == nil then
		print("^7--------------------------------------------------------------")
		print("^1EasyAdmin self-test failed! Your EasyAdmin **will not work**, likely you edited some files and broke EasyAdmin in the progress, please reinstall EasyAdmin.")
		print("^7--------------------------------------------------------------")
		return
	end

	if GetConvar("gamename", "gta5") == "rdr3" then
		RedM = true
		PrintDebugMessage("Starting in rdr3 Mode.", 4)
	else
		RedM = false
		PrintDebugMessage("Starting in gta5 Mode.", 4)
	end

	moderationNotification = GetConvar("ea_moderationNotification", "false")
	reportNotification = GetConvar("ea_reportNotification", "false")
	detailNotification = GetConvar("ea_detailNotification", "false")

	initEnvironmentChecks()

	RegisterServerEvent('EasyAdmin:amiadmin', function()
		local source = source

		cachePlayer(source)

		if getPlayerLastPermRequest(source) and getPlayerLastPermRequest(source)+10 > os.time() then
			PrintDebugMessage(getName(source).." hit Permission Check Ratelimit! "..getPlayerLastPermRequest(source)+10-os.time().." seconds left.", 3)
			return
		end

		setPlayerLastPermRequest(source, os.time())

		local perms = {}
		for perm,val in pairs(permissions) do
			local thisPerm = DoesPlayerHavePermission(source, perm)
			if thisPerm == true then
				OnlineAdmins[source] = true
			end
			perms[perm] = thisPerm
			PrintDebugMessage("Processed Perm "..perm.." for "..getName(source, true)..", result: "..tostring(thisPerm), 3)
		end

		TriggerLatentClientEvent("EasyAdmin:adminresponse", source, 10000, perms)
		TriggerClientEvent('chat:addSuggestion', source, '/easyadmin', "EasyAdmin Menu", {{name="report or player id", help="[Optional] Report or Player ID"}})
		TriggerClientEvent('chat:addSuggestion', source, '/ea', "EasyAdmin Menu", {{name="report or player id", help="[Optional] Report or Player ID"}})

		if GetConvar("ea_enableReportCommand", "true") == "true" then
			TriggerClientEvent('chat:addSuggestion', source, '/'..GetConvar("ea_reportCommandName", "report"), "Report player", {{name='player', help="player name / id"}, {name='reason', help="Reason"}})
		end

		if GetConvar("ea_enableCallAdminCommand", "true") == "true" then
			TriggerClientEvent('chat:addSuggestion', source, '/'..GetConvar("ea_callAdminCommandName", "calladmin"), "Call Admin", {{name='reason', help="Reason"}})
		end

		if infinity then
			TriggerClientEvent('EasyAdmin:setInfinity', source, true)
		end

		TriggerLatentClientEvent("EasyAdmin:fillShortcuts", source, 10000, MessageShortcuts)
	end)
end)
