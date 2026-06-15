------------------------------------
-- EasyAdmin NUI Controller
-- Bridges the React NUI frontend with existing EasyAdmin Lua logic
-- Enable with convar: ea_useNUI true
------------------------------------

local nuiVisible = false

-- Check if NUI mode is enabled via convar
local function isNuiEnabled()
    return GetConvar('ea_useNUI', 'false') == 'true'
end

-- Build a clean player list for the frontend
local function buildPlayerList()
    local playerData = {}

    if (RedM and settings.infinity) or not RedM then
        -- Use the existing playerlist (Infinity or GTA5)
        local localplayers = playerlist or {}
        local temp = {}

        for i, thePlayer in pairs(localplayers) do
            table.insert(temp, thePlayer.id)
        end
        table.sort(temp)

        for _, thePlayerId in pairs(temp) do
            for _, thePlayer in pairs(localplayers) do
                if thePlayerId == thePlayer.id then
                    local p = {}
                    p.id = thePlayer.id
                    p.name = thePlayer.name
                    p.identifier = thePlayer.identifier
                    p.ip = thePlayer.ip
                    p.discord = thePlayer.discord
                    p.license = thePlayer.license
                    p.xbl = thePlayer.xbl
                    p.ipprivacy = thePlayer.ipprivacy
                    p.frozen = FrozenPlayers[thePlayer.id] or false
                    p.muted = MutedPlayers[thePlayer.id] or false
                    p.developer = thePlayer.developer
                    p.contributor = thePlayer.contributor
                    table.insert(playerData, p)
                end
            end
        end
    else
        -- RedM without Infinity
        for i = 0, 128 do
            if NetworkIsPlayerActive(i) then
                local serverId = GetPlayerServerId(i)
                local p = {}
                p.id = serverId
                p.name = GetPlayerName(i)
                p.frozen = FrozenPlayers[serverId] or false
                p.muted = MutedPlayers[serverId] or false
                table.insert(playerData, p)
            end
        end
    end

    return playerData
end

-- Pass the full permissions table from Lua to frontend
local function buildPermissions()
    return permissions or {}
end

-- Send player data to NUI
local function sendPlayerData()
    if not nuiVisible then return end

    local perms = buildPermissions()
    local players = {}

    if perms.player then
        players = buildPlayerList()
    end

    SendNUIMessage({
        action = 'updatePlayers',
        data = {
            players = players,
            permissions = buildPermissions(),
        },
    })
end

-- Toggle NUI visibility
local function toggleNui()
    if not isAdmin then
        TriggerServerEvent('EasyAdmin:amiadmin')
        CreateThread(function()
            local waitTime = 0
            repeat
                Wait(10)
                waitTime = waitTime + 1
            until isAdmin or waitTime > 100
            if not isAdmin then return end
            toggleNui()
        end)
        return
    end

    nuiVisible = not nuiVisible

    SendNUIMessage({
        action = 'menuToggle',
        data = { visible = nuiVisible },
    })

    if nuiVisible then
        SetNuiFocus(true, true)
        -- Fetch fresh player data
        if DoesPlayerHavePermissionForCategory(-1, 'player') then
            TriggerServerEvent('EasyAdmin:GetInfinityPlayerList')
        end
        -- Wait for data then send
        CreateThread(function()
            local waitTime = 0
            repeat
                Wait(10)
                waitTime = waitTime + 1
            until playerlist or waitTime > 50
            sendPlayerData()
        end)
    else
        SetNuiFocus(false, false)
    end
end

-- Dedicated NUI command (use /ea_nui or map a key to it)
RegisterCommand('ea_nui', function()
    toggleNui()
end, false)

-- If NUI is enabled, also intercept the main easyadmin command
-- by registering a higher-priority handler
if isNuiEnabled() then
    -- Unregister the original and re-register with NUI logic
    -- We use a separate thread to close NativeUI if it was opened
    RegisterCommand('easyadmin', function(source, args)
        CreateThread(function()
            toggleNui()
            -- If NativeUI menu was also triggered, close it after a brief delay
            Citizen.Wait(500)
            if nuiVisible and _menuPool and _menuPool:IsAnyMenuOpen() then
                _menuPool:Remove()
                _menuPool = nil
            end
        end)
    end, false)
end

-- NUI Callbacks (frontend -> Lua)

RegisterNUICallback('requestPlayers', function(data, cb)
    if DoesPlayerHavePermissionForCategory(-1, 'player') then
        TriggerServerEvent('EasyAdmin:GetInfinityPlayerList')
        CreateThread(function()
            local waitTime = 0
            repeat
                Wait(10)
                waitTime = waitTime + 1
            until playerlist or waitTime > 100
            sendPlayerData()
        end)
    end
    cb({ ok = true })
end)

RegisterNUICallback('closeMenu', function(data, cb)
    nuiVisible = false
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'menuToggle',
        data = { visible = false },
    })
    cb({ ok = true })
end)

