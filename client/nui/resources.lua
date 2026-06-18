------------------------------------
-- EasyAdmin NUI: Resources
-- Async NUI callbacks that forward to server and relay results
------------------------------------

-- Pending callbacks for async operations
local pendingResourcesCb = nil
local pendingMetadataCb = nil
local pendingMetadataBatchCb = nil
local pendingUpdatesCb = nil

-- Resource list
RegisterNUICallback('requestResources', function(_data, cb)
  if pendingResourcesCb then
    pendingResourcesCb = cb
    return
  end
  pendingResourcesCb = cb
  TriggerServerEvent('EasyAdmin:requestResources')
end)

-- Single resource metadata
RegisterNUICallback('requestResourceMetadata', function(data, cb)
  if pendingMetadataCb then
    pendingMetadataCb = cb
    return
  end
  pendingMetadataCb = cb
  TriggerServerEvent('EasyAdmin:requestResourceMetadata', data and data.name)
end)

-- Batch metadata
RegisterNUICallback('requestResourceMetadataBatch', function(data, cb)
  if pendingMetadataBatchCb then
    pendingMetadataBatchCb = cb
    return
  end
  pendingMetadataBatchCb = cb
  TriggerServerEvent('EasyAdmin:requestResourceMetadataBatch', data and data.names)
end)

-- Start resource
RegisterNUICallback('startResource', function(data, cb)
  cb({ ok = true }) -- Acknowledge immediately, result comes via push
  TriggerServerEvent('EasyAdmin:startResource', data and data.name)
end)

-- Stop resource
RegisterNUICallback('stopResource', function(data, cb)
  cb({ ok = true }) -- Acknowledge immediately, result comes via push
  TriggerServerEvent('EasyAdmin:stopResource', data and data.name)
end)

-- Check for updates
RegisterNUICallback('checkResourceUpdates', function(data, cb)
  PrintDebugMessage('[NUI] checkResourceUpdates callback received, names: ' .. (data and json.encode(data.names) or 'nil'), 4)
  if pendingUpdatesCb then
    PrintDebugMessage('[NUI] checkResourceUpdates: pending callback already exists, overwriting', 4)
    pendingUpdatesCb = cb
    return
  end
  pendingUpdatesCb = cb
  TriggerServerEvent('EasyAdmin:checkResourceUpdates', data and data.names)
end)

-- ============================================================
-- Server -> Client event handlers
-- ============================================================

RegisterNetEvent('EasyAdmin:resourcesResult', function(data)
  if pendingResourcesCb then
    local cb = pendingResourcesCb
    pendingResourcesCb = nil
    cb(data or { resources = {}, protected = '' })
  end
  -- Also push to NUI for auto-refresh
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateResources',
      data = data or { resources = {}, protected = '' },
    })
  end
end)

RegisterNetEvent('EasyAdmin:resourceMetadataResult', function(data)
  if pendingMetadataCb then
    local cb = pendingMetadataCb
    pendingMetadataCb = nil
    cb(data or { metadata = nil })
  end
end)

RegisterNetEvent('EasyAdmin:resourceMetadataBatchResult', function(data)
  if pendingMetadataBatchCb then
    local cb = pendingMetadataBatchCb
    pendingMetadataBatchCb = nil
    cb(data or { metadata = {} })
  end
end)

RegisterNetEvent('EasyAdmin:resourceUpdatesResult', function(data)
  PrintDebugMessage('[NUI] resourceUpdatesResult event received, data: ' .. (data and json.encode(data) or 'nil'), 4)
  if pendingUpdatesCb then
    local cb = pendingUpdatesCb
    pendingUpdatesCb = nil
    cb(data or { updates = {} })
    PrintDebugMessage('[NUI] resourceUpdatesResult: callback resolved', 4)
  else
    PrintDebugMessage('[NUI] resourceUpdatesResult: no pending callback found!', 4)
  end
end)

-- Toast notifications from resource actions
RegisterNetEvent('EasyAdmin:resourceActionToast', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'notification',
      data = data or { text = '', type = 'info' },
    })
  end
end)
