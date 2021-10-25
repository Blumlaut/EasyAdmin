enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin

if GetResourceState("mythic-notify") == "started" or enableNotificationReplace then

	-- this bit of code tells EasyAdmin to not draw the V Notification.
	AddEventHandler("EasyAdmin:receivedNotification", function()
		CancelEvent() 
	end)

	RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
		exports['mythic_notify']:SendAlert('inform', text)
	end)
end
