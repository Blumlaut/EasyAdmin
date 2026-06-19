------------------------------------
-- EasyAdmin: Network statistics
-- Periodic snapshots of per-player peer statistics.
-- Persists to data/statistics/network.json
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
-- ENet packet loss scale factor
local ENET_PACKET_LOSS_SCALE = 65536

-- File path
local networkFile = 'data/statistics/network.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Network snapshots: { { timestamp, players: { [serverId]: stats }, avgPing, worstPing, avgLoss }, ... }
local networkSnapshots = {}

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
	local data = LoadJsonResourceFile(networkFile, {})
	networkSnapshots = data.snapshots or {}
end

local function save()
	SaveJsonResourceFile(networkFile, { snapshots = networkSnapshots })
end

-- ============================================================
-- Recording
-- ============================================================

---Collect peer statistics for all connected players.
---@return table per-player stats keyed by serverId
local function collectPlayerStats()
	local players = GetPlayers()
	local stats = {}

	for _, playerId in ipairs(players) do
		local rtt = GetPlayerPeerStatistics(playerId, 3)      -- RoundTripTime
		local rttVariance = GetPlayerPeerStatistics(playerId, 4) -- RoundTripTimeVariance
		local lastRtt = GetPlayerPeerStatistics(playerId, 5)     -- LastRoundTripTime
		local rawLoss = GetPlayerPeerStatistics(playerId, 0)     -- PacketLoss (raw)
		local lossPercent = math.floor((rawLoss / ENET_PACKET_LOSS_SCALE) * 1000 + 0.5) / 10 -- 1 decimal

		stats[tostring(playerId)] = {
			rtt = rtt,              -- mean ping in ms
			rttVariance = rttVariance, -- jitter in ms
			lastRtt = lastRtt,      -- last recorded RTT in ms
			packetLoss = lossPercent, -- packet loss percentage (1 decimal)
		}
	end

	return stats
end

---Calculate summary stats from per-player data.
---@param playerStats table keyed by serverId
---@return number avgPing, number worstPing, number avgJitter, number avgLoss
local function calcSummary(playerStats)
	if not playerStats or next(playerStats) == nil then
		return 0, 0, 0, 0
	end

	local totalPing = 0
	local worstPing = 0
	local totalJitter = 0
	local totalLoss = 0
	local count = 0

	for _, s in pairs(playerStats) do
		totalPing = totalPing + s.rtt
		if s.rtt > worstPing then worstPing = s.rtt end
		totalJitter = totalJitter + s.rttVariance
		totalLoss = totalLoss + s.packetLoss
		count = count + 1
	end

	return math.floor(totalPing / count + 0.5), worstPing,
		math.floor((totalJitter / count) * 10 + 0.5) / 10,
		math.floor((totalLoss / count) * 10 + 0.5) / 10
end

local function recordSnapshot()
	local now = os.time()

	-- Dedup
	local last = networkSnapshots[#networkSnapshots]
	if last and now - last.timestamp < DEDUP_WINDOW then
		return
	end

	local playerStats = collectPlayerStats()
	local avgPing, worstPing, avgJitter, avgLoss = calcSummary(playerStats)

	table.insert(networkSnapshots, {
		timestamp = now,
		players = playerStats,
		avgPing = avgPing,
		worstPing = worstPing,
		avgJitter = avgJitter,
		avgLoss = avgLoss,
	})

	pruneEntries(networkSnapshots)
	save()
end

-- ============================================================
-- Public API
-- ============================================================

---Get network snapshots within a time cutoff (unix seconds).
---Omits per-player detail to keep payloads small; returns summary only.
---@param cutoff number unix timestamp
---@return table
function GetNetworkSnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(networkSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, {
				timestamp = entry.timestamp,
				avgPing = entry.avgPing,
				worstPing = entry.worstPing,
				avgJitter = entry.avgJitter,
				avgLoss = entry.avgLoss,
			})
		end
	end
	return result
end

---Get historical stats for a specific player within a time cutoff.
---Extracts the player's per-snapshot data from the full history.
---@param serverId string player server ID
---@param cutoff number unix timestamp
---@return table array of { timestamp, rtt, rttVariance, lastRtt, packetLoss }
function GetPlayerNetworkHistory(serverId, cutoff)
	local result = {}
	for _, entry in ipairs(networkSnapshots) do
		if entry.timestamp >= cutoff and entry.players and entry.players[serverId] then
			local p = entry.players[serverId]
			table.insert(result, {
				timestamp = entry.timestamp,
				rtt = p.rtt,
				rttVariance = p.rttVariance,
				lastRtt = p.lastRtt,
				packetLoss = p.packetLoss,
			})
		end
	end
	return result
end

---Get current live peer statistics for all connected players.
---@return table per-player stats keyed by serverId
function GetCurrentNetworkStats()
	return collectPlayerStats()
end

---Get the last recorded snapshot that has player data.
---Skips empty snapshots (recorded when no players were online).
---Returns nil if no snapshot with data exists.
---@return table|nil snapshot with { timestamp, players, avgPing, worstPing, avgJitter, avgLoss }
function GetLastNetworkSnapshot()
	for i = #networkSnapshots, 1, -1 do
		local entry = networkSnapshots[i]
		if entry.players and next(entry.players) then
			return {
				timestamp = entry.timestamp,
				players = entry.players,
				avgPing = entry.avgPing,
				worstPing = entry.worstPing,
				avgJitter = entry.avgJitter,
				avgLoss = entry.avgLoss,
			}
		end
	end
	return nil
end

---Get average ping from the last recorded snapshot (ms).
---Returns 0 if no snapshots exist.
---@return number average ping in ms, 0 if no snapshots
function GetLastNetworkAvgPing()
	local last = networkSnapshots[#networkSnapshots]
	return last and last.avgPing or 0
end

-- ============================================================
-- Periodic recording thread
-- ============================================================

CreateThread(function()
	while true do
		Wait(STATS_INTERVAL * 1000)
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
