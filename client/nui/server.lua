------------------------------------
-- EasyAdmin NUI: server
-- Announcements, resources, convars, cleanup
------------------------------------

local M = {}

local function toast(text, kind)
  SendNUIMessage({
    action = 'notification',
    data = { text = text, type = kind or 'success' },
  })
end

local function deny(cb, msg)
  cb({ error = msg or 'Permission denied' })
end

M.callbacks = {
  announce = function(data, cb)
    if not permissions['server.announce'] then return deny(cb) end
    local message = data and data.message
    if not message or message == '' then return deny(cb, 'Empty message') end
    TriggerServerEvent('EasyAdmin:Announce', message)
    toast('Announcement sent')
    cb({ ok = true })
  end,

  setGameType = function(data, cb)
    if not permissions['server.convars'] then return deny(cb) end
    TriggerServerEvent('EasyAdmin:SetGameType', data and data.value or '')
    toast('Gametype updated')
    cb({ ok = true })
  end,

  setMapName = function(data, cb)
    if not permissions['server.convars'] then return deny(cb) end
    TriggerServerEvent('EasyAdmin:SetMapName', data and data.value or '')
    toast('Map name updated')
    cb({ ok = true })
  end,

  startResource = function(data, cb)
    if not permissions['server.resources.start'] then return deny(cb) end
    local name = data and data.name
    if not name or name == '' then return deny(cb, 'Missing resource name') end
    TriggerServerEvent('EasyAdmin:StartResource', name)
    toast('Started ' .. name)
    cb({ ok = true })
  end,

  stopResource = function(data, cb)
    if not permissions['server.resources.stop'] then return deny(cb) end
    local name = data and data.name
    if not name or name == '' then return deny(cb, 'Missing resource name') end
    if name == GetCurrentResourceName() then
      SendNUIMessage({
        action = 'notification',
        data = { text = 'You cannot stop EasyAdmin itself', type = 'error' },
      })
      return cb({ error = 'Self-stop blocked' })
    end
    TriggerServerEvent('EasyAdmin:StopResource', name)
    toast('Stopped ' .. name)
    cb({ ok = true })
  end,

  setConvar = function(data, cb)
    if not permissions['server.convars'] then return deny(cb) end
    if not data or not data.name or data.value == nil then
      return deny(cb, 'Missing name or value')
    end
    TriggerServerEvent('EasyAdmin:SetConvar', data.name, tostring(data.value))
    toast('Set ' .. tostring(data.name))
    cb({ ok = true })
  end,

  requestCleanup = function(data, cb)
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
  end,
}

return M
