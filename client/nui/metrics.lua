------------------------------------
-- EasyAdmin NUI: metrics
-- Forwards NUI requests to server events for system metrics.
-- Results are pushed back via SendNUIMessage (see events.lua).
------------------------------------

RegisterNUICallback('requestOSInfo', function(_data, cb)
	TriggerServerEvent('EasyAdmin:requestOSInfo')
	cb({ ok = true })
end)

RegisterNUICallback('requestCPUHistory', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestCPUHistory', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestMemoryHistory', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestMemoryHistory', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestDiskHistory', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestDiskHistory', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestNetworkHistory', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestNetworkHistory', data and data.range)
	cb({ ok = true })
end)

RegisterNUICallback('requestProcesses', function(data, cb)
	TriggerServerEvent('EasyAdmin:requestProcesses', {
		query = (data and data.query) and tostring(data.query) or nil,
	})
	cb({ ok = true })
end)
