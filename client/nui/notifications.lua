------------------------------------
-- EasyAdmin NUI: Notifications
-- Bridge between NUI frontend and native FiveM feed notifications
------------------------------------

RegisterNUICallback('showNotification', function(data, cb)
	TriggerEvent("EasyAdmin:showNotification", data and data.text or "")
	cb({ ok = true })
end)
