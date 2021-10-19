enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin


local PnOptions = {style = "error"} -- define our t-notify options


-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("t-notify") == "started" or enableNotificationReplace then
		CancelEvent() 
	end
end)

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("t-notify") == "started" or enableNotificationReplace then
		local options = PnOptions
		options.message = text
		exports['t-notify']:Alert({options})
	end
end)