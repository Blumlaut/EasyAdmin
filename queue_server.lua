

useQueue = false
queuedUsers = { }
currentPlayers = #GetPlayers() -- get our current player count, in case it gets restarted
maxTries = 120 -- defines how often we try / stay in the queue before disconnecting
maxPlayers = GetConvarInt("sv_maxclients", 30) -- get our maximum playercount

if useQueue then

	Citizen.CreateThread(function()
		AddEventHandler('playerConnecting', function(name, setCallback, deferrals)

			local numIds = GetPlayerIdentifiers(source)
			deferrals.defer()
			deferrals.update("Checking for a Free Slot...")
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
						deferrals.done('You are Blacklisted from joining this Server \nReason: '..blacklist.reasons[bi])
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
				Wait(1000)
				foundme = false
				maxPlayers = GetConvarInt("sv_maxclients", 30)
				greenlight = false
				for i,theKey in ipairs(queuedUsers) do
					if theKey.name	== n then
						foundme = true
						if currentPlayers >= maxPlayers then
							if queuedUsers[i].tries == maxTries then
								deferrals.done("This Server is Full, please try again later!")
								table.remove(queuedUsers,i)
								break
							end
							deferrals.update("Server Full, Your Position in Queue: "..i..", Disconnecting in "..maxTries-queuedUsers[i].tries.." tries.")
							queuedUsers[i].tries = queuedUsers[i].tries+1
						else
							deferrals.update("Your Position in Queue: "..i)
							if i == 1 and currentPlayers < maxPlayers then
								table.remove(queuedUsers,i)
								deferrals.done()
								currentPlayers = currentPlayers+1
								break
							end
						end
					end
				end
				if not foundme then
					deferrals.done("You lost your position in the Queue, please try reconnecting")
					break
				end
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
			if not caught then
				currentPlayers = currentPlayers-1
			end
		end)
	end)
end
