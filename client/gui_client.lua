------------------------------------
-- EasyAdmin Client: GUI globals, commands, startup
-- Replaces the non-NativeUI portions of the old gui_c.lua
------------------------------------

-- Core globals (were in gui_c.lua, used throughout client code)
isAdmin = false
showLicenses = false
RedM = false

settings = {
	button = "none",
	forceShowGUIButtons = false,
}

-- ea command alias — forwards to easyadmin with arguments
RegisterCommand('ea', function(_source, args)
	ExecuteCommand('easyadmin ' .. table.concat(args, " "))
end, false)

-- Startup thread: RedM detection, key mapping, TTS initialization
Citizen.CreateThread(function()
	-- Detect RedM via native existence check
	if CompendiumHorseObserved then
		RedM = true
		settings.button = "PhotoModePc"
	end

	-- Register keyboard shortcut mapping (FiveM only — RedM lacks RegisterKeyMapping)
	if not RedM then
		RegisterKeyMapping('easyadmin', 'Open EasyAdmin', 'keyboard', '')
	end

	-- Initialize TTS state from KVP if previously enabled
	if not GetResourceKvpInt('ea_tts') then
		SetResourceKvpInt('ea_tts', 0)
		SetResourceKvpInt('ea_ttsspeed', 4)
	else
		if GetResourceKvpInt('ea_ttsspeed') == 0 then
			SetResourceKvpInt('ea_ttsspeed', 4)
		end
		if GetResourceKvpInt('ea_tts') == 1 then
			SendNUIMessage({
				action = 'toggle_speak',
				enabled = true,
				rate = GetResourceKvpInt('ea_ttsspeed') or 4
			})
		end
	end
end)
