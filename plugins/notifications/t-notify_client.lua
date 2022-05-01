--
-- This is an example Plugin to pass EasyAdmin's Internal events to an External Resource as a Notification, the reader is expected to form their own functions from this, editing this code is *NOT* recommended,
-- as updates will overwrite it, instead, make your own plugin from this example (copying the file and renaming it is enough.)
-- the end result will look like this: https://blumlaut.me/s/H9pHGsXgjAFeHDP/preview
--
-- Feel free to make Pull Requests to add aditional features for this, this is merely an example of whats possible.
--

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