------------------------------------
-- EasyAdmin: Dashboard server stats
-- Provides entity counts, resource stats, and player count history
------------------------------------

-- ============================================================
-- Player count history
-- ============================================================

-- In-memory cache of player count snapshots
-- Each entry: { timestamp (unix epoch seconds), count (number) }
local playerHistory = {}
local historyFile = 'data/player_history.json'

-- Retention: 7 days in seconds
local HISTORY_RETENTION = 7 * 86400
-- Sampling interval: 15 minutes in seconds
local HISTORY_INTERVAL = 900

-- Load history from disk on startup
local function loadHistory()
  local data = LoadResourceFile(GetCurrentResourceName(), historyFile)
  if data then
    local decoded = json.decode(data)
    if type(decoded) == 'table' then
      playerHistory = decoded
    end
  end
end

-- Save history to disk
local function saveHistory()
  local encoded = json.encode(playerHistory)
  if encoded then
    local success = SaveResourceFile(GetCurrentResourceName(), historyFile, encoded, -1)
    if not success then
      print('[EasyAdmin] Failed to save player history')
    end
  end
end

-- Prune entries older than 7 days
local function pruneHistory()
  local now = os.time()
  local cutoff = now - HISTORY_RETENTION
  local pruned = false
  for i = #playerHistory, 1, -1 do
    if playerHistory[i].timestamp < cutoff then
      table.remove(playerHistory, i)
      pruned = true
    else
      -- History is oldest-first, so once we hit recent entries we can stop
      break
    end
  end
  return pruned
end

-- Record current player count
local function recordPlayerCount()
  local count = #GetPlayers()
  local now = os.time()

  -- Avoid duplicate entries within a 1-minute window
  local last = playerHistory[#playerHistory]
  if last and now - last.timestamp < 60 then
    return
  end

  table.insert(playerHistory, { timestamp = now, count = count })

  -- Prune old data
  if pruneHistory() then
    saveHistory()
  end
end

-- Periodic recording thread
CreateThread(function()
  while true do
    Wait(HISTORY_INTERVAL * 1000) -- 15 minutes
    recordPlayerCount()
  end
end)

-- Save on resource stop
AddEventHandler('onServerResourceStop', function(resource)
  if resource == GetCurrentResourceName() then
    saveHistory()
  end
end)

-- Load history on startup
loadHistory()

-- Record initial count
recordPlayerCount()

-- ============================================================
-- Server events
-- ============================================================

RegisterServerEvent('EasyAdmin:requestServerStats', function()
  local src = source
  local maxPlayers = tonumber(GetConvar('sv_maxClients', '48')) or 48

  -- Resource stats
  local resourceCount = GetNumResources() - 1
  local started = 0
  local stopped = 0
  for i = 0, resourceCount - 1 do
    local name = GetResourceByFindIndex(i)
    if name then
      local state = GetResourceState(name)
      if state == 'started' then
        started = started + 1
      else
        stopped = stopped + 1
      end
    end
  end

  -- Entity counts (server-side only - GetAll* returns a table on the server)
  local vehicles = #GetAllVehicles()
  local peds = #GetAllPeds()
  local objects = #GetAllObjects()

  TriggerClientEvent('EasyAdmin:serverStatsResult', src, {
    maxPlayers = maxPlayers,
    resources = {
      total = resourceCount,
      started = started,
      stopped = stopped,
    },
    entities = {
      vehicles = vehicles,
      peds = peds,
      objects = objects,
    },
  })
end)

RegisterServerEvent('EasyAdmin:requestPlayerHistory', function(range)
  local src = source
  local now = os.time()
  local cutoff

  -- Parse range: '1h', '6h', '24h', '7d'
  if range == '1h' then
    cutoff = now - 3600
  elseif range == '6h' then
    cutoff = now - 21600
  elseif range == '24h' then
    cutoff = now - 86400
  elseif range == '7d' then
    cutoff = now - HISTORY_RETENTION
  else
    cutoff = now - 86400 -- default to 24h
  end

  -- Filter history to requested range
  local result = {}
  for _, entry in ipairs(playerHistory) do
    if entry.timestamp >= cutoff then
      table.insert(result, entry)
    end
  end

  -- If no data in range, include current player count
  if #result == 0 then
    table.insert(result, { timestamp = now, count = #GetPlayers() })
  end

  TriggerClientEvent('EasyAdmin:playerHistoryResult', src, result)
end)
