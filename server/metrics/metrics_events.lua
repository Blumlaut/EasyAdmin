------------------------------------
-- EasyAdmin: Metrics events
-- Wires NUI requests to the metrics modules (cpu, memory, disk, network, processes).
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
	else
		return now - 86400 -- default 24h
	end
end

-- ============================================================
-- OS info
-- ============================================================

RegisterServerEvent('EasyAdmin:requestOSInfo', function()
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	TriggerClientEvent('EasyAdmin:osInfoResult', src, {
		os = GetServerOS(),
	})
end)

-- ============================================================
-- CPU metrics
-- ============================================================

RegisterServerEvent('EasyAdmin:requestCPUHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetCPUSnapshotsAfter(cutoff)

	TriggerClientEvent('EasyAdmin:cpuHistoryResult', src, {
		snapshots = result,
		coreCount = GetCoreCount(),
	})
end)

-- ============================================================
-- Memory metrics
-- ============================================================

RegisterServerEvent('EasyAdmin:requestMemoryHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetMemorySnapshotsAfter(cutoff)

	TriggerClientEvent('EasyAdmin:memoryHistoryResult', src, {
		snapshots = result,
		current   = GetCurrentMemory(),
	})
end)

-- ============================================================
-- Disk metrics
-- ============================================================

RegisterServerEvent('EasyAdmin:requestDiskHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetDiskSnapshotsAfter(cutoff)

	TriggerClientEvent('EasyAdmin:diskHistoryResult', src, {
		snapshots = result,
		current   = GetCurrentDisk(),
	})
end)

-- ============================================================
-- Network metrics
-- ============================================================

RegisterServerEvent('EasyAdmin:requestNetworkHistory', function(range)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	local cutoff = rangeToCutoff(range)
	local result = GetNetworkSnapshotsAfter(cutoff)

	TriggerClientEvent('EasyAdmin:networkHistoryResult', src, {
		snapshots = result,
		current   = GetCurrentNetwork(),
	})
end)

-- ============================================================
-- Process list
-- ============================================================

RegisterServerEvent('EasyAdmin:requestProcesses', function(data)
	local src = source
	if not DoesPlayerHavePermission(src, 'server.metrics.view') then return end
	local query = (data and data.query) and tostring(data.query) or nil

	local processes
	if query then
		processes = GetProcessesByName(query)
	else
		processes = GetLatestProcesses()
	end

	TriggerClientEvent('EasyAdmin:processesResult', src, processes)
end)
