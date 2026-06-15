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
  cb({ ok = true })
end)

RegisterNUICallback('refreshBanList', function(_data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:updateBanlist')
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

RegisterNUICallback('unbanPlayer', function(data, cb)
  if not permissions['player.ban.remove'] then return deny(cb) end
  local banid = data and data.banid
  if not banid then return deny(cb, 'Missing banid') end
  TriggerServerEvent('EasyAdmin:unbanPlayer', banid)
  toast('Player unbanned')
  cb({ ok = true })
end)
