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

-- Push player identifiers to NUI for the detail page.
RegisterNetEvent('EasyAdmin:playerIdentifiersResult', function(playerId, identifiers)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'playerIdentifiers',
      data = { id = playerId, identifiers = identifiers or {} },
    })
  end
end)

-- Push player avatar to NUI (merged via playerUpdated handler).
RegisterNetEvent('EasyAdmin:playerAvatarResult', function(playerId, avatar)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'playerUpdated',
      data = { id = playerId, avatar = avatar },
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

-- ============================================================
-- Statistics: forward server results to NUI
-- ============================================================

RegisterNetEvent('EasyAdmin:statsSummaryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'statsSummary',
      data = data or {},
    })
  end
end)

RegisterNetEvent('EasyAdmin:dailyPeaksResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'dailyPeaks',
      data = data or {},
    })
  end
end)

RegisterNetEvent('EasyAdmin:playerRegistryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'playerRegistry',
      data = data or {},
    })
  end
end)

---Paginated player registry result — pushed to NUI for server-side pagination.
RegisterNetEvent('EasyAdmin:playerRegistryPageResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'playerRegistryPage',
      data = data or { players = {}, total = 0, page = 1, pageSize = 20, totalPages = 1 },
    })
  end
end)

-- ============================================================
-- Action History: forward server result to NUI
-- ============================================================

RegisterNetEvent('EasyAdmin:ReceiveActionHistory', function(history, playerId)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'actionHistory',
      data = { id = playerId, entries = history or {} },
    })
  end
end)

-- ============================================================
-- Admin Notes: forward server result to NUI
-- ============================================================

RegisterNetEvent('EasyAdmin:ReceiveAdminNotes', function(notes, playerId)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'adminNotes',
      data = { id = playerId, entries = notes or {} },
    })
  end
end)

-- ============================================================
-- Update Info: forward server result to NUI
-- Pushed when checkVersion detects a new version, or on request.
-- ============================================================

RegisterNetEvent('EasyAdmin:updateInfo', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'updateInfo',
      data = data or { available = false },
    })
  end
end)

-- ============================================================
-- Name History & Aliases: forward server result to NUI
-- ============================================================

RegisterNetEvent('EasyAdmin:ReceivePlayerNameHistory', function(data, playerId)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'playerNameHistory',
      data = {
        id = playerId,
        nameHistory = data and data.nameHistory or {},
        aliases = data and data.aliases or {},
        currentName = data and data.currentName or 'Unknown',
      },
    })
  end
end)

-- ============================================================
-- Server Metrics: forward server results to NUI
-- ============================================================

RegisterNetEvent('EasyAdmin:osInfoResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'osInfo',
      data = data or {},
    })
  end
end)

RegisterNetEvent('EasyAdmin:cpuHistoryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'cpuHistory',
      data = data or { snapshots = {}, coreCount = 1 },
    })
  end
end)

RegisterNetEvent('EasyAdmin:memoryHistoryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'memoryHistory',
      data = data or { snapshots = {}, current = nil },
    })
  end
end)

RegisterNetEvent('EasyAdmin:diskHistoryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'diskHistory',
      data = data or { snapshots = {}, current = nil },
    })
  end
end)

RegisterNetEvent('EasyAdmin:networkHistoryResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'networkHistory',
      data = data or { snapshots = {}, current = nil },
    })
  end
end)

RegisterNetEvent('EasyAdmin:processesResult', function(data)
  if IsNuiVisible() then
    SendNUIMessage({
      action = 'processes',
      data = data or { processes = {} },
    })
  end
end)
