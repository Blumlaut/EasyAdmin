------------------------------------
-- EasyAdmin: Network metrics
-- Samples network throughput (bytes in/out) on both Windows and Linux.
-- Stores historical snapshots for charting.
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Sampling interval: 30 seconds
local NET_INTERVAL = 30000
-- Retention: 30 days
local NET_RETENTION = 30 * 86400
-- Dedup window: 15 seconds
local NET_DEDUP = 15

-- File path
local netFile = 'data/metrics/network.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Network snapshots: { { timestamp, bytesInMBps, bytesOutMBps, packetsIn, packetsOut }, ... }
local netSnapshots = {}

-- Previous cumulative counters for delta calculation
local prevBytesIn = 0
local prevBytesOut = 0
local prevTimestamp = 0

-- ============================================================
-- Linux network sampling
-- ============================================================

---Read cumulative network bytes from /proc/net/dev.
---@return number bytesIn, number bytesOut
local function processLinuxNetLine(line, totalIn, totalOut)
	-- Skip header lines
	if line:find('Inter-') or line:find('Recv-') then
		return totalIn, totalOut
	end

	-- Format: "eth0: 1234 567 890 ...  abc  def ghi ..."
	-- Fields: iface: recv_bytes recv_packets ... transmit_bytes transmit_packets ...
	local iface = line:match('^%s*(%S+):')
	if not iface then
		return totalIn, totalOut
	end

	-- Skip loopback
	if iface == 'lo' then
		return totalIn, totalOut
	end

	local fields = {}
	for word in line:gmatch('%S+') do
		table.insert(fields, word)
	end

	-- Remove the "iface:" prefix entry
	table.remove(fields, 1)

	if #fields >= 9 then
		totalIn = totalIn + (tonumber(fields[1]) or 0)  -- recv_bytes
		totalOut = totalOut + (tonumber(fields[9]) or 0) -- transmit_bytes
	end

	return totalIn, totalOut
end

local function readLinuxNetCounters()
	local dev = io.open('/proc/net/dev', 'r')
	if not dev then return 0, 0 end

	local totalIn = 0
	local totalOut = 0

	for line in dev:lines() do
		totalIn, totalOut = processLinuxNetLine(line, totalIn, totalOut)
	end

	dev:close()
	return totalIn, totalOut
end

-- ============================================================
-- Windows network sampling
-- ============================================================

---Read cumulative network bytes via wmic on Windows.
---@return number bytesIn, number bytesOut
local function readWindowsNetCounters()
	local output = execCommand('wmic nicconfig where IPEnabled=true get BytesReceived,BytesSent /format:list')
	if not output then return 0, 0 end

	local totalIn = 0
	local totalOut = 0

	for line in output:gmatch('[^\r\n]+') do
		local key, value = line:match('^(BytesReceived|BytesSent)=(.*)')
		if key and value then
			local num = tonumber(value:gsub('%s+', '')) or 0
			if key == 'BytesReceived' then
				totalIn = totalIn + num
			elseif key == 'BytesSent' then
				totalOut = totalOut + num
			end
		end
	end

	return totalIn, totalOut
end

-- ============================================================
-- Helpers
-- ============================================================

local function pruneSnapshots()
	local now = os.time()
	local cutoff = now - NET_RETENTION
	for i = #netSnapshots, 1, -1 do
		if netSnapshots[i].timestamp < cutoff then
			table.remove(netSnapshots, i)
		else
			break
		end
	end
end

-- ============================================================
-- Sampling
-- ============================================================

local function recordNetwork()
	local now = os.time()

	-- Dedup
	local last = netSnapshots[#netSnapshots]
	if last and now - last.timestamp < NET_DEDUP then
		return
	end

	local bytesIn, bytesOut
	if IsLinux() then
		bytesIn, bytesOut = readLinuxNetCounters()
	else
		bytesIn, bytesOut = readWindowsNetCounters()
	end

	-- Calculate delta (MB/s since last sample)
	local bytesInMBps = 0
	local bytesOutMBps = 0

	if prevTimestamp > 0 then
		local deltaSeconds = now - prevTimestamp
		if deltaSeconds > 0 then
			local deltaIn = bytesIn - prevBytesIn
			local deltaOut = bytesOut - prevBytesOut
			bytesInMBps = math.floor(((deltaIn / deltaSeconds) / (1024 * 1024)) * 100) / 100
			bytesOutMBps = math.floor(((deltaOut / deltaSeconds) / (1024 * 1024)) * 100) / 100
		end
	end

	prevBytesIn = bytesIn
	prevBytesOut = bytesOut
	prevTimestamp = now

	table.insert(netSnapshots, {
		timestamp    = now,
		bytesInMBps  = math.max(0, bytesInMBps),
		bytesOutMBps = math.max(0, bytesOutMBps),
		totalBytesIn = bytesIn,
		totalBytesOut = bytesOut,
	})

	pruneSnapshots()
	SaveJsonResourceFile(netFile, { snapshots = netSnapshots })
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(netFile, {})
	netSnapshots = data.snapshots or {}

	-- Restore previous counters from last entry
	if #netSnapshots > 0 then
		local last = netSnapshots[#netSnapshots]
		prevBytesIn = last.totalBytesIn or 0
		prevBytesOut = last.totalBytesOut or 0
		prevTimestamp = last.timestamp or 0
	end
end

-- ============================================================
-- Public API
-- ============================================================

---Get network snapshots after a cutoff timestamp
---@param cutoff number unix timestamp
---@return table
function GetNetworkSnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(netSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get current network info (latest snapshot)
---@return table|nil
function GetCurrentNetwork()
	if #netSnapshots > 0 then
		return netSnapshots[#netSnapshots]
	end
	return nil
end

-- ============================================================
-- Periodic sampling thread
-- ============================================================

CreateThread(function()
	load()

	-- First sample is baseline (no delta), second onwards have rates
	recordNetwork()

	while true do
		Wait(NET_INTERVAL)
		recordNetwork()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		SaveJsonResourceFile(netFile, { snapshots = netSnapshots })
	end
end)
