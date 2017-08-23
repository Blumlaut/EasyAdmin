admins = {
"license:3ae8c16fccbde58e1afa98e90ccf6fef0e924317",
}

RegisterServerEvent('amiadmin')
AddEventHandler('amiadmin', function()
	local numIds = GetNumPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i = 0, numIds-1 do
			if admin == GetPlayerIdentifier(source,i) then -- is the player an admin?
				TriggerClientEvent("adminresponse", source, true)
			end
		end
	end
end)

RegisterServerEvent("kickPlayer")
AddEventHandler('kickPlayer', function(playerId)
	local numIds = GetNumPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i = 0, numIds-1 do
			if admin == GetPlayerIdentifier(source,i) then -- is the player requesting the kick ACTUALLY AN ADMIN?
				DropPlayer(playerId, "Kicked by an Admin")
			end
		end
	end
end)


RegisterServerEvent("banPlayer")
AddEventHandler('banPlayer', function(playerId)
	local numIds = GetNumPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i = 0, numIds-1 do
			if admin == GetPlayerIdentifier(source,i) then -- is the player requesting the kick ACTUALLY AN ADMIN?
				local bannedIdentifiers = GetNumPlayerIdentifiers(playerId)
					for i = 0, bannedIdentifiers-1 do
						if not string.find(GetPlayerIdentifier(playerId,i), "ip:") then
							updateBlacklist(GetPlayerIdentifier(playerId,i))
						end
					end
				DropPlayer(playerId, "Banned by an Admin")
			end
		end
	end
end)


RegisterServerEvent("updateBanlist")
AddEventHandler('updateBanlist', function(playerId)
	local numIds = GetNumPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i = 0, numIds-1 do
			if admin == GetPlayerIdentifier(source,i) then -- is the player requesting the kick ACTUALLY AN ADMIN?
				updateBlacklist()
			end
		end
	end
end)



blacklist = {}


Citizen.CreateThread(function()
	function updateBlacklist(addItem)
		blacklist = {}
		content = LoadResourceFile("EasyAdmin", "banlist.txt")
		if not addItem then
			for index,value in ipairs(mysplit(content, "|")) do 
				blacklist[index] = value
			end
		else
			if string.len(content) > 1 then
				content = content.."|"..addItem
			else
				content = content..""..addItem
			end
			for index,value in ipairs(mysplit(content, "|")) do 
				blacklist[index] = value
			end
		end
		SaveResourceFile("EasyAdmin", "banlist.txt", content, -1)
	end
	updateBlacklist()
end)


AddEventHandler('playerConnecting', function(playerName, setKickReason)
local numIds = GetNumPlayerIdentifiers(source)
	for i,blacklisted in ipairs(blacklist) do
		for i = 0, numIds-1 do
			if blacklisted == GetPlayerIdentifier(source,i) then
				setKickReason('You are Blacklisted from joining this Server.')
				print("Connection Refused, Blacklisted!\n")
				CancelEvent()
				return
			end
		end
	end
end)



---------------------------------- USEFUL


function mysplit(inputstr, sep)
	if sep == nil then
		sep = "%s"
	end
	local t={} ; i=1
	for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
		t[i] = str
		i = i + 1
	end
	return t
end