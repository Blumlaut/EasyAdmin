------------------------------------
-- EasyAdmin: Player count history
-- Periodic snapshots of online player count with gap backfill.
-- Persists to data/statistics/players.json
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

-- File path
local playersFile = 'data/statistics/players.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Player count snapshots: { { timestamp, count }, ... }
local playerCounts = {}

-- ============================================================
-- Helpers
-- ============================================================

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
-- Persistence
-- ============================================================

---Load player counts from disk
local function load()
	local data = LoadJsonResourceFile(playersFile, {})
	playerCounts = data.playerCounts or {}
end

---Save player counts to disk
local function save()
	-- We only persist playerCounts here; the registry layer saves the full file.
	-- This is called during periodic snapshots. The registry module handles
	-- the full save on player events.
	SaveJsonResourceFile(playersFile, { playerCounts = playerCounts })
end

-- ============================================================
-- Backfill offline gaps
-- ============================================================

---If the last entry is older than one interval, insert zero-count entries
---to cover the gap (server was offline).
local function backfill()
	local now = os.time()
	local last = playerCounts[#playerCounts]
	if not last then return end

	local gapStart = last.timestamp + STATS_INTERVAL
	if gapStart > now then return end -- no gap

	local gapEnd = now - (now % STATS_INTERVAL) -- align to interval boundary
	local t = gapStart
	while t <= gapEnd do
		table.insert(playerCounts, { timestamp = t, count = 0, avgPing = 0 })
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
			table.insert(playerCounts, { timestamp = entry.timestamp, count = entry.count, avgPing = entry.avgPing or 0 })
			migrated = migrated + 1
		end
	end

	if migrated > 0 then
		PrintDebugMessage(string.format('Migrated %d entries from %s.', migrated, oldPath), 2)
	end
end

-- ============================================================
-- Recording
-- ============================================================

---Calculate average ping across all connected players (ms).
---@return number average ping in ms, 0 if no players
function CalculateAvgPing()
	local players = GetPlayers()
	local count = #players
	if count == 0 then return 0 end

	local totalPing = 0
	for _, playerId in ipairs(players) do
		totalPing = totalPing + GetPlayerPing(playerId)
	end

	return math.floor(totalPing / count + 0.5)
end

local function recordPlayerCount()
	local count = #GetPlayers()
	local now = os.time()

	-- Dedup: skip if we already have an entry within DEDUP_WINDOW
	local last = playerCounts[#playerCounts]
	if last and now - last.timestamp < DEDUP_WINDOW then
		return
	end

	local avgPing = CalculateAvgPing()
	table.insert(playerCounts, { timestamp = now, count = count, avgPing = avgPing })
	pruneEntries(playerCounts)
	save()
end

-- ============================================================
-- Public API
-- ============================================================

---Get player counts within a time cutoff (unix seconds)
---@param cutoff number unix timestamp
---@return table
function GetPlayerCountsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(playerCounts) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get daily aggregated peak/avg/min player counts (with avg ping).
---@param cutoff number unix timestamp
---@return table
function GetDailyPlayerStats(cutoff)
	-- Group playerCounts by day
	local daily = {}
	for _, entry in ipairs(playerCounts) do
		if entry.timestamp >= cutoff then
			local dayStart = entry.timestamp - (entry.timestamp % 86400)
			if not daily[dayStart] then
				daily[dayStart] = { max = 0, min = math.huge, sum = 0, count = 0, pingSum = 0, pingCount = 0, pingMin = math.huge, pingMax = 0 }
			end
			local d = daily[dayStart]
			if entry.count > d.max then d.max = entry.count end
			if entry.count < d.min then d.min = entry.count end
			d.sum = d.sum + entry.count
			d.count = d.count + 1

			-- Accumulate ping data (only when players were online)
			if entry.avgPing and entry.avgPing > 0 then
				d.pingSum = d.pingSum + entry.avgPing
				d.pingCount = d.pingCount + 1
				if entry.avgPing < d.pingMin then d.pingMin = entry.avgPing end
				if entry.avgPing > d.pingMax then d.pingMax = entry.avgPing end
			end
		end
	end

	local result = {}
	for day, stats in pairs(daily) do
		local avgPing = 0
		local pingMin = 0
		local pingMax = 0
		if stats.pingCount > 0 then
			avgPing = math.floor(stats.pingSum / stats.pingCount + 0.5)
			pingMin = math.floor(stats.pingMin + 0.5)
			pingMax = math.floor(stats.pingMax + 0.5)
		end
		table.insert(result, {
			day      = day,
			max      = stats.max,
			avg      = math.floor(stats.sum / stats.count),
			min      = stats.min == math.huge and 0 or stats.min,
			entries  = stats.count,
			avgPing  = avgPing,
			pingMin  = pingMin,
			pingMax  = pingMax,
		})
	end
	table.sort(result, function(a, b) return a.day < b.day end)
	return result
end

---Get retention period in seconds
function GetRetention()
	return STATS_RETENTION
end

---Get average ping from the last recorded snapshot (ms).
---Returns 0 if no snapshots exist. Avoids iterating live players.
---@return number average ping in ms, 0 if no snapshots
function GetLastAvgPing()
	local last = playerCounts[#playerCounts]
	return last and last.avgPing or 0
end

---Get peak player count for today (from snapshots, or live count if no snapshots).
---@return number peak player count today
function GetTodayPeak()
	local now = os.time()
	local todayStart = now - (now % 86400)
	local peak = 0
	for _, entry in ipairs(playerCounts) do
		if entry.timestamp >= todayStart and entry.count > peak then
			peak = entry.count
		end
	end
	-- If no snapshots today yet, fall back to live count
	if peak == 0 then
		peak = #GetPlayers()
	end
	return peak
end

-- ============================================================
-- Periodic recording thread
-- ============================================================

CreateThread(function()
	while true do
		Wait(STATS_INTERVAL * 1000)
		recordPlayerCount()
	end
end)

-- ============================================================
-- Startup: load, migrate, backfill, record initial
-- ============================================================

load()
migrateOldHistory()
backfill()
recordPlayerCount()
