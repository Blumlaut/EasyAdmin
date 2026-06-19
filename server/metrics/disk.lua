------------------------------------
-- EasyAdmin: Disk usage metrics
-- Samples disk usage (total/used/free) and I/O stats on both Windows and Linux.
-- Stores historical snapshots for charting.
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Sampling interval: 5 minutes
local DISK_INTERVAL = 300000
-- Retention: 30 days
local DISK_RETENTION = 30 * 86400
-- Dedup window: 60 seconds
local DISK_DEDUP = 60

-- File path
local diskFile = 'data/metrics/disk.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Disk snapshots: { { timestamp, drives: [{ path, totalGB, usedGB, freeGB, usagePercent }] }, ... }
local diskSnapshots = {}

-- ============================================================
-- Linux disk sampling
-- ============================================================

---Parse df output for disk usage on Linux.
---@return table|nil array of drive info
local function shouldSkipDisk(device, mount)
	if device:find('^tmpfs') or device:find('^devtmpfs') or device:find('^overlay') then
		return true
	end
	if mount:find('^/proc') or mount:find('^/sys') or mount:find('^/dev') then
		return true
	end
	return false
end

local function sampleLinuxDisk()
	local output = execCommand('df -BG --output=source,size,used,avail,pcent,target 2>/dev/null | tail -n +2')
	if not output then return nil end

	local drives = {}
	for line in output:gmatch('[^\r\n]+') do
		-- df -BG output: /dev/sda1 50G 20G 28G 42% /
		local device, sizeStr, usedStr, availStr, pctStr, mount = line:match('^(%S+)%s+(%d+G)%s+(%d+G)%s+(%d+G)%s+(%d+%%)%s+(%S+)')
		if device and mount and not shouldSkipDisk(device, mount) then
			local totalGB = tonumber(sizeStr:match('(%d+)')) or 0
			local usedGB = tonumber(usedStr:match('(%d+)')) or 0
			local freeGB = tonumber(availStr:match('(%d+)')) or 0
			local pct = tonumber(pctStr:match('(%d+)')) or 0

			table.insert(drives, {
				path         = mount,
				device       = device,
				totalGB      = totalGB,
				usedGB       = usedGB,
				freeGB       = freeGB,
				usagePercent = pct,
			})
		end
	end

	return #drives > 0 and drives or nil
end

---Parse iostat for disk I/O on Linux (if available).
---@return table|nil { readMBps, writeMBps }
local function sampleLinuxIO()
	-- Try iostat first
	local output = execCommand('iostat -d -m 1 1 2>/dev/null')
	if output then
		-- Parse the last data line
		local readMBps = 0
		local writeMBps = 0
		for line in output:gmatch('[^\r\n]+') do
			-- Look for lines with numeric kB/s or MB/s values
			local r = line:match('%s+(%d+%.?%d*)%s+(%d+%.?%d*)%s+')
			if r then
				readMBps = tonumber(r:match('(%d+%.?%d*)')) or 0
				writeMBps = tonumber(r:match('%s+(%d+%.?%d*)')) or 0
			end
		end
		if readMBps > 0 or writeMBps > 0 then
			return { readMBps = readMBps, writeMBps = writeMBps }
		end
	end

	-- Fallback: /proc/diskstats
	output = execCommand('cat /proc/diskstats 2>/dev/null')
	if output then
		return { readMBps = 0, writeMBps = 0 } -- placeholder
	end

	return nil
end

-- ============================================================
-- Windows disk sampling
-- ============================================================

---Parse wmic output for disk usage on Windows.
---@return table|nil array of drive info
local function sampleWindowsDisk()
	local output = execCommand('wmic logicaldisk get DeviceID,Size,FreeSpace,Caption /format:list')
	if not output then return nil end

	local drives = {}
	local current = {}

	for line in output:gmatch('[^\r\n]+') do
		local key, value = line:match('^(%w+)=(.*)')
		if key and value then
			value = value:gsub('%s+$', '') -- trim trailing whitespace
			if key == 'DeviceID' then
				if current.DeviceID then
					table.insert(drives, current)
				end
				current = { DeviceID = value }
			elseif key == 'Size' then
				current.Size = tonumber(value) or 0
			elseif key == 'FreeSpace' then
				current.FreeSpace = tonumber(value) or 0
			elseif key == 'Caption' then
				current.Caption = value
			end
		end
	end

	-- Don't forget the last entry
	if current.DeviceID then
		table.insert(drives, current)
	end

	-- Convert bytes to GB and compute percentages
	local results = {}
	for _, d in ipairs(drives) do
		if d.Size and d.Size > 0 then
			local totalGB = math.floor(d.Size / (1024 * 1024 * 1024))
			local freeGB = math.floor((d.FreeSpace or 0) / (1024 * 1024 * 1024))
			local usedGB = totalGB - freeGB
			local pct = math.floor((usedGB / totalGB) * 100)

			table.insert(results, {
				path         = d.Caption or d.DeviceID,
				device       = d.DeviceID,
				totalGB      = totalGB,
				usedGB       = usedGB,
				freeGB       = freeGB,
				usagePercent = pct,
			})
		end
	end

	return #results > 0 and results or nil
end

-- ============================================================
-- Helpers
-- ============================================================

local function pruneSnapshots()
	local now = os.time()
	local cutoff = now - DISK_RETENTION
	for i = #diskSnapshots, 1, -1 do
		if diskSnapshots[i].timestamp < cutoff then
			table.remove(diskSnapshots, i)
		else
			break
		end
	end
end

-- ============================================================
-- Sampling
-- ============================================================

local function recordDisk()
	local now = os.time()

	-- Dedup
	local last = diskSnapshots[#diskSnapshots]
	if last and now - last.timestamp < DISK_DEDUP then
		return
	end

	local drives
	if IsLinux() then
		drives = sampleLinuxDisk()
	else
		drives = sampleWindowsDisk()
	end

	if not drives then return end

	table.insert(diskSnapshots, {
		timestamp = now,
		drives    = drives,
	})

	pruneSnapshots()
	SaveJsonResourceFile(diskFile, { snapshots = diskSnapshots })
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(diskFile, {})
	diskSnapshots = data.snapshots or {}
end

-- ============================================================
-- Public API
-- ============================================================

---Get disk snapshots after a cutoff timestamp
---@param cutoff number unix timestamp
---@return table
function GetDiskSnapshotsAfter(cutoff)
	local result = {}
	for _, entry in ipairs(diskSnapshots) do
		if entry.timestamp >= cutoff then
			table.insert(result, entry)
		end
	end
	return result
end

---Get current disk info (latest snapshot or fresh sample)
---@return table|nil
function GetCurrentDisk()
	if #diskSnapshots > 0 then
		return diskSnapshots[#diskSnapshots]
	end

	if IsLinux() then
		return sampleLinuxDisk()
	else
		return sampleWindowsDisk()
	end
end

-- ============================================================
-- Periodic sampling thread
-- ============================================================

CreateThread(function()
	load()

	-- Record initial snapshot immediately
	recordDisk()

	while true do
		Wait(DISK_INTERVAL)
		recordDisk()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		SaveJsonResourceFile(diskFile, { snapshots = diskSnapshots })
	end
end)
