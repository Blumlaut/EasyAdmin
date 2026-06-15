------------------------------------
-- EasyAdmin NUI: settings
-- Kvp persistence, anonymous, tts
------------------------------------

local M = {}

local function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end

M.callbacks = {
  setAnonymous = function(data, cb)
    if not permissions['anon'] then return deny(cb) end
    TriggerServerEvent('EasyAdmin:SetAnonymous', data and data.value == true)
    cb({ ok = true })
  end,

  setTtsEnabled = function(data, cb)
    local value = data and data.value == true
    SetResourceKvpInt('ea_tts', value and 1 or 0)
    SendNUIMessage({
      action = 'toggle_speak',
      enabled = value,
      rate = GetResourceKvpInt('ea_ttsspeed') or 4,
    })
    cb({ ok = true })
  end,

  setTtsSpeed = function(data, cb)
    local speed = tonumber(data and data.value) or 4
    SetResourceKvpInt('ea_ttsspeed', speed)
    SendNUIMessage({ action = 'speak_rate', rate = speed })
    cb({ ok = true })
  end,

  setEasterEgg = function(data, cb)
    local value = data and data.value
    if value and value ~= '' then
      SetResourceKvp('ea_overrideEgg', value)
    else
      DeleteResourceKvp('ea_overrideEgg')
    end
    cb({ ok = true })
  end,

  setShowLicenses = function(data, cb)
    if not permissions['player.ban.view'] then return deny(cb) end
    local value = data and data.value == true
    SetResourceKvp('ea_showLicenses', value and 'true' or 'false')
    cb({ ok = true })
  end,
}

return M
