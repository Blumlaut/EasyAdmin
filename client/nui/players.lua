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
  local id = tonumber(data and data.id)
  local reason = (data and data.reason) or 'No reason'
  if not id or not permissions['player.kick'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:kickPlayer', id, reason)
  toast('Kicked ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('banPlayer', function(data, cb)
  local id = tonumber(data and data.id)
  local reason = (data and data.reason) or 'No reason'
  local duration = tonumber(data and data.duration) or 86400
  if not id or not (permissions['player.ban.temporary'] or permissions['player.ban.permanent']) then
    return deny(cb)
  end
  local name = 'Unknown'
  if playerlist then
    for _, p in pairs(playerlist) do
      if p.id == id then name = p.name; break end
    end
  end
  TriggerServerEvent('EasyAdmin:banPlayer', id, reason, duration, name)
  toast('Banned ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('warnPlayer', function(data, cb)
  local id = tonumber(data and data.id)
  local reason = (data and data.reason) or 'No reason'
  if not id or not permissions['player.warn'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:warnPlayer', id, reason)
  toast('Warned ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('slapPlayer', function(data, cb)
  local id = tonumber(data and data.id)
  local amount = tonumber(data and data.amount) or 200
  if not id or not permissions['player.slap'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:SlapPlayer', id, amount)
  cb({ ok = true })
end)

RegisterNUICallback('spectatePlayer', function(data, cb)
  local id = tonumber(data and data.id)
  if not id or not permissions['player.spectate'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:requestSpectate', id)
  cb({ ok = true })
end)

RegisterNUICallback('toggleFreeze', function(data, cb)
  local id = tonumber(data and data.id)
  local freeze = data and (data.freeze ~= nil and data.freeze or data.freeze == nil)
  if not id or not permissions['player.freeze'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:FreezePlayer', id, freeze == true)
  cb({ ok = true })
end)

RegisterNUICallback('toggleMute', function(data, cb)
  local id = tonumber(data and data.id)
  local mute = data and data.mute
  if not id or not permissions['player.mute'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:mutePlayer', id)
  cb({ ok = true })
end)

RegisterNUICallback('screenshotPlayer', function(data, cb)
  local id = tonumber(data and data.id)
  if not id or not permissions['player.screenshot'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:TakeScreenshot', id)
  cb({ ok = true })
end)

RegisterNUICallback('teleportToPlayer', function(data, cb)
  local id = tonumber(data and data.id)
  if not id or not permissions['player.teleport.single'] then return deny(cb) end
  if settings.infinity then
    TriggerServerEvent('EasyAdmin:TeleportAdminToPlayer', id)
  else
    local playerPed = PlayerPedId()
    local targetPed = GetPlayerPed(GetPlayerFromServerId(id))
    if targetPed and targetPed ~= 0 then
      local x, y, z = table.unpack(GetEntityCoords(targetPed, true))
      local heading = GetEntityHeading(targetPed)
      lastLocation = GetEntityCoords(playerPed)
      SetEntityCoords(playerPed, x, y, z, 0, 0, heading, false)
    end
  end
  toast('Teleported to ' .. tostring(id))
  cb({ ok = true })
end)

RegisterNUICallback('teleportPlayerToMe', function(data, cb)
  local id = tonumber(data and data.id)
  if not id or not permissions['player.teleport.single'] then return deny(cb) end
  local coords = GetEntityCoords(PlayerPedId(), true)
  TriggerServerEvent('EasyAdmin:TeleportPlayerToCoords', id, coords)
  toast('Teleported player ' .. tostring(id) .. ' to you')
  cb({ ok = true })
end)

RegisterNUICallback('teleportMeBack', function(_data, cb)
  if not permissions['player.teleport.single'] then return deny(cb) end
  if lastLocation then
    local playerPed = PlayerPedId()
    SetEntityCoords(playerPed, lastLocation, 0, 0, 0, false)
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
  local id = tonumber(data and data.id)
  if not id or not permissions['player.teleport.single'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:TeleportPlayerBack', id)
  cb({ ok = true })
end)

RegisterNUICallback('teleportIntoVehicle', function(_data, cb)
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
  local id = tonumber(data and data.id)
  if not id or not permissions['player.bucket.join'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:JoinPlayerRoutingBucket', id)
  toast('Joined bucket')
  cb({ ok = true })
end)

RegisterNUICallback('forcePlayerBucket', function(data, cb)
  local id = tonumber(data and data.id)
  if not id or not permissions['player.bucket.force'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:ForcePlayerRoutingBucket', id)
  toast('Forced into your bucket')
  cb({ ok = true })
end)

RegisterNUICallback('requestCachedPlayers', function(_data, cb)
  TriggerServerEvent('EasyAdmin:requestCachedPlayers')
  cb({ ok = true })
end)
