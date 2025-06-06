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
                if cooldowns[source] and cooldowns[source] > (time - cooldowntime) then
                    TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("waitbeforeusingagain"))
                    return
                end
                local reportTime = os.time()
                local reason = string.gsub(rawCommand, GetConvar("ea_callAdminCommandName", "calladmin").." ", "")
                local reportid = addNewReport(0, source, _, reason, reportTime)

                for i,_ in pairs(OnlineAdmins) do 
                    local notificationText = string.format(
                        string.gsub(GetLocalisedText("playercalledforadmin"), "```", ""),
                        getName(source, true, false), reason, reportid, reportTime
                    )
                    TriggerClientEvent("EasyAdmin:showNotification", i, notificationText)
                end

                local preferredWebhook = (reportNotification ~= "false") and reportNotification or moderationNotification
                SendWebhookMessage(preferredWebhook,string.format(GetLocalisedText("playercalledforadmin"), getName(source, true, true), reason, reportid, reportTime), "calladmin", 16776960)
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
                local id = args[1]
                local valid = false
                local reportTime = os.time()
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
                    if not valid then
                        valid = true
                    end
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
                        table.insert(PlayerReports[id], {source = source, sourceName = getName(source, true), reason = reason, reportTime = reportTime})
                        local reportid = addNewReport(1, source, id, reason, reportTime)

                        local preferredWebhook = (reportNotification ~= "false") and reportNotification or moderationNotification
                        SendWebhookMessage(preferredWebhook, string.format(
                            GetLocalisedText("playerreportedplayer"),
                            getName(source, false, true), getName(id, true, true), reason, #PlayerReports[id], minimumreports, reportid, reportTime
                        ), "report", 16776960)

                        if GetConvar("ea_enableReportScreenshots", "true") == "true" then
                            TriggerEvent("EasyAdmin:TakeScreenshot", id)
                        end

                        for i,_ in pairs(OnlineAdmins) do 
                            local notificationText = string.format(
                                string.gsub(GetLocalisedText("playerreportedplayer"), "```", ""),
                                getName(source, false, false), getName(id, true, false), reason, #PlayerReports[id], minimumreports, reportid, reportTime
                            )
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
                    TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("reportedusageerror"))
                end
            else
                TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("invalidreport"))
            end
        end, false)
    end


    function timeAgo(timestamp)
        local diff = os.time() - timestamp
        local minutes = math.floor(diff / 60)

        if minutes < 1 then
            return "1m ago"
        elseif minutes < 120 then
            return string.format("%dm ago", minutes)
        end
    end

    function addNewReport(type, reporter, reported, reason, reportTime)
        local t = {}
        local timestamp = os.time()
        
        if type == 1 then
            t = {type = type, reporter = reporter, reporterName = getName(reporter, true), reported = reported, reportedName = getName(reported, true), reason = reason, reportTime = timestamp}
        else
            t = {type = type, reporter = reporter, reporterName = getName(reporter, true), reason = reason, reportTime = timestamp}
        end
        t.id = #reports + 1
        reports[t.id] = t

        t.reportTimeFormatted = timeAgo(t.reportTime)

        for i,_ in pairs(OnlineAdmins) do 
            TriggerLatentClientEvent("EasyAdmin:NewReport", i, 10000, t)
        end
        TriggerEvent("EasyAdmin:reportAdded", t)

        return t.id
    end

    Citizen.CreateThread(function()
        while true do
            Citizen.Wait(60000)

            for _, report in pairs(reports) do
                local time = os.time()
                local diff = time - report.reportTime
                local minutes = math.floor(diff / 60)

                if minutes < 1 then
                    report.reportTimeFormatted = "1m ago"
                elseif minutes < 120 then
                    report.reportTimeFormatted = string.format("%dm ago", minutes)
                else
                    report.reportTimeFormatted = string.format("%dh ago", math.floor(minutes / 60))
                end

                for i,_ in pairs(OnlineAdmins) do 
                    TriggerLatentClientEvent("EasyAdmin:NewReport", i, 10000, report)
                end
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
    
    ---Returns a table containing all reports.
    ---@return table @A table of all reports.
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