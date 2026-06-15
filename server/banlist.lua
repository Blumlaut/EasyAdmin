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

-- Ban index for O(1) lookups
banIndex = {}

local function rebuildBanIndex()
    banIndex = {}
    for _, ban in ipairs(blacklist) do
        if ban.identifiers then
            for _, id in ipairs(ban.identifiers) do
                banIndex[id] = ban
            end
        end
    end
end

---Rebuilds the derived enforcement view (the global `blacklist` + `banIndex`) from the authoritative
---Storage banlist. Storage calls this after every ban mutation so enforcement reflects changes at once.
function RebuildBanlistView()
    blacklist = Storage.getBanList()
    rebuildBanIndex()
end

function IsSelfBan(banner, target)
    if banner == nil or target == nil then return false end
    return tonumber(banner) == tonumber(target)
end

---Handles the banning of a player
---@param playerId number @The ID of the player to ban
---@param reason string @The reason for the ban
---@param expires number @The timestamp when the ban should expire
---@return nil
RegisterServerEvent("EasyAdmin:banPlayer", function(playerId,reason,expires)
    local src = source
    if not playerId or not isPlayerOnline(playerId) then
        TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("invalidplayer"))
        return
    end
    if IsSelfBan(src, playerId) and GetConvar("ea_dangerousDevMode", "false") ~= "true" then
        TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("cantbanself"))
        return
    end

    if playerId ~= nil and CheckAdminCooldown(src, "ban") then
        if (DoesPlayerHavePermission(src, "player.ban.temporary") or DoesPlayerHavePermission(src, "player.ban.permanent")) and not isPlayerImmune(playerId) then
            SetAdminCooldown(src, "ban")
            local bannedIdentifiers = getCachedPlayerIdentifiers(playerId) or getAllPlayerIdentifiers(playerId)
            local username = getCachedPlayerName(playerId) or getName(playerId, true)
            if expires and expires < os.time() then
                expires = os.time()+expires 
            elseif not expires then 
                expires = 10444633200
            end
            if expires >= 10444633200 and not DoesPlayerHavePermission(src, "player.ban.permanent") then
                return false
            end
            
            reason = formatShortcuts(reason).. string.format(GetLocalisedText("reasonadd"), getCachedPlayerName(playerId), getName(src) )
            local banId = GetFreshBanId()
            local moderatorIdentifiers = {}
            if source and source ~= 0 then
                moderatorIdentifiers = getAllPlayerIdentifiers(source)
            end
            Storage.addBan(banId, username, bannedIdentifiers, getName(src), reason, expires, formatDateString(expires), "BAN", os.time())
            Storage.addAction("BAN", getAllPlayerIdentifiers(playerId), reason, getName(src), moderatorIdentifiers, banId)
            PrintDebugMessage("Player "..getName(src,true).." banned player "..getCachedPlayerName(playerId).." for "..reason, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), getName(src, false, true), getCachedPlayerName(playerId), reason, formatDateString( expires ), tostring(banId) ), "ban", 16711680)
            DropPlayer(playerId, string.format(GetLocalisedText("banned"), reason, formatDateString( expires ) ) )
        elseif isPlayerImmune(playerId) then
            TriggerClientEvent("EasyAdmin:showNotification", src, GetLocalisedText("adminimmune"))
        end
    end
end)

---Handles the banning of an offline player
---@param playerId number @The ID of the offline player to ban
---@param reason string @The reason for the ban
---@param expires number @The timestamp when the ban should expire
---@return nil
RegisterServerEvent("EasyAdmin:offlinebanPlayer", function(playerId,reason,expires)
    local src = source
    if playerId ~= nil and not isPlayerImmune(playerId) and CheckAdminCooldown(source, "ban") then
        if IsSelfBan(source, playerId) and GetConvar("ea_dangerousDevMode", "false") ~= "true" then
            TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("cantbanself"))
            return
        end
        if (DoesPlayerHavePermission(source, "player.ban.temporary") or DoesPlayerHavePermission(source, "player.ban.permanent")) and not isPlayerImmune(playerId) then
            SetAdminCooldown(source, "ban")
            local bannedIdentifiers = getCachedPlayerIdentifiers(playerId) or getAllPlayerIdentifiers(playerId)
            local username = getCachedPlayerName(playerId) or getName(playerId, true)
            if expires and expires < os.time() then
                expires = os.time()+expires 
            elseif not expires then 
                expires = 10444633200
            end
            if expires >= 10444633200 and not DoesPlayerHavePermission(source, "player.ban.permanent") then
                return false
            end
            
            reason = formatShortcuts(reason).. string.format(GetLocalisedText("reasonadd"), getCachedPlayerName(playerId), getName(source) )
            local banId = GetFreshBanId()
            Storage.addBan(banId, username, bannedIdentifiers, getName(source), reason, expires, formatDateString(expires), "OFFLINE BAN", os.time())
            Storage.addAction("OFFLINE BAN", bannedIdentifiers, reason, getName(source), getAllPlayerIdentifiers(src), banId)
            PrintDebugMessage("Player "..getName(source,true).." offline banned player "..getCachedPlayerName(playerId).." for "..reason, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminofflinebannedplayer"), getName(source, false, true), getCachedPlayerName(playerId), reason, formatDateString( expires ) ), "ban", 16711680)
        end
    elseif isPlayerImmune(playerId) then
        TriggerClientEvent("EasyAdmin:showNotification", source, GetLocalisedText("adminimmune"))
    end
end)

