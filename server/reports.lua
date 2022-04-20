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

AddEventHandler('playerDropped', function (reason)
    for i, report in pairs(reports) do
        if report.reporter == source or (report.reported and report.reported == source) then
            removeReport(report.id)
        end
    end
    if cooldowns[source] then
		cooldowns[source] = nil
	end
end)

cooldowns = {} -- DO NOT TOUCH THIS

Citizen.CreateThread(function()
    
    PlayerReports = {}
    
    if GetConvar("ea_enableCallAdminCommand", "true") == "true" then
        RegisterCommand(GetConvar("ea_callAdminCommandName", "calladmin"), function(source, args, rawCommand)
            if args[1] then
                local time = os.time()
                local cooldowntime = GetConvarInt("ea_callAdminCooldown", 60)
                local source=source
                if cooldowns[source] and cooldowns[source] > (time - cooldowntime) then
                    TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("waitbeforeusingagain"))
                    return
                end
                
                local reason = string.gsub(rawCommand, GetConvar("ea_callAdminCommandName", "calladmin").." ", "")
                local reportid = addNewReport(0, source, _,reason)
                for i,_ in pairs(OnlineAdmins) do 
                    local notificationText = string.format(string.gsub(GetLocalisedText("playercalledforadmin"), "```", ""), getName(source,true,false), reason, reportid)
                    TriggerClientEvent("EasyAdmin:showNotification", i, notificationText)
                end
                
                
                local preferredWebhook = (reportNotification ~= "false") and reportNotification or moderationNotification
                SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("playercalledforadmin"), getName(source, true, true), reason, reportid), "calladmin", 16776960)
                --TriggerClientEvent('chatMessage', source, "^3EasyAdmin^7", {255,255,255}, GetLocalisedText("admincalled"))
                TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("admincalled"))
                
                time = os.time()
                cooldowns[source] = time
            else
                TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidreport"))
            end
        end, false)
    end
    if GetConvar("ea_enableReportCommand", "true") == "true" then
        RegisterCommand(GetConvar("ea_reportCommandName", "report"), function(source, args, rawCommand)
            if args[2] then
                local source = source
                local id = args[1]
                local valid = false
                local minimumreports = GetConvarInt("ea_defaultMinReports", 3)
                if GetConvar("ea_MinReportModifierEnabled", "true") == "true" then
                    if #GetPlayers() > GetConvarInt("ea_MinReportPlayers", 12) then
                        minimumreports = math.round(#GetPlayers()/GetConvarInt("ea_MinReportModifier", 4),0)
                    end
                end
                if id and not GetPlayerIdentifier(id, 1) then
                    for i, player in pairs(GetPlayers()) do
                        if string.find(string.lower(getName(player, true)), string.lower(id)) then
                            id = player
                            valid = true
                            break
                        end
                    end
                else
                    valid = true
                end
                
                
                if id and valid then
                    local reason = string.gsub(rawCommand, GetConvar("ea_reportCommandName", "report").." " ..args[1].." ", "")
                    if not PlayerReports[id] then
                        PlayerReports[id] = { }
                    end
                    local addReport = true
                    for i, report in pairs(PlayerReports[id]) do
                        if report.source == source or report.sourceName == getName(source, true) then
                            addReport = false
                        end
                    end
                    if addReport then
                        table.insert(PlayerReports[id], {source = source, sourceName = getName(source, true), reason = reason, time = os.time()})
                        local reportid = addNewReport(1, source, id, reason)
                        local preferredWebhook = (reportNotification ~= "false") and reportNotification or moderationNotification
                        SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("playerreportedplayer"), getName(source, false, true), getName(id, true, true), reason, #PlayerReports[id], minimumreports, reportid), "report", 16776960)
                        if GetConvar("ea_enableReportScreenshots", "true") == "true" then
                            TriggerEvent("EasyAdmin:TakeScreenshot", id)
                        end
                        
                        
                        for i,_ in pairs(OnlineAdmins) do 
                            local notificationText = string.format(string.gsub(GetLocalisedText("playerreportedplayer"), "```", ""), getName(source, false, false), getName(id, true, false), reason, #PlayerReports[id], minimumreports, reportid)
                            TriggerClientEvent('chat:addMessage', i, { 
                                template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0} </div>',
                                args = { "^3EasyAdmin Report^7\n"..notificationText }, color = { 255, 255, 255 } 
                            })
                            TriggerClientEvent("EasyAdmin:showNotification", i, notificationText)
                        end
                        TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("successfullyreported"))
                        
                        if #PlayerReports[id] >= minimumreports then
                            TriggerEvent("EasyAdmin:addBan", id, string.format(GetLocalisedText("reportbantext"), minimumreports), os.time()+GetConvarInt("ea_ReportBanTime", 86400))
                        end
                    else
                        TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("alreadyreported"))
                    end
                else
                    TriggerClientEvent('chat:addMessage', source, { 
                        template = '<div style="padding: 0.5vw; margin: 0.5vw; background-color: rgba(253, 53, 53, 0.6); border-radius: 5px;"><i class="fas fa-user-crown"></i> {0}:<br> {1}</div>',
                        args = { "^3EasyAdmin^7", GetLocalisedText("reportedusageerror") }, color = { 255, 255, 255 } 
                    })
                    TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("reportedusageerror"))
                end
            else
                TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidreport"))
            end
        end, false)
    end


	function addNewReport(type, reporter, reported, reason)
		local t = nil
		if type == 1 then
			t = {type=type, reporter=reporter, reporterName=getName(reporter, true), reported=reported, reportedName=getName(reported, true),reason=reason}
		else
			t = {type=type, reporter=reporter, reporterName=getName(reporter, true), reason=reason}
		end
		t.id = #reports+1
		reports[t.id] = t
		for i,_ in pairs(OnlineAdmins) do 
			TriggerLatentClientEvent("EasyAdmin:NewReport", i, 10000, t)
		end
        TriggerEvent("EasyAdmin:reportAdded", t)
		return t.id
	end
	
	RegisterServerEvent("EasyAdmin:ClaimReport", function(reportId)
		if DoesPlayerHavePermission(source, "player.reports.claim") then
			if not reports[reportId].claimed then
				reports[reportId].claimed = source
				reports[reportId].claimedName = getName(source,true)
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:ClaimedReport", admin, 10000, reports[reportId])
				end
                TriggerEvent("EasyAdmin:reportClaimed", reports[reportId])
			else
				TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("reportalreadyclaimed"))
			end
		end
	end)
	
	function removeReport(index,reporter,reported,reason)
		for i, report in pairs(reports) do
			if (index and i == index) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, report)
				end
                TriggerEvent("EasyAdmin:reportRemoved", report)
				reports[i] = nil
			elseif (reporter and reporter == report.reporter) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, report)
				end
                TriggerEvent("EasyAdmin:reportRemoved", report)
				reports[i] = nil
			elseif (reported and reported == report.reported) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, report)
				end
                TriggerEvent("EasyAdmin:reportRemoved", report)
				reports[i] = nil
			end
		end
	end
	
	function removeSimilarReports(report)
		for i, r in pairs(reports) do
			if (report.reporter and report.reported) and (report.reporter == r.reporter and report.reported == r.reported) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, r)
				end
                TriggerEvent("EasyAdmin:reportRemoved", r)
				reports[i] = nil
			end
			if (report.reason and report.reporter) and (report.reason == r.reason and report.reporter == r.reporter) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, r)
				end
                TriggerEvent("EasyAdmin:reportRemoved", r)
				reports[i] = nil
			end
			if (report.reported) and (report.reported == r.reported) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, r)
				end
                TriggerEvent("EasyAdmin:reportRemoved", r)
				reports[i] = nil
			end
			if (report.reporter) and (report.reporter == r.reporter) then
				for admin,_ in pairs(OnlineAdmins) do 
					TriggerLatentClientEvent("EasyAdmin:RemoveReport", admin, 10000, r)
				end
                TriggerEvent("EasyAdmin:reportRemoved", r)
				reports[i] = nil
			end
		end
	end


	function getAllReports()
		return reports
	end
	exports('getAllReports', getAllReports)

		
	
	RegisterServerEvent("EasyAdmin:RemoveReport", function(report)
		if DoesPlayerHavePermission(source, "player.reports.process") then
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminclosedreport"), getName(source, false, true), report.id), "reports", 16777214)
			removeReport(report.id)
		end
	end)
	
	RegisterServerEvent("EasyAdmin:RemoveSimilarReports", function(report)
		if DoesPlayerHavePermission(source, "player.reports.process") then
			SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminclosedreport"), getName(source, false, true), report.id), "reports", 16777214)
			removeSimilarReports(report)
		end
	end)
    
end)