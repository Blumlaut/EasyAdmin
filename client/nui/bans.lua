------------------------------------
-- EasyAdmin NUI: bans
-- Ban list viewing, editing, unbanning
------------------------------------

RegisterNUICallback('requestBanList', function(_data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:requestBanlist')
  -- Response only acknowledges the request. Ban list data arrives
  -- via the 'updateBanList' NUI event (see events.lua fillBanlist handler).
  cb({ ok = true })
end)

RegisterNUICallback('refreshBanList', function(_data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:updateBanlist')
  -- Response only acknowledges the request. Updated ban list data
  -- arrives via the 'updateBanList' NUI event (see events.lua).
  cb({ ok = true })
end)

---Server-side paginated ban list request.
---NUI sends { page, pageSize, query }, result is pushed via 'banPage' NUI event.
RegisterNUICallback('requestBanPage', function(data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  local page = tonumber(data and data.page) or 1
  local pageSize = tonumber(data and data.pageSize) or 10
  local query = (data and data.query) and tostring(data.query) or nil
  TriggerServerEvent('EasyAdmin:requestBanPage', { page = page, pageSize = pageSize, query = query })
  -- Result arrives asynchronously via the 'banPage' NUI event (see events.lua).
  cb({ ok = true })
end)

---Fetch full ban details by ID from the server.
---Result is pushed via 'banDetail' NUI event.
RegisterNUICallback('getBanById', function(data, cb)
  local banid = data and data.banid
  if not banid or not permissions['player.ban.view'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:getBanById', tostring(banid))
  -- Result arrives asynchronously via the 'banDetail' NUI event (see events.lua).
  cb({ ok = true })
end)

RegisterNUICallback('editBan', function(data, cb)
  if not permissions['player.ban.edit'] then return deny(cb) end
  if not data or not data.banid then return deny(cb, 'Invalid ban data') end
  TriggerServerEvent('EasyAdmin:editBan', data)
  toast('Ban updated')
  cb({ ok = true })
end)

RegisterNUICallback('offlineBanPlayer', function(data, cb)
  -- Ban a cached (offline) player
  local id = tonumber(data and data.id)
  local reason = (data and data.reason) or 'No reason'
  local duration = tonumber(data and data.duration) or 86400
  if not id or not (permissions['player.ban.temporary'] or permissions['player.ban.permanent']) then
    return deny(cb)
  end
  local name = (data and data.name) or 'Unknown'
  TriggerServerEvent('EasyAdmin:offlinebanPlayer', id, reason, duration, name)
  toast('Banned ' .. name)
  cb({ ok = true })
end)

RegisterNUICallback('unbanPlayer', function(data, cb)
  if not permissions['player.ban.remove'] then return deny(cb) end
  local banid = data and data.banid
  if not banid then return deny(cb, 'Missing banid') end
  TriggerServerEvent('EasyAdmin:unbanPlayer', tonumber(banid))
  toast('Player unbanned')
  cb({ ok = true })
end)
