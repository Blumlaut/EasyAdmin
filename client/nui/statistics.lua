------------------------------------
-- EasyAdmin NUI: statistics
-- Forwards NUI requests to server events.
-- Results are pushed back via SendNUIMessage (see events.lua).
------------------------------------

RegisterNUICallback('requestStatsSummary', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestStatsSummary', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestDailyPeaks', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestDailyPeaks', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestPlayerRegistry', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestPlayerRegistry', data and data.filterDays)
	cb({ ok = true })
end)

---Server-side paginated player registry request.
---NUI sends { page, pageSize, query, sortBy, filterDays }, result is pushed via 'playerRegistryPage' NUI event.
RegisterNUICallback('requestPlayerRegistryPage', function(data, cb)
	local page = tonumber(data and data.page) or 1
	local pageSize = tonumber(data and data.pageSize) or 20
	local query = (data and data.query) and tostring(data.query) or nil
	local sortBy = (data and data.sortBy) and tostring(data.sortBy) or 'lastSeen'
	local filterDays = tonumber(data and data.filterDays) or nil
	TriggerServerEvent('EasyAdmin:requestPlayerRegistryPage', {
		page = page,
		pageSize = pageSize,
		query = query,
		sortBy = sortBy,
		filterDays = filterDays,
	})
	-- Result arrives asynchronously via the 'playerRegistryPage' NUI event (see events.lua).
	cb({ ok = true })
end)
