------------------------------------
-- EasyAdmin: Memory (RAM) metrics
-- Samples total/used/free RAM on both Windows and Linux.
-- Stores historical snapshots for charting.
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Sampling interval: 60 seconds
local MEM_INTERVAL = 60000
-- Retention: 30 days
local MEM_RETENTION = 30 * 86400
-- Dedup window: 30 seconds
local MEM_DEDUP = 30

-- File path
local memFile = 'data/metrics/memory.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Memory snapshots: { { timestamp, totalMB, usedMB, freeMB, usagePercent }, ... }
local memSnapshots = {}

-- ============================================================
-- Linux memory sampling
-- ============================================================

---Parse /proc/meminfo to get memory stats.
---@return table|nil { totalMB, usedMB, freeMB, usagePercent }
local function sampleLinuxMemory()
	local meminfo = io.open('/proc/meminfo', 'r')
	if not meminfo then return nil end

	local info = {}
	for line in meminfo:lines() do
		local key, value = line:match('^(%w+):%s*(%d+)')
		if key and value then
			info[key] = tonumber(value) -- values in kB
		end
	end
	meminfo:close()

	if not info.MemTotal or info.MemTotal == 0 then return nil end

	local totalKB = info.MemTotal
	local freeKB = info.MemFree or 0
	local buffersKB = info.Buffers or 0
	local cachedKB = info.Cached or 0
	local availableKB = info.MemAvailable or (freeKB + buffersKB + cachedKB)

	-- Used = Total - Available (more accurate than Total - Free)
	local usedKB = totalKB - availableKB

	return {
		totalMB      = math.floor(totalKB / 1024),
		usedMB       = math.floor(usedKB / 1024),
		freeMB       = math.floor(availableKB / 1024),
		usagePercent = math.floor((usedKB / totalKB) * 1000) / 10,
	}
end

-- ============================================================
-- Windows memory sampling
-- ============================================================

---Parse wmic output for memory stats on Windows.
---@return table|nil { totalMB, usedMB, freeMB, usagePercent }
local function sampleWindowsMemory()
	-- Use PowerShell for reliable JSON-like output
	local output = execCommand('powershell -Command "$os = Get-CimInstance Win32_OperatingSystem; [PSCustomObject]@{Total=$os.TotalVisibleMemorySize;Free=$os.FreePhysicalMemory}"')
	if not output then return nil end

	-- Parse the output (PowerShell table format)
	local totalKB = 0
	local freeKB = 0

	for line in output:gmatch('[^\r\n]+') do
		local t = line:match('TotalVisibleMemorySize%s+(%d+)')
		if t then totalKB = tonumber(t) end

		local f = line:match('FreePhysicalMemory%s+(%d+)')
		if f then freeKB = tonumber(f) end
	end

	if totalKB == 0 then return nil end

	local usedKB = totalKB - freeKB

	return {
		totalMB      = math.floor(totalKB / 1024),
		usedMB       = math.floor(usedKB / 1024),
		freeMB       = math.floor(freeKB / 1024),
		usagePercent = math.floor((usedKB / totalKB) * 1000) / 10,
	}
end

-- ============================================================
-- Helpers
-- ============================================================

local function pruneSnapshots()
	local now = os.time()
	local cutoff = now - MEM_RETENTION
	for i = #memSnapshots, 1, -1 do
		if memSnapshots[i].timestamp < cutoff then
			table.remove(memSnapshots, i)
		else
			break
		end
	end
end

-- ============================================================
-- Sampling
-- ============================================================

local function recordMemory()
	local now = os.time()

	-- Dedup
	local last = memSnapshots[#memSnapshots]
	if last and now - last.timestamp < MEM_DEDUP then
		return
	end

	local stats
	if IsLinux() then
		stats = sampleLinuxMemory()
	else
		stats = sampleWindowsMemory()
	end

	if not stats then return end

	table.insert(memSnapshots, {
		timestamp    = now,
		totalMB      = stats.totalMB,
		usedMB       = stats.usedMB,
		freeMB       = stats.freeMB,
		usagePercent = stats.usagePercent,
	})

	pruneSnapshots()
	SaveJsonResourceFile(memFile, { snapshots = memSnapshots })
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(memFile, {})
	memSnapshots = data.snapshots or {}
end

-- ============================================================
-- Public API
-- ============================================================

---Get memory snapshots after a cutoff timestamp
---@param cutoff number unix timestamp
---@return table
function GetMemorySnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(memSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get current memory info (latest snapshot or fresh sample)
---@return table|nil
function GetCurrentMemory()
	if #memSnapshots > 0 then
		return memSnapshots[#memSnapshots]
	end

	if IsLinux() then
		return sampleLinuxMemory()
	else
		return sampleWindowsMemory()
	end
end

-- ============================================================
-- Periodic sampling thread
-- ============================================================

CreateThread(function()
	load()

	-- Record initial snapshot immediately
	recordMemory()

	while true do
		Wait(MEM_INTERVAL)
		recordMemory()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		SaveJsonResourceFile(memFile, { snapshots = memSnapshots })
	end
end)
