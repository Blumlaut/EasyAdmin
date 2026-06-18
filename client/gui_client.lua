------------------------------------
-- EasyAdmin Client: GUI globals, commands, startup
-- Replaces the non-NativeUI portions of the old gui_c.lua
------------------------------------

-- Core globals (were in gui_c.lua, used throughout client code)
isAdmin = false
showLicenses = false
RedM = false
infinity = false

-- ea command alias — forwards to easyadmin with arguments
RegisterCommand('ea', function(_source, args)
	ExecuteCommand('easyadmin ' .. table.concat(args, " "))
end, false)

-- Startup thread: RedM detection, key mapping
Citizen.CreateThread(function()
	-- Detect RedM via native existence check
	if CompendiumHorseObserved then
		RedM = true
	end

	-- Register keyboard shortcut mapping (FiveM only — RedM lacks RegisterKeyMapping)
	if not RedM then
		RegisterKeyMapping('easyadmin', 'Open EasyAdmin', 'keyboard', '')
	end
end)
