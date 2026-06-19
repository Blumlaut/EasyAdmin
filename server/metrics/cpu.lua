------------------------------------
-- EasyAdmin: CPU usage metrics
-- Samples CPU usage via os.execute / io.popen on both Windows and Linux.
-- Stores historical snapshots for charting.
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Sampling interval: 60 seconds
local CPU_INTERVAL = 60000
-- Retention: 30 days
local CPU_RETENTION = 30 * 86400
-- Dedup window: 30 seconds
local CPU_DEDUP = 30

-- File path
local cpuFile = 'data/metrics/cpu.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- CPU snapshots: { { timestamp, usagePercent, coreCount }, ... }
local cpuSnapshots = {}

-- ============================================================
-- Linux CPU sampling
-- ============================================================

---Parse /proc/stat to get CPU usage percentage.
---Reads twice with a short delay for delta calculation.
---@return number|nil usagePercent (0-100)
local function sampleLinuxCPU()
	-- First read
	local statFile = io.open('/proc/stat', 'r')
	if not statFile then return nil end

	local firstLine = statFile:read('*l')
	statFile:close()

	if not firstLine then return nil end

	-- Parse "cpu  user nice system idle iowait irq softirq steal"
	local parts = {}
	for word in firstLine:gmatch('%S+') do
		table.insert(parts, word)
	end

	if #parts < 5 then return nil end

	local user1 = tonumber(parts[2]) or 0
	local nice1 = tonumber(parts[3]) or 0
	local system1 = tonumber(parts[4]) or 0
	local idle1 = tonumber(parts[5]) or 0
	local iowait1 = tonumber(parts[6]) or 0
	local irq1 = tonumber(parts[7]) or 0
	local softirq1 = tonumber(parts[8]) or 0
	local steal1 = tonumber(parts[9]) or 0

	-- Wait 1 second for delta
	Wait(1000)

	-- Second read
	statFile = io.open('/proc/stat', 'r')
	if not statFile then return nil end

	firstLine = statFile:read('*l')
	statFile:close()

	if not firstLine then return nil end

	parts = {}
	for word in firstLine:gmatch('%S+') do
		table.insert(parts, word)
	end

	if #parts < 5 then return nil end

	local user2 = tonumber(parts[2]) or 0
	local nice2 = tonumber(parts[3]) or 0
	local system2 = tonumber(parts[4]) or 0
	local idle2 = tonumber(parts[5]) or 0
	local iowait2 = tonumber(parts[6]) or 0
	local irq2 = tonumber(parts[7]) or 0
	local softirq2 = tonumber(parts[8]) or 0
	local steal2 = tonumber(parts[9]) or 0

	-- Calculate delta
	local total1 = user1 + nice1 + system1 + idle1 + iowait1 + irq1 + softirq1 + steal1
	local total2 = user2 + nice2 + system2 + idle2 + iowait2 + irq2 + softirq2 + steal2

	local totalDelta = total2 - total1
	local idleDelta = idle2 - idle1

	if totalDelta == 0 then return 0 end

	local usage = ((totalDelta - idleDelta) / totalDelta) * 100
	return math.max(0, math.min(100, usage))
end

---Get core count on Linux via /proc/cpuinfo
---@return number
local function getLinuxCoreCount()
	local count = 0
	local f = io.open('/proc/cpuinfo', 'r')
	if not f then return 1 end

	for line in f:lines() do
		if line:find('^processor') then
			count = count + 1
		end
	end
	f:close()
	return math.max(1, count)
end

-- ============================================================
-- Windows CPU sampling
-- ============================================================

---Parse wmic output for CPU usage on Windows.
---@return number|nil usagePercent (0-100)
local function sampleWindowsCPU()
	local output, err = execCommand('wmic cpu get LoadPercentage /format:list')
	if not output or err then return nil end

	-- Output format: LoadPercentage=XX
	for line in output:gmatch('[^\r\n]+') do
		local value = line:match('LoadPercentage=(%d+)')
		if value then
			return tonumber(value)
		end
	end

	-- Fallback: try tasklist-based approach
	output, err = execCommand('powershell -Command "(Get-CimInstance Win32_Processor).LoadPercentage"')
	if output and not err then
		local value = output:match('%s*(%d+)%s*')
		if value then
			return tonumber(value)
		end
	end

	return nil
end

---Get core count on Windows via wmic
---@return number
local function getWindowsCoreCount()
	local output = execCommand('wmic cpu get NumberOfCores /format:list')
	if not output then return 1 end

	for line in output:gmatch('[^\r\n]+') do
		local value = line:match('NumberOfCores=(%d+)')
		if value then
			return math.max(1, tonumber(value))
		end
	end
	return 1
end

-- ============================================================
-- Helpers
-- ============================================================

local function pruneSnapshots()
	local now = os.time()
	local cutoff = now - CPU_RETENTION
	for i = #cpuSnapshots, 1, -1 do
		if cpuSnapshots[i].timestamp < cutoff then
			table.remove(cpuSnapshots, i)
		else
			break
		end
	end
end

-- ============================================================
-- Sampling
-- ============================================================

local coreCount = 1

local function recordCPU()
	local now = os.time()

	-- Dedup
	local last = cpuSnapshots[#cpuSnapshots]
	if last and now - last.timestamp < CPU_DEDUP then
		return
	end

	local usage
	if IsLinux() then
		usage = sampleLinuxCPU()
	else
		usage = sampleWindowsCPU()
	end

	if usage == nil then
		return
	end

	table.insert(cpuSnapshots, {
		timestamp    = now,
		usagePercent = math.floor(usage * 10) / 10,
		coreCount    = coreCount,
	})

	pruneSnapshots()
	SaveJsonResourceFile(cpuFile, { snapshots = cpuSnapshots })
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(cpuFile, {})
	cpuSnapshots = data.snapshots or {}
end

-- ============================================================
-- Public API
-- ============================================================

---Get CPU snapshots after a cutoff timestamp
---@param cutoff number unix timestamp
---@return table
function GetCPUSnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(cpuSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get current core count
function GetCoreCount()
	return coreCount
end

-- ============================================================
-- Periodic sampling thread
-- ============================================================

CreateThread(function()
	-- Detect core count once at startup
	if IsLinux() then
		coreCount = getLinuxCoreCount()
	else
		coreCount = getWindowsCoreCount()
	end

	PrintDebugMessage(string.format('Metrics: CPU - %d core(s) detected', coreCount), 3)

	load()

	while true do
		Wait(CPU_INTERVAL)
		recordCPU()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		SaveJsonResourceFile(cpuFile, { snapshots = cpuSnapshots })
	end
end)
