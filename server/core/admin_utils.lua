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

---@return boolean
function IsDangerousDevModeEnabled()
	return GetConvar("ea_dangerousDevMode", "false") == "true"
end
exports('IsDangerousDevModeEnabled', IsDangerousDevModeEnabled)

---@param src number|string
---@param target number|string
---@return boolean
function CanBypassSelfAndImmunityChecks(src, target)
	if not IsDangerousDevModeEnabled() then
		return false
	end

	if src == nil or target == nil then
		return false
	end

	local numSrc = tonumber(src)
	local numTarget = tonumber(target)
	if numSrc == nil or numTarget == nil or numSrc <= 0 or numTarget <= 0 then
		return false
	end

	return numSrc == numTarget or isPlayerImmune(target)
end
exports('CanBypassSelfAndImmunityChecks', CanBypassSelfAndImmunityChecks)

---@param src number|string
---@param target number|string
---@param immuneMessage string?
---@return boolean
function CanTargetPlayerForModeration(src, target, immuneMessage)
	if CanBypassSelfAndImmunityChecks(src, target) then
		return true
	end

	if isPlayerImmune(target) then
		if src and tonumber(src) and tonumber(src) > 0 then
			TriggerClientEvent("EasyAdmin:showNotification", src, immuneMessage or GetLocalisedText("You do not have permission to perform this action, target player is immune."))
		end
		return false
	end

	return true
end
exports('CanTargetPlayerForModeration', CanTargetPlayerForModeration)

---@param src number|string @The player source
---@param action string @The name of the admin action
---@return boolean @True if allowed to perform action, false if cooldown is active
function CheckAdminCooldown(src, action)
	local numSrc = tonumber(src)
	if not numSrc then return true end
	if AdminCooldowns[numSrc] then
		if AdminCooldowns[numSrc][action] then
			TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("You must wait before using this again!"))
			return false
		end
	end
	return true
end

-- Sets a cooldown for a specific admin action
---@param src number|string
---@param action string
function SetAdminCooldown(src, action)
	local numSrc = tonumber(src)
	local coolTime = GetConvarInt("ea_adminCooldown:"..tostring(action), 0)
	if action and numSrc and coolTime > 0 then
		action = tostring(action)
		AdminCooldowns[src] = AdminCooldowns[src] or {}
		AdminCooldowns[src][action] = true
		Citizen.SetTimeout(1000*coolTime, function()
			if AdminCooldowns[src] then
				AdminCooldowns[src][action] = nil
			end
		end)
	end
end

-- Gets all identifiers for a player
---@param src number
---@return table
function getAllPlayerIdentifiers(playerId)
	local identifiers = GetPlayerIdentifiers(playerId)
	local tokens = {}
	if GetConvar("ea_useTokenIdentifiers", "true") == "true" then
		if not GetNumPlayerTokens or not GetPlayerToken then
			PrintDebugMessage("Server Version is below artifact 3335, disabling Token identifiers, please consider updating your FXServer!", 1)
			SetConvar("ea_useTokenIdentifiers", "false")
			PrintDebugMessage("Set ea_useTokenIdentifiers to false for this session.", 1)
			return identifiers
		end
		for i=0,GetNumPlayerTokens(playerId) do
			table.insert(tokens, GetPlayerToken(playerId, i))
		end
	end
	return mergeTables(identifiers, tokens)
end
exports('getAllPlayerIdentifiers', getAllPlayerIdentifiers)

function checkForChangedIdentifiers(playerIds, bannedIds)
	local unbannedIds = {}
	local bannedSet = {}
	for _, bannedId in ipairs(bannedIds) do
		bannedSet[bannedId] = true
	end
	for _, playerId in ipairs(playerIds) do
		if not bannedSet[playerId] then
			table.insert(unbannedIds, playerId)
		end
	end
	return unbannedIds
end

function GetOnlineAdmins()
	return OnlineAdmins
end
exports('GetOnlineAdmins', GetOnlineAdmins)

function IsPlayerAdmin(pid)
	return OnlineAdmins[pid]
end
exports('IsPlayerAdmin', IsPlayerAdmin)

-- Sends a global announcement
---@param text string
---@return boolean
function announce(reason)
	if reason then
		TriggerClientEvent("EasyAdmin:showNotification", -1, "[" .. GetLocalisedText("Announcement") .. "] " .. reason)
		return true
	else
		return false
	end
end
exports('announce', announce)

-- Gets the name of a player, optionally including identifiers
---@param src number|string
---@param anonymousdisabled boolean
---@param identifierenabled boolean
---@return string
function getName(src,anonymousdisabled,identifierenabled)
	if src == nil then
		return "Unknown - nil"
	end

	local playerId = tonumber(src)
	if not playerId then
		return "Unknown - invalid id: " .. tostring(src)
	end

	local identifierPref = GetConvar("ea_logIdentifier", "steam,discord,license")
	if identifierPref == "false" then identifierenabled = false end;
	if (playerId == 0 or playerId == "") then
		return "Console"
	else
		local cachedPlayer = getCachedPlayer(playerId)
		local playerName

		if AnonymousAdmins[playerId] and not anonymousdisabled then
			return GetLocalisedText("Anonymous Admin")
		elseif cachedPlayer and cachedPlayer.name then
			playerName = cachedPlayer.name

			if not identifierenabled then
				return playerName
			end

			if not cachedPlayer.discord then
				return playerName
			end

			return (string.format("%s [ %s ]", playerName, cachedPlayer.discord))
		elseif (GetPlayerName(playerId)) then
			playerName = GetPlayerName(playerId)
			if not identifierenabled then
				return playerName
			end

			local playerDiscord = GetPlayerIdentifierByType(playerId, "discord") and GetPlayerIdentifierByType(playerId, "discord"):gsub("discord:", "") or false
			if not playerDiscord then
				return playerName
			end

			return (string.format("%s [ %s ]", playerName, playerDiscord))
		else
			return "Unknown - " .. tostring(src)
		end
	end
end
exports('getName', getName)

--- Check whether two identifier sets share at least N common identifiers.
--- N defaults to the ea_minIdentifierMatches convar (default: 2).
--- Returns true if the overlap meets or exceeds the threshold.
---@param aents table<string> @First identifier set
---@param bents table<string> @Second identifier set
---@param minMatches? number @Minimum common identifiers required (default: ea_minIdentifierMatches)
---@return boolean
function DoIdentifiersMatch(aents, bents, minMatches)
    if not aents or not bents or #aents == 0 or #bents == 0 then
        return false
    end
    minMatches = minMatches or GetConvarInt("ea_minIdentifierMatches", 2)
    local lookup = {}
    for _, id in ipairs(bents) do
        lookup[id] = true
    end
    local count = 0
    for _, id in ipairs(aents) do
        if lookup[id] then
            count = count + 1
            if count >= minMatches then
                return true
            end
        end
    end
    return false
end
exports('DoIdentifiersMatch', DoIdentifiersMatch)
