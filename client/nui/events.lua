------------------------------------
-- EasyAdmin NUI: events
-- Wires server -> client events to NUI messages
------------------------------------

-- Mirror the server player list to the NUI when the menu is open.
RegisterNetEvent('EasyAdmin:GetInfinityPlayerList', function(_pl)
  if IsNuiVisible() then
    CreateThread(function()
      Wait(50)
      NuiSendPlayerData()
    end)
  end
end)

-- Push ban list to NUI when received from server (legacy, kept for backward compat).
RegisterNetEvent('EasyAdmin:fillBanlist', function(thebanlist)
  banlist = thebanlist
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateBanList',
      data = { bans = banlist or {} },
    })
  end
end)

-- Paginated ban page result — pushed to NUI for server-side pagination.
RegisterNetEvent('EasyAdmin:banPageResult', function(result)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'banPage',
      data = result or { bans = {}, total = 0, page = 1, pageSize = 10, totalPages = 1 },
    })
  end
end)

-- Full ban detail result — pushed to NUI for BanDetailPage.
RegisterNetEvent('EasyAdmin:banDetailResult', function(ban)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'banDetail',
      data = { ban = ban },
    })
  end
end)

-- Push cached players to NUI when received from server.
RegisterNetEvent('EasyAdmin:fillCachedPlayers', function(thecached)
  cachedplayers = thecached
  if IsNuiVisible() then
    local playerList = {}
    for id, player in pairs(cachedplayers or {}) do
      if player.dropped then
        table.insert(playerList, {
          id = player.id,
          name = player.name,
          identifier = (player.identifiers and player.identifiers[1]) or nil,
          droppedTime = player.droppedTime,
          immune = player.immune and true or false,
        })
      end
    end
    SendNUIMessage({
      action = 'updateCachedPlayers',
      data = { players = playerList },
    })
  end
end)

-- Push reports to NUI when received from server.
RegisterNetEvent('EasyAdmin:fillReports', function(theReports)
  reports = theReports
  if IsNuiVisible() then
    local reportList = {}
    for _, r in pairs(reports or {}) do
      table.insert(reportList, r)
    end
    SendNUIMessage({
      action = 'updateReports',
      data = { reports = reportList },
    })
  end
end)

-- Push new report to NUI.
RegisterNetEvent('EasyAdmin:NewReport', function(reportData)
  reports[reportData.id] = reportData
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateReports',
      data = { reports = _buildReportList() },
    })
  end
end)

-- Push claimed report update to NUI.
RegisterNetEvent('EasyAdmin:ClaimedReport', function(reportData)
  reports[reportData.id] = reportData
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateReports',
      data = { reports = _buildReportList() },
    })
  end
end)

-- Push removed report to NUI.
RegisterNetEvent('EasyAdmin:RemoveReport', function(reportData)
  reports[reportData.id] = nil
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateReports',
      data = { reports = _buildReportList() },
    })
  end
end)

-- Helper to build report list for NUI.
function _buildReportList()
  local rlist = {}
  for _, r in pairs(reports or {}) do
    table.insert(rlist, r)
  end
  return rlist
end

-- Forward reason shortcuts to the NUI.
RegisterNetEvent('EasyAdmin:fillShortcuts', function(shortcuts)
  MessageShortcuts = shortcuts
  if IsNuiVisible() then
    -- Convert Lua table to array of { key, value } for JS
    local shortcutList = {}
    for k, v in pairs(shortcuts or {}) do
      table.insert(shortcutList, { key = k, value = v })
    end
    SendNUIMessage({
      action = 'updateShortcuts',
      data = { shortcuts = shortcutList },
    })
  end
end)

-- Push frozen/muted state to the NUI.
RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(playerId, state)
  FrozenPlayers[playerId] = state
  if IsNuiVisible() then NuiSendPlayerData() end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(playerId, state)
  MutedPlayers[playerId] = state
  if IsNuiVisible() then NuiSendPlayerData() end
end)

-- Cleanup focus on resource stop
AddEventHandler('onClientResourceStop', function(resource)
  if resource == GetCurrentResourceName() and IsNuiVisible() then
    SetNuiFocus(false, false)
  end
end)
