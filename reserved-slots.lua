whitelisted = {
"license:here",
}

------- SETTINGS START -------
useReservedSlots = false -- do we even want reserved slots?
reservedSlots = 2 -- how many do we want?
maxSlots = GetConvarInt("sv_maxclients") -- no touchy
maxSlots = tonumber(maxSlots)

------- SETTINGS STOP -------

-- RESERVED SLOTS
if useReservedSlots then
SetConvar("sv_maxclients", maxSlots-reservedSlots) -- no touchy either

AddEventHandler('playerConnecting', function(playerName, setKickReason)
	local numIds = GetPlayerIdentifiers(source)
	if #GetPlayers() >= 30 then
		kickme = true
	else
		kickme = false
	end

	for i,user in ipairs(whitelisted) do
		for i,theId in ipairs(numIds) do
			if user == theId and tonumber(#GetPlayers()) < maxSlots then
				kickme = false
				SetConvar("sv_maxclients", GetConvar("sv_maxclients")+1)
			end
		end
	end

	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId and tonumber(#GetPlayers()) < maxSlots then -- is the player an admin and do we have free slots?
				kickme = false
				SetConvar("sv_maxclients", GetConvar("sv_maxclients")+1)
			end
		end
	end

	if kickme and tonumber(#GetPlayers()) >= 30 then
		setKickReason('This server is full (past ' .. tostring(GetConvar("sv_maxclients")) .. ' players).')
		print("Connection Refused, Slot Reserved/Server Full!\n")
		CancelEvent()
		return
	end
end)


AddEventHandler('playerDropped', function()
  if tonumber(#GetPlayers()) > 30 and GetConvarInt("sv_maxclients") >= 31 then
		SetConvar("sv_maxclients", GetConvar("sv_maxclients")-1)
  end
end)

end
