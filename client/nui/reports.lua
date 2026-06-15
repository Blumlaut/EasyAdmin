------------------------------------
-- EasyAdmin NUI: reports
-- Report viewer (claim, close, close similar)
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
  requestReports = function(_data, cb)
    if not permissions['player.reports.view'] then return deny(cb) end
    -- The reports map is mirrored from server into the `reports` global in
    -- admin_client.lua. We don't have a `GetReports` net event today, so we
    -- ask the server to push the list to us via the existing flow.
    TriggerServerEvent('EasyAdmin:requestReports')
    cb({ ok = true })
  end,

  getReportById = function(data, cb)
    local id = tonumber(data and data.id)
    if not id or not permissions['player.reports.view'] then return deny(cb) end
    local report = nil
    for _, r in pairs(reports or {}) do
      if r.id == id then report = r; break end
    end
    if report then
      cb({ report = report })
    else
      cb({ report = nil })
    end
  end,

  claimReport = function(data, cb)
    if not permissions['player.reports.claim'] then return deny(cb) end
    local id = tonumber(data and data.id)
    if not id then return deny(cb, 'Missing report id') end
    TriggerServerEvent('EasyAdmin:ClaimReport', id)
    toast('Report claimed')
    cb({ ok = true })
  end,

  closeReport = function(data, cb)
    if not permissions['player.reports.process'] then return deny(cb) end
    local id = tonumber(data and data.id)
    if not id then return deny(cb, 'Missing report id') end
    TriggerServerEvent('EasyAdmin:RemoveReport', { id = id })
    toast('Report closed')
    cb({ ok = true })
  end,

  closeSimilarReports = function(data, cb)
    if not permissions['player.reports.process'] then return deny(cb) end
    local id = tonumber(data and data.id)
    if not id then return deny(cb, 'Missing report id') end
    TriggerServerEvent('EasyAdmin:RemoveSimilarReports', { id = id })
    toast('Similar reports closed')
    cb({ ok = true })
  end,
}

return M
