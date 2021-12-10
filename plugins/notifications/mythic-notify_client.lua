
-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("mythic-notify") == "started" then
		CancelEvent() 
	end
end)

AddEventHandler("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("mythic-notify") == "started" then
		exports['mythic_notify']:DoHudText('inform', text)
	end
end)