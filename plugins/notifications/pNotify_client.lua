--
-- This is an example Plugin to pass EasyAdmin's Internal events to an External Resource as a Notification, in our example pNotify, the reader is expected to form their own functions from this, editing this code is *NOT* recommended,
-- as updates will overwrite it, instead, make your own plugin from this example (copying the file and renaming it is enough.)
-- the end result will look like this: https://blumlaut.me/s/H9pHGsXgjAFeHDP/preview
--
-- Feel free to make Pull Requests to add aditional features for this, this is merely an example of whats possible.
--

enableNotificationReplace = false -- change to true to enable replacement of the default V Notification for EasyAdmin


local PnOptions = {layout = "centerLeft", type = "alert"} -- define our pNotify options


-- this bit of code tells EasyAdmin to not draw the V Notification.
AddEventHandler("EasyAdmin:receivedNotification", function()
	if GetResourceState("pNotify") == "started" or enableNotificationReplace then
		CancelEvent() 
	end
end)

RegisterNetEvent("EasyAdmin:showNotification", function(text, important)
	if GetResourceState("pNotify") == "started" or enableNotificationReplace then
		local options = PnOptions
		options.text = text
		exports.pNotify:SendNotification({options})
	end
end)