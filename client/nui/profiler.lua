------------------------------------
-- EasyAdmin NUI: Profiler
-- NUI callbacks for profiler + event relay from server
------------------------------------

-- Pending callback for async profile capture
local pendingProfilerCb = nil

-- Start profiler recording
RegisterNUICallback('startProfiler', function(data, cb)
  cb({ ok = true }) -- Acknowledge immediately, result comes via push

  local endpoint = GetCurrentServerEndpoint() -- "192.168.178.23:30120"
  local port = nil
  if endpoint and endpoint ~= '' then
    port = tonumber(string.match(endpoint, ':(%d+)'))
  end

  TriggerServerEvent('EasyAdmin:startProfiler', {
    frames = data and data.frames or 50,
    port = port,
  })
end)

-- Fetch a code snippet for a thread row
RegisterNUICallback('profilerGetSnippet', function(data, cb)
  cb({ ok = true }) -- Result comes via push event

  TriggerServerEvent('EasyAdmin:profilerGetSnippet', {
    threadId = data and data.threadId,
    label = data and data.label,
  })
end)

-- ============================================================
-- Server -> Client event handlers (relay to NUI)
-- ============================================================

-- Progress updates during recording
RegisterNetEvent('EasyAdmin:profilerProgress', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerProgress',
      data = data,
    })
  end
end)

-- Final profile result
RegisterNetEvent('EasyAdmin:profilerResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerResult',
      data = data,
    })
  end
end)

-- Error during profiling
RegisterNetEvent('EasyAdmin:profilerError', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerError',
      data = data,
    })
  end
end)

-- Endpoint discovery failure
RegisterNetEvent('EasyAdmin:profilerEndpointError', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerEndpointError',
      data = data,
    })
  end
end)

-- Code snippet result
RegisterNetEvent('EasyAdmin:profilerSnippetResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerSnippetResult',
      data = data,
    })
  end
end)

-- Code snippet error
RegisterNetEvent('EasyAdmin:profilerSnippetError', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'profilerSnippetError',
      data = data,
    })
  end
end)
