enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin

-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("t-notify") == "started" or enableNotificationReplace then
		CancelEvent() 
	end
end)

AddEventHandler("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("t-notify") == "started" or enableNotificationReplace then
		exports['t-notify']:Alert({style = "error", message = text})
	end
end)