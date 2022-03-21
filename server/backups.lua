------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
----
----
---- If you are a developer and want to change something, consider writing a plugin instead:
---- https://easyadmin.readthedocs.io/en/latest/plugins/
----
------------------------------------
------------------------------------

Citizen.CreateThread(function()
	backupInfos = LoadResourceFile(GetCurrentResourceName(), "backups/_backups.json")
	
	while true do 
		repeat
			Wait(5000)
		until blacklist
		if backupInfos == nil then 
			lastBackupTime = 0
		else
			backupData = json.decode(backupInfos)
			lastBackupTime = backupData.lastBackup
		end
		if (GetConvarInt("ea_backupFrequency", 72) ~= 0) and (lastBackupTime+(GetConvarInt("ea_backupFrequency", 72)*3600) < os.time()) then
			createBackup()
		end
		Wait(120000)
	end
end)


function loadBackupName(name)
	local backup = LoadResourceFile(GetCurrentResourceName(), "backups/"..name)
	if backup then
		local backupJson = json.decode(backup)
		if backupJson then
			PrintDebugMessage("Loading Backup..")
			for i,ban in pairs(blacklist) do
				UnbanId(ban.banid)
				PrintDebugMessage("removing ban "..ban.banid, 4)
				Wait(50)
			end
			
			for i,ban in pairs(backupJson) do
				addBan(ban)
				PrintDebugMessage("adding ban "..ban.banid, 4)
				TriggerEvent("ea_data:addBan", ban)
				Wait(50)
			end
			local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
			if not saved then
				PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
			end
			updateBlacklist()
			PrintDebugMessage("Backup should be loaded!")
		else
			PrintDebugMessage("^1EasyAdmin:^7 Backup Could not be loaded, in most cases this comes from there being a formatting error, please use a JSON Validator on the file and fix the errors!")
		end
		
	else
		PrintDebugMessage("^1EasyAdmin:^7 Backup Name Invalid or missing from Backups.")
	end
end


function createBackup()
	local backupTime = os.time()
	local backupDate = os.date("%H_%M_%d_%m_%Y")
	local backupName = "banlist_"..backupDate..".json"
	local resourceName = GetCurrentResourceName()
	PrintDebugMessage("Creating Banlist Backup to "..backupName, 3)
	
	local saved = SaveResourceFile(resourceName, "backups/"..backupName, json.encode(blacklist, {indent = true}), -1)
	
	if not saved then
		PrintDebugMessage("^1Saving banlist backup failed! Please check if EasyAdmin has Permission to write in the backups folder!^7", 1)
	end
	
	backupInfos = LoadResourceFile(resourceName, "backups/_backups.json")
	if backupInfos then
		backupData = json.decode(backupInfos)
		table.insert(backupData.backups, {id = getNewBackupid(backupData), backupFile = backupName, backupTimestamp = backupTime, backupDate = backupDate})
		
		
		if #backupData.backups > GetConvarInt("ea_maxBackupCount", 10) then
			deleteBackup(backupData,1)
		end
		backupData.lastBackup = backupTime
		SaveResourceFile(resourceName, "backups/_backups.json", json.encode(backupData, {indent = true}))
		
	else
		local backupData = {lastBackup = backupTime, backups = {}}
		table.insert(backupData.backups, {id = getNewBackupid(backupData), backupFile = backupName, backupTimestamp = backupTime, backupDate = backupDate})
		SaveResourceFile(resourceName, "backups/_backups.json", json.encode(backupData, {indent = true}))
	end
	
	return id,timestamp
end

function deleteBackup(backupData,id)
	local expiredBackup = backupData.backups[id]
	table.remove(backupData.backups, id)
	
	local backupFileName = expiredBackup.backupFile
	
	local fullResourcePath = GetResourcePath(GetCurrentResourceName())
	os.remove(fullResourcePath.."/backups/"..backupFileName)
	PrintDebugMessage("Removed Backup "..backupFileName, 3)
	
end

function getNewBackupid(backupData)
	if backupData then
		local lastBackup = backupData.lastbackup
		local backups = backupData.backups
		return #backups+1
	else
		return 0
	end
end

RegisterCommand("ea_createBackup", function(source, args, rawCommand)
	if DoesPlayerHavePermission(source, "server") then
		createBackup()
	end
end, false)

RegisterCommand("ea_loadBackup", function(source,args,rawCommand)
	if DoesPlayerHavePermission(source, "server") and args[1] then
		loadBackupName(args[1])
	end
end,false)