-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetConvar("ea_enableNotificationReplace", 'none') ~= 'none' then
		CancelEvent() 
	end
end)

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	if GetConvar("ea_enableNotificationReplace", 'none') == 'pNotify' then
		exports['pNotify']:SendNotification({layout = "centerLeft", type = "alert", text = text})
	elseif GetConvar("ea_enableNotificationReplace", 'none') == 't-notify' then
		exports['t-notify']:Alert({style = "error", message = text})
	elseif GetConvar("ea_enableNotificationReplace", 'none') == 'mythic-notify' then
		exports['mythic_notify']:SendAlert('inform', text)
	end
end)