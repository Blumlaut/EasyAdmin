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

blacklist = {}

RegisterServerEvent("EasyAdmin:banPlayer", function(playerId,reason,expires)
    if playerId ~= nil then
        if (DoesPlayerHavePermission(source, "player.ban.temporary") or DoesPlayerHavePermission(source, "player.ban.permanent")) and CachedPlayers[playerId] and not CachedPlayers[playerId].immune then
            local bannedIdentifiers = CachedPlayers[playerId].identifiers or getAllPlayerIdentifiers(playerId)
            local username = CachedPlayers[playerId].name or getName(playerId, true)
            if expires and expires < os.time() then
                expires = os.time()+expires 
            elseif not expires then 
                expires = 10444633200
            end
            if expires >= 10444633200 and not DoesPlayerHavePermission(source, "player.ban.permanent") then
                return false
            end
            
            reason = formatShortcuts(reason).. string.format(GetLocalisedText("reasonadd"), CachedPlayers[playerId].name, getName(source) )
            local ban = {banid = GetFreshBanId(), name = username,identifiers = bannedIdentifiers, banner = getName(source, true), reason = reason, expire = expires, expireString = formatDateString(expires) }
            updateBlacklist( ban )
            PrintDebugMessage("Player "..getName(source,true).." banned player "..CachedPlayers[playerId].name.." for "..reason, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), getName(source, false, true), CachedPlayers[playerId].name, reason, formatDateString( expires ), tostring(ban.banid) ), "ban", 16711680)
            DropPlayer(playerId, string.format(GetLocalisedText("banned"), reason, formatDateString( expires ) ) )
        elseif CachedPlayers[playerId].immune then
            TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
        end
    end
end)

RegisterServerEvent("EasyAdmin:offlinebanPlayer", function(playerId,reason,expires)
    if playerId ~= nil and not CachedPlayers[playerId].immune then
        if (DoesPlayerHavePermission(source, "player.ban.temporary") or DoesPlayerHavePermission(source, "player.ban.permanent")) and not CachedPlayers[playerId].immune then
            local bannedIdentifiers = CachedPlayers[playerId].identifiers or getAllPlayerIdentifiers(playerId)
            local username = CachedPlayers[playerId].name or getName(playerId, true)
            if expires and expires < os.time() then
                expires = os.time()+expires 
            elseif not expires then 
                expires = 10444633200
            end
            if expires >= 10444633200 and not DoesPlayerHavePermission(source, "player.ban.permanent") then
                return false
            end
            
            reason = formatShortcuts(reason).. string.format(GetLocalisedText("reasonadd"), CachedPlayers[playerId].name, getName(source) )
            local ban = {banid = GetFreshBanId(), name = username,identifiers = bannedIdentifiers, banner = getName(source), reason = reason, expire = expires }
            updateBlacklist( ban )
            PrintDebugMessage("Player "..getName(source,true).." offline banned player "..CachedPlayers[playerId].name.." for "..reason, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminofflinebannedplayer"), getName(source, false, true), CachedPlayers[playerId].name, reason, formatDateString( expires ) ), "ban", 16711680)
        end
    elseif CachedPlayers[playerId].immune then
        TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
    end
end)

AddEventHandler('banCheater', function(playerId,reason)
    Citizen.Trace("^1EasyAdmin^7: the banCheater event is ^1deprecated^7 and has been removed! Please adjust your ^3"..GetInvokingResource().."^7 Resource to use EasyAdmin:addBan instead.")
end)


function addBanExport(playerId,reason,expires,banner)
    local bannedIdentifiers = {}
    local bannedUsername = "Unknown"
    if type(playerId) == "table" then -- if playerId is a table of identifiers
        offline = true
        bannedIdentifiers = playerId
    elseif CachedPlayers[playerId] then
        if CachedPlayers[playerId].dropped then
            offline = true
        end
        if CachedPlayers[playerId].immune then
            return false
        end
        bannedIdentifiers = CachedPlayers[playerId].identifiers
        bannedUsername = CachedPlayers[playerId].name or getName(playerId, true)
    else
        PrintDebugMessage("Couldn't find any Infos about Player "..playerId..", no ban issued.", 1)
        return false
    end

    
    if expires and expires < os.time() then
        expires = os.time()+expires 
    elseif not expires then 
        expires = 10444633200
    end
    reason = formatShortcuts(reason).. string.format(GetLocalisedText("reasonadd"), getName(tostring(playerId) or "?"), banner or "Unknown" )
    local ban = {banid = GetFreshBanId(), name = bannedUsername,identifiers = bannedIdentifiers,  banner = banner or "Unknown", reason = reason, expire = expires, expireString = formatDateString(expires) }
    updateBlacklist( ban )
    
    if source then
        PrintDebugMessage("Player "..getName(source,true).." added ban "..reason, 3)
    end
    
    
    SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), banner or "Unknown", getName(tostring(playerId) or "?", false, true), reason, formatDateString( expires ), tostring(ban.banid) ), "ban", 16711680)
    if not offline then
        DropPlayer(playerId, string.format(GetLocalisedText("banned"), reason, formatDateString( expires ) ) )
    end
    return ban
