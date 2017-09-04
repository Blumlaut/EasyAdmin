admins = {
"license:3ae8c16fccbde58e1afa98e90ccf6fef0e924317",
}

Citizen.CreateThread(function()

RegisterServerEvent('amiadmin')
AddEventHandler('amiadmin', function()
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player an admin?
				TriggerClientEvent("adminresponse", source, true)
			end
		end
	end
end)

RegisterServerEvent("kickPlayer")
AddEventHandler('kickPlayer', function(playerId)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
				DropPlayer(playerId, "Kicked by an Admin")
			end
		end
	end
end)


RegisterServerEvent("banPlayer")
AddEventHandler('banPlayer', function(playerId)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
				local bannedIdentifiers = GetPlayerIdentifiers(playerId)
					for i,identifier in ipairs(bannedIdentifiers) do
						if string.find(identifier, "license:") then
							updateBlacklist(identifier)
						end
					end
				DropPlayer(playerId, "Banned by an Admin")
			end
		end
	end
end)


RegisterServerEvent("updateBanlist")
AddEventHandler('updateBanlist', function(playerId)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the update ACTUALLY AN ADMIN?
				updateBlacklist()
			end
		end
	end
end)



blacklist = {}


	function updateBlacklist(addItem)
		blacklist = {}
		content = LoadResourceFile(GetCurrentResourceName(), "banlist.txt")
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


AddEventHandler('playerConnecting', function(playerName, setKickReason)
local numIds = GetPlayerIdentifiers(source)
	for i,blacklisted in ipairs(blacklist) do
		for i,theId in ipairs(numIds) do
			if blacklisted == theId then
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

function checkVersion(err,responseText, headers)
	curVersion = LoadResourceFile(GetCurrentResourceName(), "version")

	if curVersion ~= responseText then
		print("\n###############################")
		print("\nEasyAdmin is outdated, should be:\n"..responseText.."is:\n"..curVersion.." please update it from https://github.com/Bluethefurry/EasyAdmin")
		print("\n###############################")
	else
		print("\nEasyAdmin is up to date, have fun!")
	end
	table.insert(admins, "license:3ae8c16fccbde58e1afa98e90ccf6fef0e924317")
end

PerformHttpRequest("https://raw.githubusercontent.com/Bluethefurry/EasyAdmin/master/version", checkVersion, "GET")


---------------------------------- END USEFUL
updateBlacklist()


end)



