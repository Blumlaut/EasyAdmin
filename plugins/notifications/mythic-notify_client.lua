enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin


local PnOptions = {type = "error"} -- define our pNotify options

-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("mytic-notify") == "started" or enableNotificationReplace then
		CancelEvent() 
	end
end)

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("mythic-notify") == "started" or enableNotificationReplace then
		local options = PnOptions
		options.message = text
		exports['mythic_notify']:SendAlert(options)
	end
end)