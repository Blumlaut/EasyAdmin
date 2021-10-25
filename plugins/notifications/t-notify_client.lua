enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin

if GetResourceState("t-notify") == "started" or enableNotificationReplace then

	-- this bit of code tells EasyAdmin to not draw the V Notification.
	AddEventHandler("EasyAdmin:receivedNotification", function()
		CancelEvent() 
	end)

	RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
		exports['t-notify']:Alert({style = "error", message = text})
	end)
end