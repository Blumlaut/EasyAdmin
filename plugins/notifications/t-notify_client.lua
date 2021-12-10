
-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("t-notify") == "started" then
		CancelEvent() 
	end
end)

AddEventHandler("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("t-notify") == "started" then
		exports['t-notify']:Alert({style = "error", message = text})
	end
end)