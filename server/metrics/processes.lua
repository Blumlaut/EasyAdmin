------------------------------------
-- EasyAdmin: Process metrics
-- Lists running processes with CPU/memory usage on both Windows and Linux.
-- Stores the latest snapshot (not historical — too much data).
------------------------------------

-- ============================================================
-- Configuration
-- ============================================================

-- Sampling interval: 2 minutes
local PROC_INTERVAL = 120000
-- Max processes to store (avoid excessive JSON sizes)
local MAX_PROCESSES = 200

-- File path
local procFile = 'data/metrics/processes.json'

-- ============================================================
-- In-memory state
-- ============================================================

-- Latest process snapshot: { timestamp, os, processes: [{ name, pid, cpuPercent, memoryMB }] }
local latestProcesses = {}

-- ============================================================
-- Linux process sampling
-- ============================================================

---Parse ps output for process list on Linux.
---@return table array of process info
local function sampleLinuxProcesses()
	-- ps aux --sort=-%mem gives top processes by memory
	local output = execCommand(string.format('ps aux --sort=-%%mem 2>/dev/null | head -n %d', MAX_PROCESSES + 1))
	if not output then return {} end

	local processes = {}
	local count = 0

	for line in output:gmatch('[^\r\n]+') do
		-- Skip header
		if line:find('USER') and line:find('COMMAND') then goto continue end

		-- ps aux format: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
		local user, pid, cpu, mem, vsz, rss, tty, stat, start, time, command = line:match(
			'^%s*(%S+)%s+(%d+)%s+(%d+%.?%d*)%s+(%d+%.?%d*)%s+(%d+)%s+(%d+)%s+(%S+)%s+(%S+)%s+(%S+)%s+(%S+)%s+(.+)$'
		)

		if pid and command then
			-- RSS is in KB, convert to MB
			local memoryMB = math.floor(tonumber(rss) / 1024)

			-- Extract just the command name (not full path + args)
			local cmdName = command:match('^[^/]*')  -- before first /
			if not cmdName or cmdName == '' then
				cmdName = command:match('([^/]+)$')   -- last path component
			end
			-- Truncate long command names
			if cmdName and #cmdName > 64 then
				cmdName = cmdName:sub(1, 61) .. '...'
			end

			table.insert(processes, {
				name       = cmdName or 'unknown',
				pid        = tonumber(pid),
				cpuPercent = tonumber(cpu) or 0,
				memoryMB   = memoryMB,
				user       = user,
				state      = stat,
			})

			count = count + 1
			if count >= MAX_PROCESSES then break end
		end
		::continue::
	end

	return processes
end

-- ============================================================
-- Windows process sampling
-- ============================================================

---Parse wmic output for process list on Windows.
---@return table array of process info
local function sampleWindowsProcesses()
	-- Get top processes by memory usage
	local output = execCommand(string.format(
		'wmic process where "WorkingSetSize > 0" get Name,ProcessId,WorkingSetSize,PercentProcessorTime /format:list | powershell -Command "Select-Object -First %d"',
		MAX_PROCESSES * 4 -- each process has 4 properties
	))
	if not output then return {} end

	local processes = {}
	local current = {}
	local count = 0

	for line in output:gmatch('[^\r\n]+') do
		local key, value = line:match('^(%w+)=(.*)')
		if key and value then
			value = value:gsub('%s+$', '')
			if key == 'Name' then
				if current.Name then
					table.insert(processes, current)
					count = count + 1
					if count >= MAX_PROCESSES then break end
				end
				current = { Name = value }
			elseif key == 'ProcessId' then
				current.ProcessId = tonumber(value) or 0
			elseif key == 'WorkingSetSize' then
				current.WorkingSetSize = tonumber(value) or 0
			elseif key == 'PercentProcessorTime' then
				current.PercentProcessorTime = tonumber(value) or 0
			end
		end
	end

	-- Don't forget the last entry
	if current.Name then
		table.insert(processes, current)
	end

	-- Normalize to common format
	local results = {}
	for _, p in ipairs(processes) do
		if p.Name and p.ProcessId then
			table.insert(results, {
				name       = p.Name,
				pid        = p.ProcessId,
				cpuPercent = p.PercentProcessorTime,
				memoryMB   = math.floor((p.WorkingSetSize or 0) / (1024 * 1024)),
			})
		end
	end

	return results
end

-- ============================================================
-- Sampling
-- ============================================================

local function recordProcesses()
	local now = os.time()

	local processes
	if IsLinux() then
		processes = sampleLinuxProcesses()
	else
		processes = sampleWindowsProcesses()
	end

	if not processes then return end

	latestProcesses = {
		timestamp = now,
		os        = GetServerOS(),
		processes = processes,
	}

	SaveJsonResourceFile(procFile, latestProcesses)
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(procFile, {})
	latestProcesses = data or {}
end

-- ============================================================
-- Public API
-- ============================================================

---Get the latest process snapshot
---@return table
function GetLatestProcesses()
	return latestProcesses
end

---Get processes filtered by name (case-insensitive)
---@param query string search query
---@return table
function GetProcessesByName(query)
	if not query or query == '' then
		return latestProcesses.processes or {}
	end

	local q = query:lower()
	local results = {}
	for _, p in ipairs(latestProcesses.processes or {}) do
		if p.name:lower():find(q, 1, true) then
			table.insert(results, p)
		end
	end
	return results
end

-- ============================================================
-- Periodic sampling thread
-- ============================================================

CreateThread(function()
	load()

	-- Record initial snapshot
	recordProcesses()

	while true do
		Wait(PROC_INTERVAL)
		recordProcesses()
	end
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		SaveJsonResourceFile(procFile, latestProcesses)
	end
end)
