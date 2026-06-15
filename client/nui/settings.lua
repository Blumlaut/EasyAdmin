------------------------------------
-- EasyAdmin NUI: settings
-- Kvp persistence, anonymous, tts, refresh actions
------------------------------------

local function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end

RegisterNUICallback('setAnonymous', function(data, cb)
  if not permissions['anon'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:SetAnonymous', data and data.value == true)
  cb({ ok = true })
end)

RegisterNUICallback('setTtsEnabled', function(data, cb)
  local value = data and data.value == true
  SetResourceKvpInt('ea_tts_enabled', value and 1 or 0)
  SendNUIMessage({
    action = 'toggle_speak',
    enabled = value,
    rate = GetResourceKvpInt('ea_tts_speed') or 4,
  })
  cb({ ok = true })
end)

RegisterNUICallback('setTtsSpeed', function(data, cb)
  local speed = tonumber(data and data.value) or 4
  SetResourceKvpInt('ea_tts_speed', speed)
  SendNUIMessage({ action = 'speak_rate', rate = speed })
  cb({ ok = true })
end)

RegisterNUICallback('setEasterEgg', function(data, cb)
  local value = data and data.value
  if value and value ~= '' then
    SetResourceKvp('ea_overrideEgg', value)
  else
    DeleteResourceKvp('ea_overrideEgg')
  end
  cb({ ok = true })
end)

RegisterNUICallback('setShowLicenses', function(data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  local value = data and data.value == true
  SetResourceKvp('ea_showLicenses', value and 'true' or 'false')
  cb({ ok = true })
end)

RegisterNUICallback('refreshBanList', function(data, cb)
  if not permissions['player.ban.view'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:updateBanlist')
  -- Wait for the latent event to fill banlist, then send to NUI
  local waitTime = 0
  repeat Wait(50) waitTime = waitTime + 1
  until waitTime > 60
  cb({ ok = true })
end)

RegisterNUICallback('refreshCachedPlayers', function(data, cb)
  TriggerServerEvent('EasyAdmin:requestCachedPlayers')
  -- Wait for the latent event to fill cachedplayers, then send to NUI
  local waitTime = 0
  repeat Wait(50) waitTime = waitTime + 1
  until waitTime > 60
  cb({ ok = true })
end)

RegisterNUICallback('refreshPermissions', function(data, cb)
  TriggerServerEvent('EasyAdmin:amiadmin')
  cb({ ok = true })
end)
