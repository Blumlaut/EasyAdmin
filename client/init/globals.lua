------------------------------------
-- EasyAdmin Client: globals + startup
-- Core state flags and RedM detection
------------------------------------

-- Core globals (used throughout client code)
isAdmin = false
RedM = false
infinity = false

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
