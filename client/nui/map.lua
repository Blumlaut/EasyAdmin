------------------------------------
-- EasyAdmin NUI: map
--
-- Bridges the Map page to the server-side position stream.
-- Positions are collected on the server (see server/map.lua): the server
-- holds OneSync-authoritative positions for every player, while a client
-- only has peds inside its own streaming range AND routing bucket, so a
-- client-side read would miss (or zero) players the client can't stream.
------------------------------------

local mapStreamRequested = false -- Map page mounted in the NUI
local mapStreamActive = false -- stream actually running on the server

local function syncMapStream()
  -- Only stream while the page is open AND the menu is visible.
  local shouldStream = mapStreamRequested and IsNuiVisible()
  if shouldStream == mapStreamActive then return end
  mapStreamActive = shouldStream
  TriggerServerEvent('EasyAdmin:mapStream', shouldStream)
end

RegisterNUICallback('setMapStream', function(data, cb)
  if not permissions['server.map.view'] then
    return deny(cb, 'Permission denied')
  end
  mapStreamRequested = data and data.active == true
  syncMapStream()
  cb({ ok = true })
end)

-- Keep the stream in sync with menu visibility (open/close/fold).
CreateThread(function()
  while true do
    Wait(250)
    syncMapStream()
  end
end)

-- Forward the server's position updates to the NUI (~2 Hz).
RegisterNetEvent('EasyAdmin:updateMapPlayers', function(data)
  SendNUIMessage({ action = 'updateMapPlayers', data = data })
end)

-- Teleport the admin to a map-clicked coordinate. The NUI converts Leaflet
-- lat/lng to approximate game-world x/y; the server validates and the
-- client resolves the ground Z before moving the ped.
RegisterNUICallback('teleportToMapCoords', function(data, cb)
  if not permissions['player.teleport.single'] then
    return deny(cb, 'Permission denied')
  end
  local x = tonumber(data and data.x)
  local y = tonumber(data and data.y)
  if not x or not y then
    return deny(cb, 'Invalid coordinates')
  end
  TriggerServerEvent('EasyAdmin:TeleportAdminToCoords', x, y)
  cb({ ok = true })
end)
