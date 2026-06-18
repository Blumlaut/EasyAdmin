------------------------------------
-- EasyAdmin: Dashboard server stats
-- Provides entity counts, resource stats, player count history,
-- and player connection tracking for retention/churn analytics
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Retention: 120 days in seconds
local STATS_RETENTION = 120 * 86400
-- Sampling interval: 15 minutes in seconds
local STATS_INTERVAL = 900
-- Minimum gap between duplicate entries: 1 minute
local DEDUP_WINDOW = 60

-- File paths
local playersFile = 'data/statistics/players.json'
local worldFile   = 'data/statistics/world.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Player count snapshots: { { timestamp, count }, ... }
local playerCounts = {}

-- World entity snapshots: { { timestamp, vehicles, peds, objects }, ... }
local worldSnapshots = {}

-- Player registry keyed by a unique numeric ID.
-- Each entry stores ALL identifiers for robust cross-session matching.
-- { id, identifiers, firstSeen, lastSeen, sessions, playtime, sessionLengths }
local playerRegistry = {}
local nextPlayerId = 1

-- Reverse index: any identifier string → player registry entry ID
-- Enables O(1) lookup by ANY of a player's identifiers (matches banlist pattern)
local playerIndex = {}

-- Temporary: track connect times per source for session length calculation
local sessionStarts = {}

-- Temporary: map source → best identifier (set at sessionStart, used at playerDropped)
local sourceBestId = {}

-- ============================================================
-- Helpers
-- ============================================================

---Pick the most stable identifier from a list (for display / primary reference).
---Preference: license2 > discord > license > ip > first available
---@param identifiers table
---@return string
local function pickStableIdentifier(identifiers)
	for _, id in ipairs(identifiers) do
		if id:find('^license2:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^discord:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^license:') and not id:find('^license2:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^ip:') then return id end
	end
	return identifiers[1] or 'unknown'
end

---Index all identifiers for a player entry (for reverse lookup).
---@param entry table
local function indexPlayerIdentifiers(entry)
	for _, id in ipairs(entry.identifiers) do
		playerIndex[id] = entry.id
	end
end

---Remove all identifier indices for a player entry.
---@param entry table
local function unindexPlayerIdentifiers(entry)
	for _, id in ipairs(entry.identifiers) do
		playerIndex[id] = nil
	end
end

---Find an existing player registry entry by checking ALL provided identifiers.
---@param identifiers table
---@return table|nil entry
local function findPlayerByIdentifiers(identifiers)
	local seen = {}
	for _, id in ipairs(identifiers) do
		local entryId = playerIndex[id]
		if entryId and not seen[entryId] then
			seen[entryId] = true
			-- Return the first matching entry found
			for _, entry in ipairs(playerRegistry) do
				if entry.id == entryId then return entry end
			end
		end
	end
	return nil
end

---Merge two player entries (same player found under different identifiers).
---All identifiers are unified, stats are combined, old entry is removed.
---@param primary table  The entry to keep
---@param secondary table The entry to merge into primary
local function mergePlayerEntries(primary, secondary)
	-- Collect all unique identifiers
	local idSet = {}
	for _, id in ipairs(primary.identifiers) do idSet[id] = true end
	for _, id in ipairs(secondary.identifiers) do idSet[id] = true end
	local mergedIds = {}
	for id in pairs(idSet) do table.insert(mergedIds, id) end

	-- Unindex both old entries
	unindexPlayerIdentifiers(primary)
	unindexPlayerIdentifiers(secondary)

	-- Update primary with merged data
	primary.identifiers = mergedIds
	if secondary.firstSeen and secondary.firstSeen < primary.firstSeen then
		primary.firstSeen = secondary.firstSeen
	end
	primary.sessions = (primary.sessions or 0) + (secondary.sessions or 0)
	primary.playtime = (primary.playtime or 0) + (secondary.playtime or 0)

	-- Merge session lengths
	if secondary.sessionLengths and #secondary.sessionLengths > 0 then
		if not primary.sessionLengths then primary.sessionLengths = {} end
		for _, sl in ipairs(secondary.sessionLengths) do
			table.insert(primary.sessionLengths, sl)
		end
		-- Keep last 100 session lengths max
		while #primary.sessionLengths > 100 do
			table.remove(primary.sessionLengths, 1)
		end
	end

	-- Reindex merged entry
	indexPlayerIdentifiers(primary)

	-- Remove secondary from registry
	for i = #playerRegistry, 1, -1 do
		if playerRegistry[i].id == secondary.id then
			table.remove(playerRegistry, i)
			break
		end
	end
