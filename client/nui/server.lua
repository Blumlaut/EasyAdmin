------------------------------------
-- EasyAdmin NUI: server
-- Announcements, resources, convars, cleanup
------------------------------------

RegisterNUICallback('announce', function(data, cb)
  if not permissions['server.announce'] then return deny(cb) end
  local message = data and data.message
  if not message or message == '' then return deny(cb, 'Empty message') end
  TriggerServerEvent('EasyAdmin:Announce', message)
  toast('Announcement sent')
  cb({ ok = true })
end)

RegisterNUICallback('setGameType', function(data, cb)
  if not permissions['server.convars'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:SetGameType', data and data.value or '')
  toast('Gametype updated')
  cb({ ok = true })
end)

RegisterNUICallback('setMapName', function(data, cb)
  if not permissions['server.convars'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:SetMapName', data and data.value or '')
  toast('Map name updated')
  cb({ ok = true })
end)

-- Resource management handlers moved to client/nui/resources.lua (async server-side pattern)

RegisterNUICallback('setConvar', function(data, cb)
  if not permissions['server.convars'] then return deny(cb) end
  if not data or not data.name or data.value == nil then
    return deny(cb, 'Missing name or value')
  end
  TriggerServerEvent('EasyAdmin:SetConvar', data.name, tostring(data.value), data.setType)
  toast('Set ' .. tostring(data.name))
  cb({ ok = true })
end)

-- Request known convars list with current values
local pendingConvarsCb = nil

RegisterNUICallback('requestConvars', function(_data, cb)
  if not permissions['server.convars'] then return deny(cb) end
  if pendingConvarsCb then
    pendingConvarsCb = cb
    return
  end
  pendingConvarsCb = cb
  TriggerServerEvent('EasyAdmin:requestConvars')
end)

RegisterNetEvent('EasyAdmin:convarsResult', function(data)
  if pendingConvarsCb then
    local cb = pendingConvarsCb
    pendingConvarsCb = nil
    cb(data or {})
  end
end)

-- Server info (gametype, mapname, hostname, maxClients, projectName)
local pendingServerInfoCb = nil

RegisterNUICallback('requestServerInfo', function(_data, cb)
  if not permissions['server.convars'] then return deny(cb) end
  if pendingServerInfoCb then
    pendingServerInfoCb = cb
    return
  end
  pendingServerInfoCb = cb
  TriggerServerEvent('EasyAdmin:requestServerInfo')
end)

RegisterNetEvent('EasyAdmin:serverInfoResult', function(data)
  if pendingServerInfoCb then
    local cb = pendingServerInfoCb
    pendingServerInfoCb = nil
    cb(data or {
      gametype = '',
      mapname = 'none',
      hostname = '',
      maxClients = '48',
      projectName = '',
    })
  end
end)

-- Emergency mode (global mute) toggle
RegisterNUICallback('toggleGlobalMute', function(data, cb)
  if not permissions['server.mute.global'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:ToggleGlobalMute')
  cb({ ok = true })
end)

RegisterNUICallback('requestCleanup', function(data, cb)
  local allowed = permissions['server.cleanup.cars']
    or permissions['server.cleanup.peds']
    or permissions['server.cleanup.props']
  if not allowed then return deny(cb) end
  local ctype = data and data.type
  local radius = data and data.radius
  local deep = data and data.deep
  TriggerServerEvent('EasyAdmin:requestCleanup', ctype, radius, deep)
  toast('Cleanup requested')
  cb({ ok = true })
end)

-- Server stats for dashboard
-- All stats come from the server; client just relays the response
local pendingStatsCb = nil

RegisterNUICallback('requestServerStats', function(_data, cb)
  if pendingStatsCb then
    -- Already a request in-flight, reuse the callback
    pendingStatsCb = cb
    return
  end
  pendingStatsCb = cb
  TriggerServerEvent('EasyAdmin:requestServerStats')
end)

-- Server responds with full stats (maxPlayers, resources, entities)
RegisterNetEvent('EasyAdmin:serverStatsResult', function(data)
  if pendingStatsCb then
    local cb = pendingStatsCb
    pendingStatsCb = nil
    cb(data or {
      maxPlayers = 48,
      resources = { total = 0, started = 0, stopped = 0 },
      entities = { vehicles = 0, peds = 0, objects = 0 },
    })
  end
end)

-- Player history for dashboard sparkline
local pendingHistoryCb = nil

RegisterNUICallback('requestPlayerHistory', function(data, cb)
  if pendingHistoryCb then
    pendingHistoryCb = cb
    return
  end
  pendingHistoryCb = cb
  TriggerServerEvent('EasyAdmin:requestPlayerHistory', data and data.range or '24h')
end)

RegisterNetEvent('EasyAdmin:playerHistoryResult', function(data)
  if pendingHistoryCb then
    local cb = pendingHistoryCb
    pendingHistoryCb = nil
    cb(data or {})
  end
end)

-- Network statistics
local pendingNetworkCb = nil

RegisterNUICallback('requestNetworkStats', function(data, cb)
  if pendingNetworkCb then
    pendingNetworkCb = cb
    return
  end
  pendingNetworkCb = cb
  TriggerServerEvent('EasyAdmin:requestNetworkStats', data)
end)

RegisterNetEvent('EasyAdmin:networkStatsResult', function(data)
  if pendingNetworkCb then
    local cb = pendingNetworkCb
    pendingNetworkCb = nil
    cb(data or {
      players = {},
      names = {},
      history = nil,
    })
  end
end)
