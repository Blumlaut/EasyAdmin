reservedSlots = 2
maxSlots = GetConvar("sv_maxclients")

Citizen.CreateThread(function()
	AddEventHandler('playerConnecting', function(playerName, setKickReason)
		local numIds = GetPlayerIdentifiers(source)
		if #GetPlayers() >= maxSlots-reservedSlots then
			kickme = true
		else
			kickme = false
		end
		for i,admin in ipairs(admins) do
			for i,theId in ipairs(numIds) do
				if admin == theId then -- is the player an admin?
					kickme = false
				end
			end
		end
		
		if kickme then
			setKickReason('This slot is reserved for an Administrator, sorry!.')
			print("Connection Refused, Slot Reserved!\n")
			CancelEvent()
			return
		end
	end)
end)
