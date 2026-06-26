------------------------------------
-- EasyAdmin: World entity snapshots
-- Periodic snapshots of vehicles, peds, and objects.
-- Persists to data/statistics/world.json
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Retention: 120 days in seconds
local STATS_RETENTION = 120 * 86400
-- Minimum gap between duplicate entries: 1 minute
local DEDUP_WINDOW = 60

-- File path
local worldFile = 'data/statistics/world.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- World entity snapshots: { { timestamp, vehicles, peds, objects }, ... }
local worldSnapshots = {}

-- ============================================================
-- Helpers
-- ============================================================

---Prune time-series entries older than STATS_RETENTION (oldest-first arrays)
local function pruneEntries(entries)
	local now = os.time()
	local cutoff = now - STATS_RETENTION
	for i = #entries, 1, -1 do
		if entries[i].timestamp < cutoff then
			table.remove(entries, i)
		else
			break
		end
	end
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(worldFile, {})
	worldSnapshots = data.snapshots or {}
end

local function save()
	SaveJsonResourceFile(worldFile, { snapshots = worldSnapshots })
end

-- ============================================================
-- Recording
-- ============================================================

local function recordSnapshot()
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
	save()
end

-- ============================================================
-- Public API
-- ============================================================

---Get world snapshots within a time cutoff (unix seconds)
---@param cutoff number unix timestamp
---@return table
function GetWorldSnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(worldSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get current entity counts
---@return table
function GetCurrentEntities()
	return {
		vehicles = #GetAllVehicles(),
		peds     = #GetAllPeds(),
		objects  = #GetAllObjects(),
	}
end

-- ============================================================
-- Periodic recording thread
-- ============================================================

CreateThread(function()
	while true do
		Wait(900000) -- 15 minutes (matches STATS_INTERVAL in player_history)
		recordSnapshot()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		save()
	end
end)

-- ============================================================
-- Startup
-- ============================================================

load()
recordSnapshot()