AddEventHandler('banCheater', function(playerId,reason)
    Citizen.Trace("^1EasyAdmin^7: the banCheater event is ^1deprecated^7 and has been removed! Please adjust your ^3"..GetInvokingResource().."^7 Resource to use EasyAdmin:addBan instead.")
end)

---Adds a ban to the banlist, either for an online or offline player
---@param playerId number|string|table @The ID of the player or a table of identifiers if the player is offline
---@param reason string @The reason for the ban
---@param expires number @The timestamp when the ban should expire
---@param banner string @The name of the administrator who issued the ban
---@return table @The created ban entry
function addBanExport(playerId,reason,expires,banner)
    local bannedIdentifiers = {}
    local bannedUsername = "Unknown"
    local offline = false
    if type(playerId) == "table" then -- if playerId is a table of identifiers
        offline = true
        bannedIdentifiers = playerId
    elseif isPlayerOnline(playerId) then
        if hasPlayerDropped(playerId) then
            offline = true
        end
        if isPlayerImmune(playerId) then
            return false
        end
        bannedIdentifiers = getCachedPlayerIdentifiers(playerId)
        bannedUsername = getCachedPlayerName(playerId) or getName(playerId, true)
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
    local banId = GetFreshBanId()
    Storage.addBan(banId, bannedUsername, bannedIdentifiers, banner or "Unknown", reason, expires, formatDateString(expires), "BAN", os.time())
    Storage.addAction("BAN", bannedIdentifiers, reason, banner or "Unknown", getAllPlayerIdentifiers(source), banId)
    if source then
        PrintDebugMessage("Player "..getName(source,true).." added ban "..reason, 3)
    end

    local ban = Storage.getBan(banId)
    SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminbannedplayer"), banner or "Unknown", getName(tostring(playerId) or "?", false, true), reason, formatDateString( expires ), tostring(banId) ), "ban", 16711680)
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
        TriggerLatentClientEvent("EasyAdmin:fillBanlist", src, 100000, Storage.getBanList())
        PrintDebugMessage("Banlist Requested by "..getName(src,true), 3)
    end
end)

---Paginated ban list request (server-side pagination for large ban lists)
---Returns lightweight entries without identifiers to minimise payload size.
---Full ban details are fetched via EasyAdmin:getBanById when a row is clicked.
RegisterServerEvent("EasyAdmin:requestBanPage", function(data)
    local src = source
    if not DoesPlayerHavePermission(src, "player.ban.view") then return end

    local page = tonumber(data and data.page) or 1
    local pageSize = tonumber(data and data.pageSize) or 10
    local query = (data and data.query) and tostring(data.query):lower() or nil

    if page < 1 then page = 1 end
    if pageSize < 1 or pageSize > 100 then pageSize = 10 end

    -- Build filtered list (server-side search)
    local filtered = {}
    for _, ban in ipairs(blacklist) do
        if query then
            local match = false
            if tostring(ban.banid or ''):lower():find(query, 1, true) then match = true end
            if not match and ban.name and tostring(ban.name):lower():find(query, 1, true) then match = true end
            if not match and ban.reason and tostring(ban.reason):lower():find(query, 1, true) then match = true end
            if not match and ban.identifiers then
                for _, id in ipairs(ban.identifiers) do
                    if tostring(id):lower():find(query, 1, true) then match = true; break end
                end
            end
            if not match then goto continue end
        end
        table.insert(filtered, ban)
        ::continue::
    end

    local total = #filtered
    local totalPages = math.max(1, math.ceil(total / pageSize))
    if page > totalPages then page = totalPages end

    local startIdx = (page - 1) * pageSize + 1
    local endIdx = math.min(startIdx + pageSize - 1, total)

    -- Lightweight entries for list view (no identifiers)
    local entries = {}
    for i = startIdx, endIdx do
        local ban = filtered[i]
        table.insert(entries, {
            banid = ban.banid,
            name = ban.name,
            reason = ban.reason,
            expire = ban.expire,
            expireString = ban.expireString,
        })
    end

    TriggerClientEvent("EasyAdmin:banPageResult", src, {
        bans = entries,
        total = total,
        page = page,
        pageSize = pageSize,
        totalPages = totalPages,
    })
end)