end

---Load a JSON file, returning a table or {} on failure
---@param path string
---@return table
local function loadJson(path)
	return LoadJsonResourceFile(path, {}) or {}
end
---Save a table as indented JSON to a file
---@param path string
---@param data table
local function saveJson(path, data)
	SaveJsonResourceFile(path, data)
end

---Prune time-series entries older than STATS_RETENTION (oldest-first arrays)
---@param entries table
---@return boolean pruned
local function pruneEntries(entries)
	local now = os.time()
	local cutoff = now - STATS_RETENTION
	local pruned = false
	for i = #entries, 1, -1 do
		if entries[i].timestamp < cutoff then
			table.remove(entries, i)
			pruned = true
		else
			break
		end
	end
	return pruned
end

-- ============================================================
-- Persistence: players.json
-- ============================================================

---players.json schema:
-- {
--   playerCounts: [ { timestamp, count }, ... ],
--   players: [
--     { id, identifiers, firstSeen, lastSeen, sessions, playtime, sessionLengths },
--     ...
--   ],
--   nextPlayerId: number
-- }

local function loadPlayers()
	local data = loadJson(playersFile)
	playerCounts = data.playerCounts or {}
	playerRegistry = data.players or {}
	nextPlayerId = data.nextPlayerId or 1
	playerIndex = {}

	-- Build reverse index from loaded data
	for _, entry in ipairs(playerRegistry) do
		indexPlayerIdentifiers(entry)
		if entry.id >= nextPlayerId then
			nextPlayerId = entry.id + 1
		end
	end
end

local function savePlayers()
	saveJson(playersFile, {
		playerCounts = playerCounts,
		players = playerRegistry,
		nextPlayerId = nextPlayerId,
	})
end

-- ============================================================
-- Persistence: world.json
-- ============================================================

---world.json schema:
-- { snapshots: [ { timestamp, vehicles, peds, objects }, ... ] }

local function loadWorld()
	local data = loadJson(worldFile)
	worldSnapshots = data.snapshots or {}
end

local function saveWorld()
	saveJson(worldFile, { snapshots = worldSnapshots })
end

-- ============================================================
-- Backfill offline gaps in playerCounts
-- ============================================================