RegisterNUICallback('kickPlayer', function(data, cb)
    local targetId = tonumber(data.targetId)
    local reason = data.reason or 'No reason'

    if not targetId or not permissions['player.kick'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:kickPlayer', targetId, reason)
    SendNUIMessage({
        action = 'notification',
        data = { text = 'Kicked player ' .. targetId, type = 'success' },
    })
    cb({ ok = true })
end)

RegisterNUICallback('banPlayer', function(data, cb)
    local targetId = tonumber(data.targetId)
    local reason = data.reason or 'No reason'
    local duration = tonumber(data.duration) or 86400

    if not targetId or not (permissions['player.ban.temporary'] or permissions['player.ban.permanent']) then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    -- Get player name for the ban
    local playerName = 'Unknown'
    if playerlist then
        for _, p in pairs(playerlist) do
            if p.id == targetId then
                playerName = p.name
                break
            end
        end
    end

    TriggerServerEvent('EasyAdmin:banPlayer', targetId, reason, duration, playerName)
    SendNUIMessage({
        action = 'notification',
        data = { text = 'Banned player ' .. targetId, type = 'success' },
    })
    cb({ ok = true })
end)

RegisterNUICallback('warnPlayer', function(data, cb)
    local targetId = tonumber(data.targetId)
    local reason = data.reason or 'No reason'

    if not targetId or not permissions['player.warn'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:warnPlayer', targetId, reason)
    SendNUIMessage({
        action = 'notification',
        data = { text = 'Warned player ' .. targetId, type = 'success' },
    })
    cb({ ok = true })
end)

RegisterNUICallback('slapPlayer', function(data, cb)
    local targetId = tonumber(data.targetId)
    local amount = tonumber(data.amount) or 200

    if not targetId or not permissions['player.slap'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:SlapPlayer', targetId, amount)
    cb({ ok = true })
end)

RegisterNUICallback('spectatePlayer', function(data, cb)
    local targetId = tonumber(data.targetId)

    if not targetId or not permissions['player.spectate'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:requestSpectate', targetId)
    cb({ ok = true })
end)

RegisterNUICallback('teleportToPlayer', function(data, cb)
    local targetId = tonumber(data.targetId)

    if not targetId or not permissions['player.teleport.single'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    if settings.infinity then
        TriggerServerEvent('EasyAdmin:TeleportAdminToPlayer', targetId)
    else
        local playerPed = PlayerPedId()
        local targetPedIndex = GetPlayerFromServerId(targetId)
        if targetPedIndex ~= -1 then
            local targetPed = GetPlayerPed(targetPedIndex)
            local x, y, z = table.unpack(GetEntityCoords(targetPed, true))
            local heading = GetEntityHeading(targetPed)
            lastLocation = GetEntityCoords(playerPed)
            SetEntityCoords(playerPed, x, y, z, 0, 0, heading, false)
        end
    end

    SendNUIMessage({
        action = 'notification',
        data = { text = 'Teleported to player ' .. targetId, type = 'success' },
    })
    cb({ ok = true })
end)

RegisterNUICallback('teleportPlayerToMe', function(data, cb)
    local targetId = tonumber(data.targetId)

    if not targetId or not permissions['player.teleport.single'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    local coords = GetEntityCoords(PlayerPedId(), true)
    TriggerServerEvent('EasyAdmin:TeleportPlayerToCoords', targetId, coords)
    SendNUIMessage({
        action = 'notification',
        data = { text = 'Teleported player ' .. targetId .. ' to you', type = 'success' },
    })
    cb({ ok = true })
end)

RegisterNUICallback('toggleFreeze', function(data, cb)
    local targetId = tonumber(data.targetId)
    local freeze = data.freeze

    if not targetId or not permissions['player.freeze'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:FreezePlayer', targetId, freeze)
    cb({ ok = true })
end)

RegisterNUICallback('toggleMute', function(data, cb)
    local targetId = tonumber(data.targetId)
    local mute = data.mute

    if not targetId or not permissions['player.mute'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:mutePlayer', targetId)
    cb({ ok = true })
end)

RegisterNUICallback('takeScreenshot', function(data, cb)
    local targetId = tonumber(data.targetId)

    if not targetId or not permissions['player.screenshot'] then
        cb({ error = 'Permission denied or invalid target' })
        return
    end

    TriggerServerEvent('EasyAdmin:TakeScreenshot', targetId)
    cb({ ok = true })
end)

RegisterNUICallback('setResourceKvp', function(data, cb)
    if data.key and data.value then
        SetResourceKvp(data.key, data.value)
    end
    cb({ ok = true })
end)

-- Listen for player list updates from server and push to NUI
-- We use a separate handler that coexists with the existing one
RegisterNetEvent('EasyAdmin:GetInfinityPlayerList', function(pl)
    -- The original handler sets playerlist, we just react to updates
    if nuiVisible then
        CreateThread(function()
            Wait(50) -- Let the original handler finish
            sendPlayerData()
        end)
    end
end)

-- Listen for freeze/mute state changes and push to NUI
RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(playerId, state)
    FrozenPlayers[playerId] = state
    if nuiVisible then
        sendPlayerData()
    end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(playerId, state)
    MutedPlayers[playerId] = state
    if nuiVisible then
        sendPlayerData()
    end
end)

-- Keep NUI focus in sync on resource stop
AddEventHandler('onClientResourceStop', function(resource)
    if resource == GetCurrentResourceName() and nuiVisible then
        SetNuiFocus(false, false)
    end
end)

PrintDebugMessage('NUI controller loaded (ea_useNUI convar: ' .. GetConvar('ea_useNUI', 'false') .. ')', 3)
