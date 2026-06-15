------------------------------------
-- EasyAdmin NUI: bans
-- Ban list viewing, editing, unbanning
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

RegisterNUICallback('getBanById', function(data, cb)
  local banid = data and data.banid
  if not banid or not permissions['player.ban.view'] then return deny(cb) end
  local entry = nil
  for _, b in pairs(banlist or {}) do
    if tostring(b.banid) == tostring(banid) then
      entry = b
      break
    end
  end
  if entry then
    cb({ ban = entry })
  else
    cb({ ban = nil })
  end
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
