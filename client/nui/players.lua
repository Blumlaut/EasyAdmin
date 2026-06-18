------------------------------------
-- EasyAdmin NUI: players
-- Player actions exposed to the NUI frontend
------------------------------------

local function toast(text, kind)
  SendNUIMessage({
    action = 'notification',
    data = { text = text, type = kind or 'success' },
  })
end

local function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end

RegisterNUICallback('kickPlayer', function(data, cb)
  if not permissions['player.kick'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:kickPlayer', id, (data and data.reason) or 'No reason')
  toast('Kicked ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('banPlayer', function(data, cb)
  if not (permissions['player.ban.temporary'] or permissions['player.ban.permanent']) then
    return deny(cb)
  end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  local reason = (data and data.reason) or 'No reason'
  local duration = tonumber(data and data.duration) or 86400
  TriggerServerEvent('EasyAdmin:banPlayer', id, reason, duration)
  toast('Banned ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('warnPlayer', function(data, cb)
  if not permissions['player.warn'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:warnPlayer', id, (data and data.reason) or 'No reason')
  toast('Warned ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('slapPlayer', function(data, cb)
  if not permissions['player.slap'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  local amount = tonumber(data and data.amount) or 200
  TriggerServerEvent('EasyAdmin:SlapPlayer', id, amount)
  cb({ ok = true })
end)

RegisterNUICallback('spectatePlayer', function(data, cb)
  if not permissions['player.spectate'] then return deny(cb) end
  local id = tonumber(data and data.id)
  TriggerServerEvent('EasyAdmin:requestSpectate', id)
  cb({ ok = true })
end)

RegisterNUICallback('toggleFreeze', function(data, cb)
  if not permissions['player.freeze'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  local freeze = (data and data.freeze) == true
  TriggerServerEvent('EasyAdmin:FreezePlayer', id, freeze)
  cb({ ok = true })
end)

RegisterNUICallback('toggleMute', function(data, cb)
  if not permissions['player.mute'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:mutePlayer', id)
  cb({ ok = true })
end)

RegisterNUICallback('screenshotPlayer', function(data, cb)
  if not permissions['player.screenshot'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:TakeScreenshot', id)
  cb({ ok = true })
end)

RegisterNUICallback('teleportToPlayer', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  if settings.infinity then
    TriggerServerEvent('EasyAdmin:TeleportAdminToPlayer', id)
  else
    local targetPed = GetPlayerPed(GetPlayerFromServerId(id))
    if targetPed and targetPed ~= 0 then
      local coords = GetEntityCoords(targetPed, true)
      lastLocation = GetEntityCoords(PlayerPedId())
      SetEntityCoords(PlayerPedId(), coords.x, coords.y, coords.z, 0, 0, GetEntityHeading(targetPed), false)
    end
  end
  cb({ ok = true })
end)

RegisterNUICallback('teleportPlayerToMe', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  local coords = GetEntityCoords(PlayerPedId(), true)
  TriggerServerEvent('EasyAdmin:TeleportPlayerToCoords', id, coords)
  cb({ ok = true })
end)

RegisterNUICallback('teleportAllPlayersToMe', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  -- Trigger server event with target = -1, meaning teleport everyone
  for i = 0, 256 do
    if NetworkIsPlayerActive(i) then
      local serverId = GetPlayerServerId(i)
      if serverId and serverId ~= PlayerId() then
        local coords = GetEntityCoords(PlayerPedId(), true)
        TriggerServerEvent('EasyAdmin:TeleportPlayerToCoords', serverId, coords)
      end
    end
  end
  toast('Teleported all players to you')
  cb({ ok = true })
end)

RegisterNUICallback('teleportMeBack', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  if lastLocation then
    SetEntityCoords(PlayerPedId(), lastLocation, 0, 0, 0, false)
    lastLocation = nil
    toast('Teleported back')
  else
    SendNUIMessage({
      action = 'notification',
      data = { text = 'No previous location saved', type = 'error' },
    })
  end
  cb({ ok = true })
end)

RegisterNUICallback('teleportPlayerBack', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:TeleportPlayerBack', id)
  cb({ ok = true })
end)

RegisterNUICallback('teleportIntoVehicle', function(data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  local playerPed = PlayerPedId()
  local coords = GetEntityCoords(playerPed, true)
  local vehicles = GetGamePool('CVehicle')
  local closestDistance = -1
  local closestVehicle = -1
  for _, vehicle in pairs(vehicles) do
    local vcoords = GetEntityCoords(vehicle, true)
    local distance = #(coords - vcoords)
    if closestDistance == -1 or closestDistance > distance then
      closestDistance = distance
      closestVehicle = vehicle
    end
  end
  if closestVehicle ~= -1 then
    for i = -1, GetVehicleMaxNumberOfPassengers(closestVehicle) do
      if IsVehicleSeatFree(closestVehicle, i) then
        SetPedIntoVehicle(playerPed, closestVehicle, i)
        break
      end
    end
    toast('Placed into vehicle')
  else
    SendNUIMessage({
      action = 'notification',
      data = { text = 'No vehicles found nearby', type = 'error' },
    })
  end
  cb({ ok = true })
end)

RegisterNUICallback('joinPlayerBucket', function(data, cb)
  if not permissions['player.bucket.join'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:JoinPlayerRoutingBucket', id)
  cb({ ok = true })
end)

RegisterNUICallback('forcePlayerBucket', function(data, cb)
  if not permissions['player.bucket.force'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  TriggerServerEvent('EasyAdmin:ForcePlayerRoutingBucket', id)
  cb({ ok = true })
end)

RegisterNUICallback('requestCachedPlayers', function(_data, cb)
  TriggerServerEvent('EasyAdmin:requestCachedPlayers')
  -- Cached player data arrives via the 'updateCachedPlayers' NUI event
  -- (see events.lua fillCachedPlayers handler)
  cb({ ok = true })
end)

---Lazy-load identifiers for a player detail view.
---Result is pushed via 'playerIdentifiers' NUI event.
RegisterNUICallback('getPlayerIdentifiers', function(data, cb)
  local id = tonumber(data and data.id)
  if not id then return cb({ error = 'Missing player id' }) end
  TriggerServerEvent('EasyAdmin:getPlayerIdentifiers', id)
  -- Result arrives asynchronously via the 'playerIdentifiers' NUI event.
  cb({ ok = true })
end)

---Fetch avatars for all online players.
---Each avatar is pushed individually via 'playerUpdated' NUI events.
RegisterNUICallback('fetchPlayerAvatars', function(_data, cb)
  TriggerServerEvent('EasyAdmin:fetchPlayerAvatars')
  cb({ ok = true })
end)

---Request action history for a player.
---Result is pushed asynchronously via 'actionHistory' NUI event.
RegisterNUICallback('getActionHistory', function(data, cb)
  local id = tonumber(data and data.id)
  if not id then return cb({ error = 'Missing player id' }) end
  TriggerServerEvent('EasyAdmin:GetActionHistory', id)
  cb({ ok = true })
end)

---Request admin notes for a player.
---Result is pushed asynchronously via 'adminNotes' NUI event.
RegisterNUICallback('getAdminNotes', function(data, cb)
  local id = tonumber(data and data.id)
  if not id then return cb({ error = 'Missing player id' }) end
  TriggerServerEvent('EasyAdmin:GetAdminNotes', id)
  cb({ ok = true })
end)

---Add an admin note for a player.
RegisterNUICallback('addAdminNote', function(data, cb)
  if not permissions['player.adminnotes.add'] then return deny(cb) end
  local id = tonumber(data and data.id)
  if not id then return deny(cb, 'Missing player id') end
  local note = data and data.note
  if not note or note == '' then return deny(cb, 'Note is empty') end
  TriggerServerEvent('EasyAdmin:AddAdminNote', note, id)
  -- Refresh notes after adding
  TriggerServerEvent('EasyAdmin:GetAdminNotes', id)
  toast('Admin note added')
  cb({ ok = true })
end)

---Delete an admin note.
RegisterNUICallback('deleteAdminNote', function(data, cb)
  if not permissions['player.adminnotes.delete'] then return deny(cb) end
  local noteId = tonumber(data and data.id)
  if not noteId then return deny(cb, 'Missing note id') end
  TriggerServerEvent('EasyAdmin:DeleteAdminNote', noteId)
  -- Refresh notes after deleting
  local playerId = tonumber(data and data.playerId)
  if playerId then
    TriggerServerEvent('EasyAdmin:GetAdminNotes', playerId)
  end
  toast('Admin note deleted')
  cb({ ok = true })
end)

---Delete an action history entry.
RegisterNUICallback('deleteActionHistoryEntry', function(data, cb)
  if not permissions['player.actionhistory.delete'] then return deny(cb) end
  local actionId = tonumber(data and data.id)
  if not actionId then return deny(cb, 'Missing action id') end
  TriggerServerEvent('EasyAdmin:DeleteAction', actionId)
  -- Refresh action history after deleting
  local playerId = tonumber(data and data.playerId)
  if playerId then
    TriggerServerEvent('EasyAdmin:GetActionHistory', playerId)
  end
  toast('Action history entry deleted')
  cb({ ok = true })
end)
