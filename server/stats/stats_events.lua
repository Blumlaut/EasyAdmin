------------------------------------
-- EasyAdmin: Dashboard stats events
-- Wires NUI requests to the stats modules (player_history, world_stats, player_registry).
------------------------------------

-- ============================================================
-- Helper: resolve a range string to a cutoff timestamp
-- ============================================================

local function rangeToCutoff(range)
	local now = os.time()
	if range == '1h' then
		return now - 3600
	elseif range == '6h' then
		return now - 21600
	elseif range == '24h' then
		return now - 86400
	elseif range == '7d' then
		return now - (7 * 86400)
	elseif range == '30d' then
		return now - (30 * 86400)
	elseif range == '90d' then
		return now - (90 * 86400)
	elseif range == '120d' then
		return now - GetRetention()
	else
		return now - 86400 -- default 24h
	end
end

-- ============================================================
-- Server stats (resources + entities)
-- ============================================================

RegisterServerEvent('EasyAdmin:requestServerStats', function()
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local maxPlayers = tonumber(GetConvar('sv_maxClients', '48')) or 48

	local resourceCount = GetNumResources() - 1
	local started = 0
	local stopped = 0
	for i = 0, resourceCount - 1 do
		local name = GetResourceByFindIndex(i)
		if name then
			local state = GetResourceState(name)
			if state == 'started' then
				started = started + 1
			else
				stopped = stopped + 1
			end
		end
	end

	TriggerClientEvent('EasyAdmin:serverStatsResult', src, {
		maxPlayers = maxPlayers,
		resources = {
			total = resourceCount,
			started = started,
			stopped = stopped,
		},
		entities = GetCurrentEntities(),
	})
end)

-- ============================================================
-- Player history
-- ============================================================

