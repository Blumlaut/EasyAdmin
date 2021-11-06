enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin

-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("mythic-notify") == "started" or enableNotificationReplace then
		CancelEvent() 
	end
end)

AddEventHandler("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("mythic-notify") == "started" or enableNotificationReplace then
		exports['mythic_notify']:DoHudText('inform', text)
	end
end)