---If the last playerCounts entry is older than one interval, insert
---zero-count entries to cover the gap (server was offline).
local function backfillPlayerCounts()
	local now = os.time()
	local last = playerCounts[#playerCounts]
	if not last then return end

	local gapStart = last.timestamp + STATS_INTERVAL
	if gapStart > now then return end -- no gap

	local gapEnd = now - (now % STATS_INTERVAL) -- align to interval boundary
	local t = gapStart
	while t <= gapEnd do
		table.insert(playerCounts, { timestamp = t, count = 0 })
		t = t + STATS_INTERVAL
	end
end

-- ============================================================
-- Migration: old data/player_history.json
-- ============================================================

local function migrateOldHistory()
	local oldPath = 'data/player_history.json'
	local data = LoadResourceFile(GetCurrentResourceName(), oldPath)
	if not data then return end

	local ok, decoded = pcall(json.decode, data)
	if not ok or type(decoded) ~= 'table' or #decoded == 0 then return end

	-- Validate first entry has expected shape
	if not decoded[1].timestamp or not decoded[1].count then return end

	local migrated = 0
	for _, entry in ipairs(decoded) do
		if entry.timestamp and entry.count and entry.timestamp + STATS_RETENTION >= os.time() then
			table.insert(playerCounts, { timestamp = entry.timestamp, count = entry.count })
			migrated = migrated + 1
		end
	end

	if migrated > 0 then
		PrintDebugMessage(string.format('Migrated %d entries from %s.', migrated, oldPath), 2)
		-- Attempt to remove old file (best-effort, not critical)
		-- FiveM has no delete API, so we just leave it; it won't be read again
	end
end

-- ============================================================
-- Recording: player counts
-- ============================================================

local function recordPlayerCount()
	local count = #GetPlayers()
	local now = os.time()

	-- Dedup: skip if we already have an entry within DEDUP_WINDOW
	local last = playerCounts[#playerCounts]
	if last and now - last.timestamp < DEDUP_WINDOW then
		return
	end

	table.insert(playerCounts, { timestamp = now, count = count })

	-- Prune and save
	pruneEntries(playerCounts)
	savePlayers()
end

-- ============================================================
-- Recording: world entity snapshots
-- ============================================================

local function recordWorldSnapshot()
	local now = os.time()

	-- Dedup
	local last = worldSnapshots[#worldSnapshots]
	if last and now - last.timestamp < DEDUP_WINDOW then
		return
	end

	table.insert(worldSnapshots, {
		timestamp = now,
		vehicles = #GetAllVehicles(),
		peds     = #GetAllPeds(),
		objects  = #GetAllObjects(),
	})

	pruneEntries(worldSnapshots)
	saveWorld()
end

-- ============================================================
-- Recording: player connections (retention / churn)
-- ============================================================

---Client fires EasyAdmin:sessionStart once their ped is fully loaded.
---This is more reliable than playerConnecting (deferrals, kicks, source mismatch).
RegisterServerEvent('EasyAdmin:sessionStart', function()
	local src = source
	local identifiers = GetPlayerIdentifiers(src)
	if #identifiers == 0 then return end

	local bestId = pickStableIdentifier(identifiers)
	local playerName = GetPlayerName(src) or 'Unknown'
	local now = os.time()

	-- Record session start time and best ID keyed by source
	sessionStarts[src] = now
	sourceBestId[src] = bestId

	-- Check if any of this player's identifiers already exist in the registry
	local existingEntry = findPlayerByIdentifiers(identifiers)

	if existingEntry then
		-- Update name (players change names, keep the latest)
		existingEntry.name = playerName

		-- Check if there are NEW identifiers not yet in the entry
		local hasNewIds = false
		local allIds = {}
		for _, id in ipairs(existingEntry.identifiers) do allIds[id] = true end
		for _, id in ipairs(identifiers) do
			if not allIds[id] then
				hasNewIds = true
				break
			end
		end

		if hasNewIds then
			-- Add new identifiers to existing entry
			unindexPlayerIdentifiers(existingEntry)
			for _, id in ipairs(identifiers) do
				if not allIds[id] then
					table.insert(existingEntry.identifiers, id)
				end
			end
			indexPlayerIdentifiers(existingEntry)
		end

		-- Returning player: increment session count
		existingEntry.lastSeen = now
		existingEntry.sessions = (existingEntry.sessions or 0) + 1
	else
		-- New player: create entry with ALL identifiers
		local entry = {
			id             = nextPlayerId,
			name           = playerName,
			identifiers    = identifiers,
			firstSeen      = now,
			lastSeen       = now,
			sessions       = 1,
			playtime       = 0,
			sessionLengths = {},
		}
		nextPlayerId = nextPlayerId + 1
		table.insert(playerRegistry, entry)
		indexPlayerIdentifiers(entry)
	end
end)

---Handle playerDropped: calculate session length, store it, and persist registry.
AddEventHandler('playerDropped', function(reason) -- luacheck: ignore 212 (reason unused)
	local src = source
	local connectTime = sessionStarts[src]
	if not connectTime then return end

	local sessionLength = os.time() - connectTime
	sessionStarts[src] = nil

	-- Use the best ID tracked at sessionStart (identifiers may be unavailable here)
	local trackedBestId = sourceBestId[src]
	sourceBestId[src] = nil

	if not trackedBestId then return end

	-- Find the player's registry entry via the indexed best identifier
	local entryId = playerIndex[trackedBestId]
	if not entryId then return end

	local entry = nil
	for _, e in ipairs(playerRegistry) do
		if e.id == entryId then
			entry = e
			break
		end
	end

	if entry then
		entry.playtime = (entry.playtime or 0) + sessionLength
		entry.lastSeen = os.time()

		-- Store individual session length (keep last 50 for median/distribution)
		if not entry.sessionLengths then
			entry.sessionLengths = {}
		end
		table.insert(entry.sessionLengths, sessionLength)
		if #entry.sessionLengths > 50 then
			table.remove(entry.sessionLengths, 1) -- drop oldest
		end
	end

	-- Persist the updated registry
	savePlayers()
end)

-- ============================================================
-- Periodic recording thread
-- ============================================================

CreateThread(function()
	while true do
		Wait(STATS_INTERVAL * 1000)
		recordPlayerCount()
		recordWorldSnapshot()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		savePlayers()
		saveWorld()
	end
end)

-- ============================================================
-- Startup: load, migrate, backfill, record initial
-- ============================================================

loadPlayers()
migrateOldHistory()
loadWorld()
backfillPlayerCounts()

-- Save after backfill (may have added zero-count entries)
if #playerCounts > 0 then
	savePlayers()
end

-- Record initial snapshot
recordPlayerCount()
recordWorldSnapshot()

-- ============================================================
-- Dashboard server events
-- ============================================================

RegisterServerEvent('EasyAdmin:requestServerStats', function()
	local src = source
	local maxPlayers = tonumber(GetConvar('sv_maxClients', '48')) or 48

	-- Resource stats
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

	-- Entity counts (server-side only)
	local vehicles = #GetAllVehicles()
	local peds = #GetAllPeds()
	local objects = #GetAllObjects()

	TriggerClientEvent('EasyAdmin:serverStatsResult', src, {
		maxPlayers = maxPlayers,
		resources = {
			total = resourceCount,
			started = started,
			stopped = stopped,
		},
		entities = {
			vehicles = vehicles,
			peds = peds,
			objects = objects,
		},
	})
end)

RegisterServerEvent('EasyAdmin:requestPlayerHistory', function(range)
	local src = source
	local now = os.time()
	local cutoff

	if range == '1h' then
		cutoff = now - 3600
	elseif range == '6h' then
		cutoff = now - 21600
	elseif range == '24h' then
		cutoff = now - 86400
	elseif range == '7d' then
		cutoff = now - (7 * 86400)
	elseif range == '30d' then
		cutoff = now - (30 * 86400)
	elseif range == '90d' then
		cutoff = now - (90 * 86400)
	elseif range == '120d' then
		cutoff = now - STATS_RETENTION
	else
		cutoff = now - 86400 -- default 24h
	end

	local result = {}
	for _, entry in ipairs(playerCounts) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end

	if #result == 0 then
		table.insert(result, { timestamp = now, count = #GetPlayers() })
	end

	TriggerClientEvent('EasyAdmin:playerHistoryResult', src, result)
end)

---Return world entity snapshots for a given time range.
RegisterServerEvent('EasyAdmin:requestWorldHistory', function(range)
	local src = source
	local now = os.time()
	local cutoff

	if range == '1h' then
		cutoff = now - 3600
	elseif range == '6h' then
		cutoff = now - 21600
	elseif range == '24h' then
		cutoff = now - 86400
	elseif range == '7d' then
		cutoff = now - (7 * 86400)
	elseif range == '30d' then
		cutoff = now - (30 * 86400)
	elseif range == '90d' then
		cutoff = now - (90 * 86400)
	elseif range == '120d' then
		cutoff = now - STATS_RETENTION
	else
		cutoff = now - 86400
	end

	local result = {}
	for _, entry in ipairs(worldSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end

	TriggerClientEvent('EasyAdmin:worldHistoryResult', src, result)
end)

---Return player registry data for retention/churn analytics.
---Optional filter: only players first seen within the last N days.
---
---DEPRECATED: Use EasyAdmin:requestPlayerRegistryPage for server-side pagination.
---Kept for backward compatibility — returns ALL matching players.
RegisterServerEvent('EasyAdmin:requestPlayerRegistry', function(filterDays)
	local src = source
	local now = os.time()
	local result = {}

	local cutoff = filterDays and now - (tonumber(filterDays) * 86400) or 0

	for _, data in ipairs(playerRegistry) do
		if data.firstSeen and data.firstSeen >= cutoff then
			table.insert(result, {
				name        = data.name or 'Unknown',
				identifier  = pickStableIdentifier(data.identifiers),
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

---Paginated player registry request (server-side pagination for large registries).
---Returns lightweight entries without full identifier lists to minimise payload size.
---Supports server-side search by name and sort by sessions/playtime/lastSeen.
RegisterServerEvent('EasyAdmin:requestPlayerRegistryPage', function(data)
	local src = source
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

	-- Build filtered list (server-side search)
	local filtered = {}
	for _, data in ipairs(playerRegistry) do
		if data.firstSeen and data.firstSeen < cutoff then
			goto continue
		end
		if query then
			local name = (data.name or 'Unknown'):lower()
			if not name:find(query, 1, true) then
				goto continue
			end
		end
		table.insert(filtered, {
			name        = data.name or 'Unknown',
			identifier  = pickStableIdentifier(data.identifiers),
			firstSeen   = data.firstSeen or 0,
			lastSeen    = data.lastSeen or 0,
			sessions    = data.sessions or 0,
			playtime    = data.playtime or 0,
		})
		::continue::
	end

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

	-- Return only the page slice
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

---Return aggregated summary statistics for a given time range.
RegisterServerEvent('EasyAdmin:requestStatsSummary', function(range) -- luacheck: ignore 212 (src)
	local now = os.time()
	local days

	if range == '7d' then
		days = 7
	elseif range == '30d' then
		days = 30
	elseif range == '90d' then
		days = 90
	elseif range == '120d' then
		days = 120
	else
		days = 30
	end

	local cutoff = now - (days * 86400)

	-- Player registry stats
	local totalUnique = 0
	local newPlayers = 0
	local returningPlayers = 0
	local totalSessions = 0
	local totalPlaytime = 0

	-- Collect ALL individual session lengths across all players
	local allSessionLengths = {}

	for _, data in ipairs(playerRegistry) do
		totalUnique = totalUnique + 1

		if data.firstSeen and data.firstSeen >= cutoff then
			newPlayers = newPlayers + 1
		end

		if (data.sessions or 0) > 1 then
			returningPlayers = returningPlayers + 1
		end

		local sessions = data.sessions or 0
		totalSessions = totalSessions + sessions

		local playtime = data.playtime or 0
		totalPlaytime = totalPlaytime + playtime

		-- Collect individual session lengths for true avg/median
		if data.sessionLengths and #data.sessionLengths > 0 then
			for _, sl in ipairs(data.sessionLengths) do
				table.insert(allSessionLengths, sl)
			end
		end
	end

	-- Retention rate: percentage of all tracked players who returned
	local retentionRate = totalUnique > 0 and (returningPlayers / totalUnique) * 100 or 0

	-- Average session length (from individual sessions)
	local avgSession = 0
	if #allSessionLengths > 0 then
		local sum = 0
		for _, sl in ipairs(allSessionLengths) do
			sum = sum + sl
		end
		avgSession = sum / #allSessionLengths
	end

	-- Median session length (from individual sessions)
	table.sort(allSessionLengths)
	local medianSession = 0
	if #allSessionLengths > 0 then
		local mid = math.ceil(#allSessionLengths / 2)
		if #allSessionLengths % 2 == 1 then
			medianSession = allSessionLengths[mid]
		else
			medianSession = (allSessionLengths[mid] + allSessionLengths[mid + 1]) / 2
		end
	end

	-- Shortest and longest session
	local shortestSession = #allSessionLengths > 0 and allSessionLengths[1] or 0
	local longestSession = #allSessionLengths > 0 and allSessionLengths[#allSessionLengths] or 0

	TriggerClientEvent('EasyAdmin:statsSummaryResult', source, {
		totalUnique        = totalUnique,
		newPlayers         = newPlayers,
		returningPlayers   = returningPlayers,
		retentionRate      = math.floor(retentionRate * 10) / 10,
		avgSessionLength   = math.floor(avgSession),
		medianSessionLength = math.floor(medianSession),
		shortestSession    = math.floor(shortestSession),
		longestSession     = math.floor(longestSession),
		totalSessions      = totalSessions,
		totalPlaytime      = totalPlaytime,
	})
end)

---Return daily peak/avg/min player counts for a given time range.
RegisterServerEvent('EasyAdmin:requestDailyPeaks', function(range) -- luacheck: ignore 212 (src)
	local now = os.time()
	local days

	if range == '7d' then
		days = 7
	elseif range == '30d' then
		days = 30
	elseif range == '90d' then
		days = 90
	elseif range == '120d' then
		days = 120
	else
		days = 30
	end

	local cutoff = now - (days * 86400)

	-- Group playerCounts by day
	local daily = {}
	for _, entry in ipairs(playerCounts) do
		if entry.timestamp >= cutoff then
			-- Truncate to start of day (UTC)
			local dayStart = entry.timestamp - (entry.timestamp % 86400)
			if not daily[dayStart] then
				daily[dayStart] = { max = 0, min = math.huge, sum = 0, count = 0 }
			end
			local d = daily[dayStart]
			if entry.count > d.max then d.max = entry.count end
			if entry.count < d.min then d.min = entry.count end
			d.sum = d.sum + entry.count
			d.count = d.count + 1
		end
	end

	-- Convert to sorted array
	local result = {}
	for day, stats in pairs(daily) do
		table.insert(result, {
			day     = day,
			max     = stats.max,
			avg     = math.floor(stats.sum / stats.count),
			min     = stats.min == math.huge and 0 or stats.min,
			entries = stats.count,
		})
	end
	table.sort(result, function(a, b) return a.day < b.day end)

	TriggerClientEvent('EasyAdmin:dailyPeaksResult', source, result)
end)
