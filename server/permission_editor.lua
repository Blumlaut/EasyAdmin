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
	local add_aces = {}
	local add_principals = {}
	function readAcePermissions()
		Citizen.CreateThread(function()
			add_aces, add_principals, execs = FindInfosinFile("server.cfg")
			for i, config in pairs(execs) do
				local tempaces, tempprincipals, _ = FindInfosinFile(config)
				add_aces = mergeTables(add_aces, tempaces)
				add_principals = mergeTables(add_principals, tempprincipals)
			end
		end)
	end
	
	function FindInfosinFile(filename)
		local path = GetResourcePath(GetCurrentResourceName())
		local occurance = string.find(path, "/resources", 1, true)
		local path = string.reverse(string.sub(string.reverse(path), -occurance))
		
		local filename = filename
		
		local lines = {}
		local needsExec = true
		local needsResourcePerms = true
		
		if filename == "server.cfg" then 
			needsResourcePerms = false
		elseif filename == "easyadmin_permissions.cfg" then
			needsExec = false
		else
			needsResourcePerms, needsExec = false, false
		end
		local changes = false
		local aces, principals, execs = {}, {}, {}
		
		PrintDebugMessage("reading "..filename, 4)
		
		local file = io.open(filename, "r")
		if file then
			line = file:read("*line")
			while line do
				table.insert(lines,line)
				line = file:read("*line")
			end
			file:close()
			
			for i, line in pairs(lines) do 
				if filename == "server.cfg" then
					needsResourcePerms = false
					if string.find(line, "exec easyadmin_permissions.cfg", 1, true) then
						needsExec = false
					end
				elseif filename == "easyadmin_permissions.cfg" then
					needsExec = false
					if string.find(line, "add_ace resource."..GetCurrentResourceName().." command.add_ace allow", 1, true) then
						needsResourcePerms = false
					end
				else
					local broken = false
					-- remove broken lines
					if string.find(line, "exec easyadmin_permissions.cfg", 1, true) then
						RemoveFromFile(filename, "exec easyadmin_permissions.cfg")
					elseif string.find(line, "add_ace resource."..GetCurrentResourceName().." command.", 1, true) then
						RemoveFromFile(filename, line)
					end 
				end

				-- filteredLine variable converts tabs to spaces, and multiple spaces to single space
				local filteredLine = string.gsub(line, "%s+", " ")
				-- remove comments
				filteredLine = string.gsub(filteredLine, "%s*#.*$", "")
				


				-- strip the arguments from the "add_ace", "add_principal" and "exec" commands and insert them into their respective tables
				if string.find(filteredLine, "add_ace", 1, true) then
					local args = string.split(filteredLine, " ")
					if args[2] and args[3] and args[4] then
						table.insert(aces, {file = filename, oldline = line, args[2], args[3], args[4]})
					end
				elseif string.find(filteredLine, "add_principal", 1, true) then
					local args = string.split(filteredLine, " ")
					if args[2] and args[3] then
						table.insert(principals, {file = filename, oldline = line, args[2], args[3]})
					end
				elseif string.find(filteredLine, "exec", 1, true) then
					local args = string.split(filteredLine, " ")
					if args[2] then
						table.insert(execs, args[2])
					end
				end
			end
			
			if needsExec or needsResourcePerms or changes then
				local newLines = {}
				if needsExec then
					table.insert(newLines, "exec easyadmin_permissions.cfg")
					table.insert(execs, "easyadmin_permissions.cfg")
					PrintDebugMessage("Did not find `exec easyadmin_permissions.cfg`, added it automatically", 4)
					changes=true
				end
				if needsResourcePerms then
					table.insert(newLines, "# This file was generated automatically by EasyAdmin #")
					table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.add_ace allow")
					table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.remove_ace allow")
					table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.add_principal allow")
					table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.remove_principal allow")
					PrintDebugMessage("Did not find `add_ace resource."..GetCurrentResourceName().."` lines, added them automatically", 4)
					changes=true
				end
				local output = "\n"
				if changes then
					local file = io.open(filename, "a+") -- reopen in write mode
					for i, line in pairs(newLines) do
						output=output..line.."\n"
					end
					file:write(output) -- write our lines
					file:close()
				end
			end
			
			for i,ace in pairs(aces) do 
				PrintDebugMessage("parsed ace ^1"
				..tostring(ace[1]).." "
				..tostring(ace[2]).." "
				..tostring(ace[3]).."^7 in "
				..filename.."\n", 4)
			end
			
			for i,ace in pairs(principals) do 
				PrintDebugMessage("parsed principal ^1"
				..tostring(ace[1]).." "
				..tostring(ace[2]).."^7 in "
				..filename.."\n", 4)
			end
			
			for i,ace in pairs(execs) do 
				PrintDebugMessage("parsed exec ^1"
				..tostring(ace).."^7 in "
				..filename.."\n", 4)
			end
			
			return aces, principals, execs
		else 
			if filename == "easyadmin_permissions.cfg" then
				local file = io.open(filename, "w")
				local newLines = {}
				table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.add_ace allow")
				table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.remove_ace allow")
				table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.add_principal allow")
				table.insert(newLines, "add_ace resource."..GetCurrentResourceName().." command.remove_principal allow")
				local output = ""
				for i, line in pairs(newLines) do
					output=output..line.."\n"
				end
				file:write(output) -- write our lines
				file:close()
			end
			PrintDebugMessage(filename.." cannot be read, bailing.", 4)
			return {}, {}, {}
		end
	end
	
	Citizen.CreateThread(function()
		lockedFiles = {}
		function AddToFile(filename, args)
			if not GetInvokingResource() or GetInvokingResource() == GetCurrentResourceName() then -- sorry, but i _really_ dont want other resources hooking into easyadmins file edit functions.

				local path = GetResourcePath(GetCurrentResourceName())
				local occurance = string.find(path, "/resources", 1, true)
				local path = string.reverse(string.sub(string.reverse(path), -occurance))
				
				
				local args = args
				local filename = filename
				while lockedFiles[filename] do
					Wait(100)
				end
				lockedFiles[filename] = true
				
				
				local file = io.open(filename, "a")
				if file then
					file:write("\n"..args) -- write our lines
					file:close()
				else 
					PrintDebugMessage(filename.." cannot be read, bailing.", 4)
					return {}, {}, {}
				end
				Wait(500) -- without waiting after saving a file it sometimes does not properly save, some OS limitation maybe?
				lockedFiles[filename] = false
			end
		end
		exports('AddToFile', AddToFile)
		
		function RemoveFromFile(filename, args, partial)
			if not GetInvokingResource() or GetInvokingResource() == GetCurrentResourceName() then -- sorry, but i _really_ dont want other resources hooking into easyadmins file edit functions.

				local path = GetResourcePath(GetCurrentResourceName())
				local occurance = string.find(path, "/resources", 1, true)
				local path = string.reverse(string.sub(string.reverse(path), -occurance))
				
				local args = args
				local filename = filename
				while lockedFiles[filename] do
					Wait(100)
				end
				lockedFiles[filename] = true
				
				local file = io.open(filename, "r")
				local lines = {}
				if file then
					local line = file:read("*line")
					while line do
						if (partial and string.find(line, args) or (not partial and line == args)) or (filename == "easyadmin_permissions.cfg" and line == "") then -- skip lines we dont want, incl. empty lines
						else
							table.insert(lines, line)
						end
						line = file:read("*line")
					end
					file:close()
					local output = ""
					for i, line in pairs(lines) do
						output=output..line.."\n"
					end
					local file = io.open(filename, "w")
					file:write(output) -- write our lines
					file:close()
				else 
					PrintDebugMessage(filename.." cannot be read, bailing.", 4)
					return {}, {}, {}
				end
				Wait(500) -- without waiting after saving a file it sometimes does not properly save, some OS limitation maybe?
				lockedFiles[filename] = false
			end
		end
		exports('RemoveFromFile', RemoveFromFile)
	end)
	
	RegisterServerEvent("EasyAdmin:getServerAces", function()
		if DoesPlayerHavePermission(source, "server.permissions.read") then
			TriggerLatentClientEvent("EasyAdmin:getServerAces", source, 100000, add_aces, add_principals)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:setServerAces", function(aces,principals)
		if DoesPlayerHavePermission(source, "server.permissions.write") then
			local source=source
			local aces=aces
			local principals=principals
			-- reconfigure aces
			for i, ace in pairs(add_aces) do
				
				if not aces[i] then
					if not ace.file then ace.file = "easyadmin_permissions.cfg" end
					
					ExecuteCommand("remove_ace "..ace[1].." "..ace[2].." "..ace[3])
					RemoveFromFile(ace.file, ace.oldline or "add_ace "..ace[1].." "..ace[2].." "..ace[3])
					
					
					PrintDebugMessage("Executed remove_ace "..ace[1].." "..ace[2].." "..ace[3], 4)
				elseif aces[i][1] ~= ace[1] or aces[i][2] ~= ace[2] or aces[i][3] ~= ace[3] then
					if not ace.file then ace.file = "easyadmin_permissions.cfg" end
					if not aces[i].file then aces[i].file = "easyadmin_permissions.cfg" end
					ExecuteCommand("remove_ace "..ace[1].." "..ace[2].." "..ace[3])
					RemoveFromFile(ace.file, ace.oldline or "add_ace "..ace[1].." "..ace[2].." "..ace[3])
					
					ExecuteCommand("add_ace "..aces[i][1].." "..aces[i][2].." "..aces[i][3])
					AddToFile(aces[i].file, "add_ace "..aces[i][1].." "..aces[i][2].." "..aces[i][3])
					
					
					PrintDebugMessage("Executed remove_ace "..ace[1].." "..ace[2].." "..ace[3], 4)
					PrintDebugMessage("Executed add_ace "..aces[i][1].." "..aces[i][2].." "..aces[i][3], 4)
				end
			end
			for i, ace in pairs(aces) do
				if not add_aces[i] then
					if not ace.file then ace.file = "easyadmin_permissions.cfg" end
					
					ExecuteCommand("add_ace "..ace[1].." "..ace[2].." "..ace[3])
					AddToFile(ace.file, "add_ace "..ace[1].." "..ace[2].." "..ace[3])
					
					PrintDebugMessage("Executed add_ace "..ace[1].." "..ace[2].." "..ace[3], 4)
				end
			end
			-- reconfigure principals
			for i, principal in pairs(add_principals) do
				
				-- set file as our permissions file in case its unset
				
				if not principals[i] then
					if not principal.file then principal.file = "easyadmin_permissions.cfg" end
					
					ExecuteCommand("remove_principal "..principal[1].." "..principal[2])
					RemoveFromFile(principal.file, principal.oldline or "add_principal "..principal[1].." "..principal[2])
					
					PrintDebugMessage("Executed remove_principal "..principal[1].." "..principal[2], 4)
				elseif principals[i][1] ~= principal[1] or principals[i][2] ~= principal[2] then
					if not principal.file then principal.file = "easyadmin_permissions.cfg" end
					if not principals[i].file then principals[i].file = "easyadmin_permissions.cfg" end
					
					ExecuteCommand("remove_principal "..principal[1].." "..principal[2])
					RemoveFromFile(principal.file, principal.oldline or "add_principal "..principal[1].." "..principal[2])
					
					
					ExecuteCommand("add_principal "..principals[i][1].." "..principals[i][2])
					AddToFile(principals[i].file, "add_principal "..principals[i][1].." "..principals[i][2])
					
					PrintDebugMessage("Executed remove_principal "..principal[1].." "..principal[2], 4)
					PrintDebugMessage("Executed add_principal "..principals[i][1].." "..principals[i][2], 4)
				end
			end
			for i, principal in pairs(principals) do
				if not add_principals[i] then
					if not principal.file then principal.file = "easyadmin_permissions.cfg" end
					ExecuteCommand("add_principal "..principal[1].." "..principal[2])
					AddToFile(principal.file, "add_principal "..principal[1].." "..principal[2])
					
					PrintDebugMessage("Executed add_principal "..principal[1].." "..principal[2], 4)
				end
			end
			
			
			add_aces = aces
			add_principals = principals
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("admineditedpermissions"), getName(source, false, true)), "permissions", 16777214)
			TriggerLatentClientEvent("EasyAdmin:getServerAces", source, 100000, add_aces, add_principals)
		end
	end)
end)