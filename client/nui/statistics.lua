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