RegisterServerEvent('EasyAdmin:requestPlayerHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetPlayerCountsAfter(cutoff)

	if #result == 0 then
		table.insert(result, { timestamp = os.time(), count = #GetPlayers() })
	end

	TriggerClientEvent('EasyAdmin:playerHistoryResult', src, result)
end)

-- ============================================================
-- World entity history
-- ============================================================

RegisterServerEvent('EasyAdmin:requestWorldHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetWorldSnapshotsAfter(cutoff)

	TriggerClientEvent('EasyAdmin:worldHistoryResult', src, result)
end)

-- ============================================================
-- Player registry (legacy, non-paginated)
-- ============================================================

---DEPRECATED: Use requestPlayerRegistryPage for server-side pagination.
RegisterServerEvent('EasyAdmin:requestPlayerRegistry', function(filterDays)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local now = os.time()
	local cutoff = filterDays and now - (tonumber(filterDays) * 86400) or 0
	local result = {}

	for _, data in ipairs(GetPlayerRegistry()) do
		if data.firstSeen and data.firstSeen >= cutoff then
			table.insert(result, {
				name        = data.name or 'Unknown',
				identifier  = PickStableIdentifier(data.identifiers),
				identifiers = data.identifiers,
				firstSeen   = data.firstSeen,
				lastSeen    = data.lastSeen,
				sessions    = data.sessions or 0,
				playtime    = data.playtime or 0,
			})
		end
	end

	TriggerClientEvent('EasyAdmin:playerRegistryResult', src, result)
end)

-- ============================================================
-- Player registry (paginated)
-- ============================================================

RegisterServerEvent('EasyAdmin:requestPlayerRegistryPage', function(data)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local now = os.time()

	local page = tonumber(data and data.page) or 1
	local pageSize = tonumber(data and data.pageSize) or 20
	local query = (data and data.query) and tostring(data.query):lower() or nil
	local sortBy = (data and data.sortBy) and tostring(data.sortBy) or 'lastSeen'
	local sortDir = (data and data.sortDir) and tostring(data.sortDir) or 'desc'
	local asc = (sortDir == 'asc')
	local filterDays = tonumber(data and data.filterDays) or nil

	if page < 1 then page = 1 end
	if pageSize < 1 or pageSize > 100 then pageSize = 20 end

	local cutoff = filterDays and now - (filterDays * 86400) or 0

	local filtered = GetFilteredPlayers(cutoff, query)

	-- Server-side sort
	if sortBy == 'sessions' then
		table.sort(filtered, function(a, b) return asc and a.sessions < b.sessions or a.sessions > b.sessions end)
	elseif sortBy == 'playtime' then
		table.sort(filtered, function(a, b) return asc and a.playtime < b.playtime or a.playtime > b.playtime end)
	elseif sortBy == 'firstSeen' then
		table.sort(filtered, function(a, b) return asc and a.firstSeen < b.firstSeen or a.firstSeen > b.firstSeen end)
	elseif sortBy == 'avgSession' then
		table.sort(filtered, function(a, b)
			local avgA = a.sessions > 0 and a.playtime / a.sessions or 0
			local avgB = b.sessions > 0 and b.playtime / b.sessions or 0
			return asc and avgA < avgB or avgA > avgB
		end)
	else
		table.sort(filtered, function(a, b) return asc and a.lastSeen < b.lastSeen or a.lastSeen > b.lastSeen end)
	end

	local total = #filtered
	local totalPages = math.max(1, math.ceil(total / pageSize))
	if page > totalPages then page = totalPages end

	local startIdx = (page - 1) * pageSize + 1
	local endIdx = math.min(startIdx + pageSize - 1, total)

	local entries = {}
	for i = startIdx, endIdx do
		table.insert(entries, filtered[i])
	end

	TriggerClientEvent('EasyAdmin:playerRegistryPageResult', src, {
		players    = entries,
		total      = total,
		page       = page,
		pageSize   = pageSize,
		totalPages = totalPages,
	})
end)

-- ============================================================
-- Stats summary
-- ============================================================

RegisterServerEvent('EasyAdmin:requestStatsSummary', function(range) -- luacheck: ignore 212
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local summary = ComputeStatsSummary()

	TriggerClientEvent('EasyAdmin:statsSummaryResult', src, summary)
end)

-- ============================================================
-- Daily peaks
-- ============================================================

RegisterServerEvent('EasyAdmin:requestDailyPeaks', function(range) -- luacheck: ignore 212
	local src = source
	if not DoesPlayerHavePermission(src, 'server.statistics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetDailyPlayerStats(cutoff)

	TriggerClientEvent('EasyAdmin:dailyPeaksResult', src, result)
end)

-- ============================================================
-- Name History & Aliases
-- ============================================================

RegisterServerEvent('EasyAdmin:GetPlayerNameHistory', function(playerId)
	local src = source
	if not DoesPlayerHavePermission(src, 'player.namehistory.view') then
		TriggerClientEvent('EasyAdmin:ReceivePlayerNameHistory', src, {
			nameHistory = {},
			aliases = {},
			currentName = 'Unknown',
		}, playerId)
		return
	end

	local targetPlayerId = tonumber(playerId)
	if not targetPlayerId then
		TriggerClientEvent('EasyAdmin:ReceivePlayerNameHistory', src, {
			nameHistory = {},
			aliases = {},
			currentName = 'Unknown',
		}, playerId)
		return
	end

	local identifiers = ResolvePlayerIdentifiers(targetPlayerId)
	if #identifiers == 0 then
		TriggerClientEvent('EasyAdmin:ReceivePlayerNameHistory', src, {
			nameHistory = {},
			aliases = {},
			currentName = 'Unknown',
		}, playerId)
		return
	end

	local entry = FindPlayerByIdentifiers(identifiers)
	if not entry then
		TriggerClientEvent('EasyAdmin:ReceivePlayerNameHistory', src, {
			nameHistory = {},
			aliases = {},
			currentName = 'Unknown',
		}, playerId)
		return
	end

	TriggerClientEvent('EasyAdmin:ReceivePlayerNameHistory', src, {
		nameHistory = entry.nameHistory or {},
		aliases     = entry.aliases or {},
		currentName = entry.name or 'Unknown',
	}, playerId)
end)

RegisterServerEvent('EasyAdmin:AddPlayerAlias', function(data)
	local src = source
	if not DoesPlayerHavePermission(src, 'player.aliases.add') then return end

	local playerId = tonumber(data and data.playerId)
	if not playerId then return end

	local aliasText = data and data.alias
	if not aliasText or aliasText == '' or #aliasText > 128 then return end

	local note = data and data.note
	if note and #note > 256 then note = note:sub(1, 256) end

	local identifiers = ResolvePlayerIdentifiers(playerId)
	if #identifiers == 0 then return end

	local success = AddAlias(identifiers, aliasText, GetPlayerName(src) or 'Console', note)
	if success then
		local entry = FindPlayerByIdentifiers(identifiers)
		PrintDebugMessage(string.format('Alias "%s" added to player "%s" by "%s".',
			aliasText, entry and entry.name or 'Unknown', GetPlayerName(src) or 'Console'), 3)
	end
end)

RegisterServerEvent('EasyAdmin:RemovePlayerAlias', function(data)
	local src = source
	if not DoesPlayerHavePermission(src, 'player.aliases.delete') then return end

	local playerId = tonumber(data and data.playerId)
	local aliasId = tonumber(data and data.aliasId)
	if not playerId or not aliasId then return end

	local identifiers = ResolvePlayerIdentifiers(playerId)
	if #identifiers == 0 then return end

	local entry = FindPlayerByIdentifiers(identifiers)
	local success = RemoveAlias(identifiers, aliasId)
	if success then
		PrintDebugMessage(string.format('Alias #%d removed from player "%s" by "%s".',
			aliasId, entry and entry.name or 'Unknown', GetPlayerName(src) or 'Console'), 3)
	end
end)