end
exports('addBan', addBanExport)
AddEventHandler("EasyAdmin:addBan", addBanExport)

RegisterServerEvent("EasyAdmin:updateBanlist", function(playerId)
    local src = source
    if DoesPlayerHavePermission(source, "player.ban.view") then
        updateBlacklist(false,true)
        Citizen.Wait(300)
        TriggerLatentClientEvent("EasyAdmin:fillBanlist", src, 100000, blacklist)
        PrintDebugMessage("Banlist Refreshed by "..getName(src,true), 3)
    end
end)

RegisterServerEvent("EasyAdmin:requestBanlist", function()
    local src = source
    if DoesPlayerHavePermission(source, "player.ban.view") then
        TriggerLatentClientEvent("EasyAdmin:fillBanlist", src, 100000, blacklist)
        PrintDebugMessage("Banlist Requested by "..getName(src,true), 3)
    end
end)

RegisterCommand("unban", function(source, args, rawCommand)
    if args[1] and DoesPlayerHavePermission(source, "player.ban.remove") then
        PrintDebugMessage("Player "..getName(source,true).." Unbanned "..args[1], 3)
        if tonumber(args[1]) then
            UnbanId(tonumber(args[1]))
        else
            UnbanIdentifier(args[1])
        end
        if (source ~= 0) then
            TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("done"))
        else
            Citizen.Trace(GetLocalisedText("done"))
        end
        SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunbannedplayer"), getName(source, false, true), args[1], "Unbanned via Command"), "ban", 16711680)
    end
end, false)

	
RegisterServerEvent("EasyAdmin:editBan", function(ban)
    if DoesPlayerHavePermission(source, "player.ban.edit") then
        updateBan(ban.banid,ban)
        -- TODO Webhook
    end
end)

function unbanPlayer(banId)
    local thisBan = nil
    for i,ban in ipairs(blacklist) do 
        if ban.banid == banId then
            thisBan = ban
            break
        end
    end
    if thisBan == nil then
        return false
    end
    UnbanId(banId)
    return true
end
exports('unbanPlayer', unbanPlayer)


function fetchBan(banId)
    for i,ban in ipairs(blacklist) do 
        if ban.banid == banId then
            return ban
        end
    end
    return false
end
exports('fetchBan', fetchBan)

