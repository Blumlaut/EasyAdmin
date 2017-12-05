Citizen.CreateThread(function()
	while true do
		Wait(0)
		if NetworkIsSessionStarted() then
			TriggerServerEvent('EasyAdmin:playerActivated') -- stole this from hardcap so we can handle the "hardcap" ourselves
			return
		end
	end
end)
