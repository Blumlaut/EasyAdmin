

useQueue = GetConvar("ea_useQueue", "false")
queuedUsers = { }
users = { }
playerCount = #GetPlayers() -- get our current player count, in case it gets restarted
maxTries = GetConvarInt("ea_QueueTries", 360) -- defines how often we try / stay in the queue before disconnecting
maxPlayers = GetConvarInt("sv_maxclients", 30) -- get our maximum playercount

if useQueue == "true" then
		RegisterServerEvent('EasyAdmin:playerActivated')
		AddEventHandler('EasyAdmin:playerActivated', function() -- stole this from hardcap so we can handle the "hardcap" ourselves
		  if not users[source] then
			playerCount = playerCount + 1
			users[source] = true
		  end
		end)
		AddEventHandler('playerDropped', function() -- stole this from hardcap so we can handle the "hardcap" ourselves
		  if users[source] then
			playerCount = playerCount - 1
			users[source] = nil
		  end
		end)
		StopResource("hardcap") -- stop hardcap, we will handle it from here

	Citizen.CreateThread(function()
		AddEventHandler('playerConnecting', function(name, setCallback, deferrals)

			local numIds = GetPlayerIdentifiers(source)
			deferrals.defer()
			deferrals.update(strings.checkforslot)
			local s = source
			local n = name
			local greenlight = false
			local deferrals = deferrals
			local isAdmin = false
			local isBanned = false
			Wait(100)

			for bi,blacklisted in ipairs(blacklist) do
				for i,theId in ipairs(numIds) do
					if blacklisted == theId then -- make sure Queue isn't used as otherwise they will conflict
						deferrals.done(string.format( strings.bannedjoin, blacklist.reasons[bi] ))
						print("Connection Refused, Blacklisted for "..blacklist.reasons[bi].."!\n")
						isBanned = true
						return
					end
				end
			end

			for i,admin in ipairs(admins) do
				for i,theId in ipairs(numIds) do
					if admin == theId then -- is the player an admin and do we have free slots?
						isAdmin = true
					end
				end
			end

			if isBanned then
				return
			end

			if isAdmin then -- if our player is an admin, move him to the front of the queue.
				table.insert(queuedUsers, 1, {name = name, tries = 0})
			else -- otherwise, TO THE BACK WITH YOU, PEASANT
				table.insert(queuedUsers, {name = name, tries = 0})
			end

			local foundme = false

			while true do
				foundme = false
				maxPlayers = GetConvarInt("sv_maxclients", 30)
				greenlight = false
				for i,theKey in ipairs(queuedUsers) do
					if theKey.name	== n then
						foundme = true
						if playerCount >= maxPlayers then
							if queuedUsers[i].tries == maxTries then
								deferrals.done(strings.serverfulldenied)
								table.remove(queuedUsers,i)
								break
							end
							deferrals.update(string.format(strings.serverfulltrying, i, maxTries-queuedUsers[i].tries ))
							queuedUsers[i].tries = queuedUsers[i].tries+1
						else
							deferrals.update(string.format(strings.posinqueue, i))
							if i == 1 and playerCount < maxPlayers then
								table.remove(queuedUsers,i)
								deferrals.done()
								break
							end
						end
					end
				end
				if not foundme then
					deferrals.done(strings.lostqueuepos)
					break
				end
				Wait(1000)
			end

		end)
	end)


	Citizen.CreateThread(function()
		AddEventHandler('playerDropped', function(reason)
			local s = source
			local n = GetPlayerName(source)
			local caught = false
			for i,theKey in ipairs(queuedUsers) do
				if theKey.name == n then
					table.remove(queuedUsers,i)
					caught = true
				end
			end
		end)
	end)
end
