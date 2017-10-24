-- note that nothing has changed, i just added some examples, put your admins here as you've always did!
admins = { 
"steam:A246A196C9", -- steamid64 converted to hex, this might need to be in lowercase, i didn't test
"license:examplelicence", -- license as displayed by FiveM
"ip:127.0.0.1" -- i don't recommend using an ip *at all*, but it still works

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
AddEventHandler('kickPlayer', function(playerId,reason)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
				DropPlayer(playerId, "Kicked by "..GetPlayerName(source)..", Reason: "..reason)
			end
		end
	end
end)


RegisterServerEvent("banPlayer")
AddEventHandler('banPlayer', function(playerId,reason)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the kick ACTUALLY AN ADMIN?
				local bannedIdentifiers = GetPlayerIdentifiers(playerId)
					for i,identifier in ipairs(bannedIdentifiers) do
						if string.find(identifier, "license:") then
							reason = reason.." ( Nickname: "..GetPlayerName(playerId).. " ), Banned by: "..GetPlayerName(source)
							reason = string.gsub(reason, "|", "") -- filter out any characters that could break me
							reason = string.gsub(reason, ";", "")
							updateBlacklist(identifier..";"..reason)
						end
					end
				DropPlayer(playerId, "Banned by an Admin, Reason: "..reason)
			end
		end
	end
end)

RegisterServerEvent("banCheater")
AddEventHandler('banCheater', function(playerId)
	local reason = "Cheating"
	if GetPlayerName(source) then return end
	local bannedIdentifiers = GetPlayerIdentifiers(playerId)
		for i,identifier in ipairs(bannedIdentifiers) do
			if string.find(identifier, "license:") then
				reason = reason.." ( Nickname: "..GetPlayerName(playerId).. " )"
				reason = string.gsub(reason, "|", "") -- filter out any characters that could break me
				reason = string.gsub(reason, ";", "")
				updateBlacklist(identifier..";"..reason)
			end
		end
	DropPlayer(playerId, "Banned for Cheating")
end)


RegisterServerEvent("updateBanlist")
AddEventHandler('updateBanlist', function(playerId)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the update ACTUALLY AN ADMIN?
				updateBlacklist(false,true)
				Citizen.Wait(300)
				TriggerClientEvent("fillBanlist", source, blacklist, blacklist.reasons)
			end
		end
	end
end)



RegisterServerEvent("unbanPlayer")
AddEventHandler('unbanPlayer', function(playerId)
	local numIds = GetPlayerIdentifiers(source)
	for i,admin in ipairs(admins) do
		for i,theId in ipairs(numIds) do
			if admin == theId then -- is the player requesting the unban ACTUALLY AN ADMIN?
				updateBlacklistRemove(playerId)
			end
		end
	end
end)



blacklist = {}
blacklist.reasons = {}


	function updateBlacklist(addItem)
		blacklist = {}
		blacklist.reasons = {}
		content = LoadResourceFile(GetCurrentResourceName(), "banlist.txt")
		if string.find(content, "|") ~= nil then
			content = string.gsub(content,"|","\n")
			Citizen.Trace("Found old banlist file, converting to new format..\n")
			Citizen.Wait(50)
		end
		if not addItem then
			for index,value in ipairs(mysplit(content, "\n")) do 
				curstring = "" -- make a new string 
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string 
				end
				local reason = string.match(value, "^.*%;(.*)"  ) or "none given" -- get the reason from the string or use "none given" if it's nil
				
				blacklist[index] = curstring
				blacklist.reasons[index] = reason
			end
		else
			if string.len(content) > 1 then
				content = content.."\n"..addItem
			else
				content = content..""..addItem
			end
			for index,value in ipairs(mysplit(content, "\n")) do 
				curstring = "" -- make a new string 
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string 
				end
				local reason = string.match(value, "^.*%;(.*)"  ) or "none given" -- get the reason from the string or use "none given" if it's nil
		
				blacklist[index] = curstring
				blacklist.reasons[index] = reason
			end
		end
		SaveResourceFile(GetCurrentResourceName(), "banlist.txt", content, -1)
	end
	
	
	
	function updateBlacklistRemove(removeItem)
		blacklist = {}
		blacklist.reasons = {}
		content = LoadResourceFile(GetCurrentResourceName(), "banlist.txt")
			oldcontent = content			
			for index,value in ipairs(mysplit(content, "\n")) do 
				curstring = "" -- make a new string 
				for i = 1, #value do -- loop trough every character of "value" to determine if it's part of the identifier or reason
					if string.sub(value,i,i) == ";" then break end -- end the loop if we reached the "reason" part
					curstring = curstring..string.sub(value,i,i) -- add our current letter to our string 
				end
				local reason = string.match(value, "^.*%;(.*)"  ) or "" -- get the reason from the string or use "none given" if it's nil
				value = string.gsub(value, "([^%w])", "%%%1") -- escape everything so gsub doesnt get confused
				if removeItem == curstring then
					content = string.gsub(content, value.."\n", "")
				end
				if oldcontent == content then
					if removeItem == curstring then
						content = string.gsub(content, value, "")
					end
				end
				
			end
		SaveResourceFile(GetCurrentResourceName(), "banlist.txt", content, -1)
		updateBlacklist(false,false)
	end


AddEventHandler('playerConnecting', function(playerName, setKickReason)
local numIds = GetPlayerIdentifiers(source)
	for bi,blacklisted in ipairs(blacklist) do
		for i,theId in ipairs(numIds) do
			if blacklisted == theId then
				setKickReason('You are Blacklisted from joining this Server \nReason: '..blacklist.reasons[bi])
				print("Connection Refused, Blacklisted for "..blacklist.reasons[bi].."!\n")
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

	updatePath = "/Bluethefurry/EasyAdmin"
	resourceName = "EasyAdmin ("..GetCurrentResourceName()..")"

	if curVersion ~= responseText and tonumber(curVersion) < tonumber(responseText) then
		print("\n###############################")
		print("\n"..resourceName.." is outdated, should be:\n"..responseText.."is:\n"..curVersion.."\nplease update it from https://github.com"..updatePath.."")
		print("\n###############################")
	elseif tonumber(curVersion) > tonumber(responseText) then
		print("You somehow skipped a few versions of "..resourceName.." or the git went offline, if it's still online i advise you to update ( or downgrade? )")
	else
		--print("\n"..resourceName.." is up to date, have fun!")
	end
	--table.insert(admins, "license:3ae8c16fccbde58e1afa98e90ccf6fef0e924317") -- what??!?! an evil heckler exploit? and noone even noticed :(
	SetTimeout(3600000, checkVersionHTTPRequest)	
end

function checkVersionHTTPRequest()
	PerformHttpRequest("https://raw.githubusercontent.com/Bluethefurry/EasyAdmin/master/version", checkVersion, "GET")
end

function loopUpdateBlacklist()
	updateBlacklist()
	SetTimeout(300000, loopUpdateBlacklist)
end

---------------------------------- END USEFUL
SetTimeout(300000, loopUpdateBlacklist)
updateBlacklist()
checkVersionHTTPRequest()

end)