RegisterServerEvent("EasyAdmin:unbanPlayer", function(banId)
    if DoesPlayerHavePermission(source, "player.ban.remove") then
        local thisBan = fetchBan(banId)
        local ret = unbanPlayer(banId)
        if ret then
            PrintDebugMessage("Player "..getName(source,true).." unbanned "..banId, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunbannedplayer"), getName(source, false, true), banId, thisBan.reason), "ban", 16711680)
        end
    end
end)
	
function GetFreshBanId()
    if blacklist[#blacklist] then 
        return blacklist[#blacklist].banid+1
    else
        return 1
    end
end
exports('GetFreshBanId', GetFreshBanId)


RegisterCommand("convertbanlist", function(source, args, rawCommand)
    if GetConvar("ea_custombanlist", "false") == "true" then
        local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
        local ob = json.decode(content)
        for i,theBan in ipairs(ob) do
            TriggerEvent("ea_data:addBan", theBan)
            print("processed ban: "..i.."\n")
        end
        content=nil
    else
        print("Custom Banlist is not enabled, converting back to json.")
        TriggerEvent('ea_data:retrieveBanlist', function(banlist)
            blacklist = banlist
            for i,theBan in ipairs(blacklist) do
                if not theBan.identifiers then theBan.identifiers = {} end
                if theBan.steam then
                    table.insert(theBan.identifiers, theBan.steam)
                    theBan.steam=nil
                end
                if theBan.identifier then
                    table.insert(theBan.identifiers, theBan.identifier)
                    theBan.identifier=nil
                end
                if theBan.discord then
                    table.insert(theBan.identifiers, theBan.discord)
                    theBan.discord=nil
                end
            end
            local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
            if not saved then
                PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
            end
        end)
    end
end, true)

function updateBan(id,newData)
    if id and newData and newData.identifiers and newData.banid and newData.reason and newData.expire then 
        for i, ban in pairs(blacklist) do
            if ban.banid == newData.banid then
                blacklist[i] = newData
                local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
                if not saved then
                    PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                end
                if GetConvar("ea_custombanlist", "false") == "true" then 
                    TriggerEvent("ea_data:updateBan", newData)
                end
                break
            end
        end
    end
end


function addBan(data)
    if data then
        table.insert(blacklist, data)
    end
end



function updateBlacklist(data,remove, forceChange)
    local change = (forceChange or false) --mark if file was changed to save up on disk writes.
    if GetConvar("ea_custombanlist", "false") == "true" then 
        PrintDebugMessage("You are using a Custom Banlist System, this is ^3not currently supported^7 and WILL cause issues! Only use this if you know what you are doing, otherwise, disable ea_custombanlist.", 1)
        if data and not remove then
            addBan(data)
            TriggerEvent("ea_data:addBan", data)
            
        elseif data and remove then
            UnbanId(data.banid)
        elseif not data then
            TriggerEvent('ea_data:retrieveBanlist', function(banlist)
                blacklist = banlist
                PrintDebugMessage("updated banlist custom banlist", 4)
                for i,theBan in ipairs(blacklist) do
                    if theBan.expire < os.time() then
                        table.remove(blacklist,i)
                        PrintDebugMessage("removing old ban custom banlist", 4)
                        TriggerEvent("ea_data:removeBan", theBan)
                    end
                end
            end)
        end
        return
    end
    
    local content = LoadResourceFile(GetCurrentResourceName(), "banlist.json")
    if not content then
        PrintDebugMessage("banlist.json file was missing, we created a new one.", 2)
        local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode({}), -1)
        if not saved then
            PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
        content = json.encode({})
    end
    blacklist = json.decode(content)
    
    if not blacklist then
        PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
        PrintDebugMessage("^1Failed^7 to load Banlist!\n")
        PrintDebugMessage("Please check your banlist file for errors, ^1Bans *will not* work!^7\n")
        PrintDebugMessage("^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^4-^5-^6-^8-^9-^1-^2-^3-^3!^1FATAL ERROR^3!^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^1-^9-^8-^6-^5-^4-^3-^2-^7\n")
        return
    end
    
    upgraded = performBanlistUpgrades(blacklist)
    if upgraded then change = true end
    
    if data and not remove then
        addBan(data)
        PrintDebugMessage("Added the following data to banlist:\n"..table_to_string(data), 4)
        change=true
    elseif not data then
        for i,theBan in ipairs(blacklist) do
            theBan.id = nil
            if not theBan.banid then
                if i==1 then 
                    theBan.banid = 1
                else
                    theBan.banid = blacklist[i].banid or i
                end
                PrintDebugMessage("Ban "..theBan.banid.." did not have an ID, assigned one.", 4)
                change=true
            end
            if not theBan.expire then 
                PrintDebugMessage("Ban "..theBan.banid.." did not have an expiry time, removing..", 4)
                table.remove(blacklist,i)
                change=true
            elseif not theBan.identifiers then -- make sure 1 identifier is given, otherwise its a broken ban
                PrintDebugMessage("Ban "..theBan.banid.." did not have any identifiers, removing..", 4)
                table.remove(blacklist,i)
                change=true
            elseif not theBan.identifiers[1] then 
                PrintDebugMessage("Ban "..theBan.banid.." did not have one identifier, removing..", 4)
                table.remove(blacklist,i)
                change=true
            elseif theBan.expire < os.time() then
                PrintDebugMessage("Ban "..theBan.banid.." expired, removing..", 4)
                table.remove(blacklist,i)
                change=true
            elseif theBan.expire == 1924300800 then
                PrintDebugMessage("Ban "..theBan.banid.." had legacy expiry time, we fixed it", 4)
                blacklist[i].expire = 10444633200
                change=true
            end
        end
    end
    if data and remove then
        PrintDebugMessage("Removed the following data from banlist:\n"..table_to_string(data), 4)
        UnbanId(data.banid)
        change = true
    end
    if change then
        PrintDebugMessage("Banlist changed, saving..", 4)
        local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
        if not saved then
            PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
        end
    end
    PrintDebugMessage("Completed Banlist Update.", 4)
end

function BanIdentifier(identifier,reason)
    updateBlacklist( {identifiers = {identifier} , banner = "Unknown", reason = reason, expire = 10444633200} )
end

function BanIdentifiers(identifier,reason)
    updateBlacklist( {identifiers = identifier , banner = "Unknown", reason = reason, expire = 10444633200} )
end

function UnbanIdentifier(identifier)
    if identifier then
        for i,ban in pairs(blacklist) do
            for index,id in pairs(ban.identifiers) do
                if identifier == id then
                    table.remove(blacklist,i)
                    local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
                    if not saved then
                        PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
                    end
                    
                    if GetConvar("ea_custombanlist", "false") == "true" then 
                        TriggerEvent("ea_data:removeBan", ban)
                    end
                    PrintDebugMessage("removed ban as per unbanidentifier func", 4)
                    return
                end 
            end
        end
    end
end

function UnbanId(id)
    for i,ban in pairs(blacklist) do
        if ban.banid == id then
            table.remove(blacklist,i)
            local saved = SaveResourceFile(GetCurrentResourceName(), "banlist.json", json.encode(blacklist, {indent = true}), -1)
            if not saved then
                PrintDebugMessage("^1Saving banlist.json failed! Please check if EasyAdmin has Permission to write in its own folder!^7", 1)
            end
            
            if GetConvar("ea_custombanlist", "false") == "true" then 
                TriggerEvent("ea_data:removeBan", ban)
            end
        end
    end
end

function performBanlistUpgrades()
    local upgraded = false
    
    local takenIds = {}
    for i,b in pairs(blacklist) do
        if takenIds[b.banid] then
            local freshId = GetFreshBanId()
            PrintDebugMessage("ID "..b.banid.." was assigned twice, reassigned to "..freshId, 4)
            blacklist[i].banid = freshId
            upgraded = true
        end
        takenIds[b.banid] = true 
    end
    takenIds=nil

    for i,ban in pairs(blacklist) do
        if type(i) == "string" then
            PrintDebugMessage("Ban "..ban.banid.." had a string as indice, fixed it.", 4)
            blacklist[i] = nil
            table.insert(blacklist,ban) 
            upgraded = true
        end
    end
    for i,ban in ipairs(blacklist) do
        if ban.identifiers then
            for k, identifier in pairs(ban.identifiers) do
                if identifier == "" then
                    PrintDebugMessage("Ban "..ban.banid.." had an empty identifier, removed it.", 4)
                    ban.identifiers[k] = nil
                    upgraded = true 
                end
            end
        end
        if not ban.expireString then
            upgraded = true
            ban.expireString = formatDateString(ban.expire)
        end
    end
    if blacklist[1] and (blacklist[1].identifier or blacklist[1].steam or blacklist[1].discord) then 
        Citizen.Trace("Upgrading Banlist...\n", 4)
        for i,ban in ipairs(blacklist) do
            if not ban.identifiers then
                ban.identifiers = {}
                PrintDebugMessage("Ban "..ban.banid.." had no identifiers, added one.", 4)
                upgraded=true
            end
            if ban.identifier then
                table.insert(ban.identifiers, ban.identifier)
                PrintDebugMessage("Ban "..ban.banid.." had identifier, converted to identifiers table", 4)
                ban.identifier = nil
                upgraded=true
            end
            if ban.steam then
                table.insert(ban.identifiers, ban.steam)
                PrintDebugMessage("Ban "..ban.banid.." had seperate steam identifier, converted to identifiers table", 4)
                ban.steam = nil
                upgraded=true
            end
            if ban.discord and ban.discord ~= "" then
                table.insert(ban.identifiers, ban.discord)
                PrintDebugMessage("Ban "..ban.banid.." had seperate discord identifier, converted to identifiers table", 4)
                ban.discord = nil
                upgraded=true
            end
        end
        Citizen.Trace("Banlist Upgraded.\n", 4)
    end
    return upgraded
end



function IsIdentifierBanned(theIdentifier)
    local identifierfound = false
    for index,value in ipairs(blacklist) do
        for i,identifier in ipairs(value.identifiers) do
            if theIdentifier == identifier then
                identifierfound = true
            end
        end
    end
    return identifierfound
end
exports('IsIdentifierBanned', IsIdentifierBanned)