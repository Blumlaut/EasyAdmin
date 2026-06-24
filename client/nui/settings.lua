------------------------------------
-- EasyAdmin NUI: settings
-- Kvp persistence, anonymous, refresh actions
------------------------------------

local function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end

RegisterNUICallback('setAnonymous', function(data, cb)
  if not permissions['anon'] then return deny(cb) end
  TriggerServerEvent('EasyAdmin:SetAnonymous', data and data.value == true)
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
