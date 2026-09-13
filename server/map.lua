------------------------------------
-- Map page: position stream
--
-- Positions MUST be collected server-side: the server holds
-- OneSync-authoritative positions for every player ped, while a client
-- only has peds inside its own streaming range AND routing bucket.
-- A client-side read returns (0, 0, 0) for players the client cannot
-- stream, which would pin them to the map's origin.
------------------------------------

-- Interval between position updates (~2 Hz).
local MAP_STREAM_INTERVAL = 500

-- Admins with the Map page open: [src] = true
mapStreamTargets = {}

--- Collect authoritative positions for all connected players.
--- @param selfId number source of the requesting admin
--- @return table { players = { {id, x, y, z} ... }, selfId = number }
function CollectMapPositions(selfId)
  local positions = {}
  for _, src in ipairs(GetPlayers()) do
    local ped = GetPlayerPed(src)
    if ped and ped ~= 0 and DoesEntityExist(ped) then
      -- GetEntityCoords returns a vector3 table ({x, y, z}), not separate return values.
      -- GetPlayers() returns src as strings — normalise to number to match the NUI's Player.id.
      local coords = GetEntityCoords(ped)
      positions[#positions + 1] = { id = tonumber(src), x = coords.x, y = coords.y, z = coords.z }
    end
  end
  return { players = positions, selfId = selfId }
end

--- Start/stop the position stream for an admin.
function SetMapStreamTarget(src, active)
  if active then
    mapStreamTargets[src] = true
  else
    mapStreamTargets[src] = nil
  end
end

RegisterNetEvent('EasyAdmin:mapStream', function(active)
  local src = source
  if not DoesPlayerHavePermission(src, 'server.map.view') then return end
  SetMapStreamTarget(src, active == true)
end)

AddEventHandler('playerDropped', function()
  mapStreamTargets[source] = nil
end)

Citizen.CreateThread(function()
  while true do
    Citizen.Wait(MAP_STREAM_INTERVAL)
    for src in pairs(mapStreamTargets) do
      -- Drop stale targets (disconnected, or permission revoked while open).
      if not DoesPlayerExist(src) or not DoesPlayerHavePermission(src, 'server.map.view') then
        mapStreamTargets[src] = nil
      else
        TriggerClientEvent('EasyAdmin:updateMapPlayers', src, CollectMapPositions(src))
      end
    end
  end
end)
