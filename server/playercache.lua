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

CachedPlayers = {} -- DO NOT TOUCH THIS

Citizen.CreateThread(function()
	while true do 
		Wait(20000)
		local osTime = os.time()
		local playerCacheExpiry = GetConvarInt("ea_playerCacheExpiryTime", 1800)
		for i, player in pairs(CachedPlayers) do 
			if player.droppedTime and (osTime > player.droppedTime+playerCacheExpiry) then
				PrintDebugMessage("Cache for "..player.id.." expired, removing from cache.", 3)
				for i, report in pairs(reports) do
					if report.reported == player.id then 
						reports[i] = nil
					end
				end
				CachedPlayers[i]=nil
			end
		end
	end
end)

function cachePlayer(playerId)
	if not CachedPlayers[playerId] then
		CachedPlayers[playerId] = { id = playerId, name = getName(playerId, true), identifiers = getAllPlayerIdentifiers(playerId), immune = DoesPlayerHavePermission(playerId, "immune"), discord = GetPlayerIdentifierByType(playerId, 'discord') and GetPlayerIdentifierByType(playerId, 'discord'):gsub("discord:", "") or false }
		PrintDebugMessage(getName(playerId).." has been added to cache.", 4)
		return CachedPlayers[playerId]
	end
	return CachedPlayers[playerId]
end

RegisterServerEvent("EasyAdmin:requestCachedPlayers", function()
	PrintDebugMessage(getName(source, true).." requested Cache.", 4)
	local src = source
	if (DoesPlayerHavePermission(source, "player.ban.temporary") or DoesPlayerHavePermission(source, "player.ban.permanent")) then
		TriggerLatentClientEvent("EasyAdmin:fillCachedPlayers", src, 200000, CachedPlayers)
	end
end)


---Returns a table of all cached players.
---@return table @A table containing all cached player data.
function getCachedPlayers() -- this is server-only for security reasons.
    return CachedPlayers
end
exports('getCachedPlayers', getCachedPlayers)

---Returns the cached player data for a specific player ID.
---@param id number|string @The player ID (number or string representation).
---@return table? @The cached player data, or nil if not found.
function getCachedPlayer(id)
	cachePlayer(tonumber(id))
    return CachedPlayers[tonumber(id)]
end
exports('getCachedPlayer', getCachedPlayer)

AddEventHandler('playerDropped', function (reason)
	if CachedPlayers[source] then
		CachedPlayers[source].droppedTime = os.time()
		CachedPlayers[source].dropped = true
	end
end)