---Fetch full ban details by ID (used by BanDetailPage)
RegisterServerEvent("EasyAdmin:getBanById", function(banId)
    local src = source
    if not DoesPlayerHavePermission(src, "player.ban.view") then return end

    local result = nil
    for _, ban in ipairs(blacklist) do
        if tostring(ban.banid) == tostring(banId) then
            result = ban
            break
        end
    end

    TriggerClientEvent("EasyAdmin:banDetailResult", src, result)
end)

RegisterCommand("unban", function(source, args, rawCommand)
    if args[1] and DoesPlayerHavePermission(source, "player.ban.remove") and CheckAdminCooldown(source, "unban") then
        SetAdminCooldown(source, "unban")
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
        Storage.updateBan(ban.banid, ban)
    end
end)

---Unbans a player using their ban ID
---@param banId number @The ID of the ban to be removed
---@return boolean @True if the unban was successful, false otherwise
function unbanPlayer(banId)
    return Storage.removeBan(banId)
end
exports('unbanPlayer', unbanPlayer)

---Fetches a ban entry by its ID
---@param banId number @The ID of the ban to fetch
---@return table|false @The ban entry if found, false otherwise
function fetchBan(banId)
    return Storage.getBan(banId)
end
exports('fetchBan', fetchBan)

RegisterServerEvent("EasyAdmin:unbanPlayer", function(banId)
    local src = source
    if DoesPlayerHavePermission(src, "player.ban.remove") and CheckAdminCooldown(src, "unban") then
        SetAdminCooldown(src, "unban")
        local thisBan = fetchBan(banId)
        local ret = unbanPlayer(banId)
        if ret then
            PrintDebugMessage("Player "..getName(src,true).." unbanned "..banId, 3)
            SendWebhookMessage(moderationNotification,string.format(GetLocalisedText("adminunbannedplayer"), getName(src, false, true), banId, thisBan.reason), "ban", 16711680)
        end
    end
end)
	
---Generates a new unique ban ID
---@return number @The next available ban ID
function GetFreshBanId()
    local blacklist = Storage.getBanList()
    local maxId = 0
    for _, ban in ipairs(blacklist) do
        if ban.banid and ban.banid > maxId then
            maxId = ban.banid
        end
    end
    return maxId + 1
end
exports('GetFreshBanId', GetFreshBanId)

---Updates a ban entry in the banlist
---@param id number @The ID of the ban to update
---@param newData table @The new data to apply to the ban
---@return nil
function updateBan(id,newData)
    if id and newData and newData.identifiers and newData.banid and newData.reason and newData.expire then
        Storage.updateBan(newData.banid, newData) -- persists to banlist.json + refreshes the enforcement view
        if GetConvar("ea_custombanlist", "false") == "true" then
            TriggerEvent("ea_data:updateBan", newData)
        end
    end
end


---Adds a new ban entry to the banlist
---@param data table @The data of the ban to be added
---@return nil
function addBan(data)
    if data then
        -- Route through Storage (the single banlist owner) rather than the derived blacklist view.
        Storage.addBan(data.banid, data.username or data.name, data.identifiers, data.banner, data.reason, data.expire, data.expiryString, data.type, data.time)
    end
end


---Synchronizes the in-memory banlist with the stored file or external system
---@param data table @Optional data to add or remove from the banlist
---@param remove boolean @Whether this is a remove operation
---@param forceChange boolean @Whether to force a save regardless of changes
---@return nil
function updateBlacklist(data, remove, forceChange)
    local change = (forceChange or false) --mark if the list changed, to save up on disk writes.

    -- Storage is the single owner of banlist.json; operate on its authoritative in-memory list.
    local banlist = Storage.getBanList()
    if not banlist then
        PrintDebugMessage("^1Failed^7 to load Banlist from Storage! ^1Bans *will not* work!^7\n")
        return
    end

    -- legacy/version upgrades (operates on Storage's live table and persists via Storage)
    if performBanlistUpgrades() then change = true end

    if data and not remove then
        addBan(data)
        PrintDebugMessage("Added the following data to banlist:\n"..table_to_string(data), 4)
        change = true
    elseif not data then
        -- validation + expiry sweep; iterate backwards because we remove entries in place
        for i = #banlist, 1, -1 do
            local theBan = banlist[i]
            theBan.id = nil
            if not theBan.banid then
                theBan.banid = GetFreshBanId()
                PrintDebugMessage("Ban did not have an ID, assigned "..theBan.banid..".", 4)
                change = true
            end
            if not theBan.expire then
                PrintDebugMessage("Ban "..tostring(theBan.banid).." did not have an expiry time, removing..", 4)
                table.remove(banlist, i)
                change = true
            elseif not theBan.identifiers or not theBan.identifiers[1] then
                PrintDebugMessage("Ban "..tostring(theBan.banid).." did not have any identifiers, removing..", 4)
                table.remove(banlist, i)
                change = true
            elseif theBan.expire < os.time() then
                PrintDebugMessage("Ban "..tostring(theBan.banid).." expired, removing..", 4)
                table.remove(banlist, i)
                change = true
            elseif theBan.expire == 1924300800 then
                PrintDebugMessage("Ban "..tostring(theBan.banid).." had legacy expiry time, we fixed it", 4)
                theBan.expire = 10444633200
                change = true
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
        Storage.updateBanlist(banlist) -- single writer of banlist.json; also rebuilds the enforcement view
    else
        RebuildBanlistView() -- nothing changed, but ensure blacklist/banIndex reflect Storage
    end
    PrintDebugMessage("Completed Banlist Update.", 4)
end

---Bans a player using their identifier
---@param identifier string @The identifier of the player to ban
---@param reason string @The reason for the ban
---@return nil
function BanIdentifier(identifier,reason)
    Storage.addBan(GetFreshBanId(), "Unknown", {identifier}, "Unknown", reason, 10444633200, formatDateString(10444633200), "BAN", os.time())
end

---Bans a player using multiple identifiers
---@param identifier table @A table of identifiers for the player to ban
---@param reason string @The reason for the ban
---@return nil
function BanIdentifiers(identifier,reason)
    Storage.addBan(GetFreshBanId(), "Unknown", identifier, "Unknown", reason, 10444633200, formatDateString(10444633200), "BAN", os.time())
end

---Unbans a player using their identifier
---@param identifier string @The identifier of the player to unban
---@return nil
function UnbanIdentifier(identifier)
    Storage.unbanIdentifier(identifier)
end

---Unbans a player using their ban ID
---@param id number @The ID of the ban to remove
---@return nil
function UnbanId(id)
    Storage.removeBan(id)

end
function performBanlistUpgrades()
    local upgraded = false
    local banlist = Storage.getBanList()
    local takenIds = {}
    for i,b in pairs(banlist) do
        if takenIds[b.banid] then
            local freshId = GetFreshBanId()
            PrintDebugMessage("ID "..b.banid.." was assigned twice, reassigned to "..freshId, 4)
            banlist[i].banid = freshId
            upgraded = true
        end
        takenIds[b.banid] = true
    end
    takenIds=nil

    for i,ban in pairs(banlist) do
        if type(i) == "string" then
            PrintDebugMessage("Ban "..ban.banid.." had a string as indice, fixed it.", 4)
            banlist[i] = nil
            table.insert(banlist,ban) 
            upgraded = true
        end
    end
    for i,ban in ipairs(banlist) do
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
    if banlist[1] and (banlist[1].identifier or banlist[1].steam or banlist[1].discord) then 
        Citizen.Trace("Upgrading Banlist...\n", 4)
        for i,ban in ipairs(banlist) do
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
    Storage.updateBanlist(banlist)
    return upgraded
end


---Checks if a given identifier is banned
---@param theIdentifier string @The identifier to check
---@return boolean @True if the identifier is banned, false otherwise
function IsIdentifierBanned(theIdentifier)
    return Storage.getBanIdentifier(theIdentifier) ~= false
end
exports('IsIdentifierBanned', IsIdentifierBanned)

-- Build the derived enforcement view (blacklist + banIndex) once Storage has loaded the banlist.
Citizen.CreateThread(function()
    RebuildBanlistView()
end)
