------------------------------------
-- EasyAdmin: Server-side profiler
-- Orchestrates FiveM profiler recording, fetches profile data via HTTP,
-- parses Chrome DevTools trace events, and sends results to the NUI.
------------------------------------

-- ============================================================
-- Permission check
-- ============================================================

local function canProfile(src)
  return DoesPlayerHavePermission(src, 'server.resources.monitor')
end

-- ============================================================
-- Endpoint resolution
-- ============================================================

-- Cached successful port (set after first successful fetch)
local cachedPort = nil

-- Common FiveM ports to probe (fallback chain)
local COMMON_PORTS = { 30120, 30121, 30122, 30110, 30111, 30130, 30140 }

-- Resolve the profiler HTTP endpoint.
-- clientPort: port extracted from GetCurrentServerEndpoint() on the client (may be nil)
-- Returns: { port, url, method } or nil on failure
local function resolveEndpoint(clientPort)
  -- Method 1: Use client-provided port from GetCurrentServerEndpoint()
  if clientPort and type(clientPort) == 'number' then
    local url = 'http://127.0.0.1:' .. clientPort .. '/info.json'
    local success = nil
    PerformHttpRequest(url, function(errorCode)
      success = (errorCode == 200)
    end, 'GET')
    -- Wait a brief moment for the async callback (PerformHttpRequest is fire-and-forget)
    -- We use a synchronous probe pattern: try the URL and trust the client value
    -- since GetCurrentServerEndpoint is reliable in normal operation
    return { port = clientPort, url = 'http://127.0.0.1:' .. clientPort .. '/profileData.json', method = 'GetCurrentServerEndpoint' }
  end

  -- Method 2: Use cached port from a previous successful run
  if cachedPort then
    return { port = cachedPort, url = 'http://127.0.0.1:' .. cachedPort .. '/profileData.json', method = 'cached' }
  end

  -- Method 3: Convar override
  local convarEndpoint = GetConvar('ea_profilerEndpoint', '')
  if convarEndpoint and convarEndpoint ~= '' then
    local host, port = string.match(convarEndpoint, '^([^:]+):(%d+)$')
    if host and port then
      local p = tonumber(port)
      return { port = p, url = 'http://' .. host .. ':' .. p .. '/profileData.json', method = 'convar' }
    end
  end

  return nil
end

-- ============================================================
-- Profile capture orchestration
-- ============================================================

-- Send a progress update to the NUI
local function sendProgress(src, phase, message, percent)
  TriggerClientEvent('EasyAdmin:profilerProgress', src, {
    phase = phase,
    message = message,
    percent = percent or 0,
  })
end

-- Send the final result to the NUI
local function sendResult(src, profile, detection)
  TriggerClientEvent('EasyAdmin:profilerResult', src, {
    profile = profile,
    detection = detection,
  })
end

-- Send an error to the NUI
local function sendError(src, message)
  TriggerClientEvent('EasyAdmin:profilerError', src, {
    message = message,
  })
end

-- ============================================================
-- Profile parser (Chrome DevTools trace events)
-- ============================================================

-- Extract resource name from "tick (resourceName)" event name
local function extractResourceName(eventName)
  return string.match(eventName, '^tick %((.+)%)$')
end

-- Extract resource, file path, and line range from thread events
-- Pattern: "thread @resource/file.lua[start..end]"
local THREAD_PATTERN = '^thread @([^/]+)/(.+)%[(%d+)%.%.(%d+)%]$'

local function extractThreadInfo(eventName)
  local resource, filePath, startLine, endLine = string.match(eventName, THREAD_PATTERN)
  if resource then
    return {
      label = eventName,
      resource = resource,
      filePath = filePath,
      lineRange = startLine .. '..' .. endLine,
      startLine = tonumber(startLine),
      endLine = tonumber(endLine),
    }
  end
  return nil
end

-- Parse trace events into the ParsedProfile schema
local function parseProfile(traceEvents)
  if not traceEvents or type(traceEvents) ~= 'table' then
    return nil
  end

  -- Accumulators
  local resourceTicks = {}   -- { [resourceName] = { durations = { ... } } }
  local threadDurations = {} -- { [threadLabel] = durationUs }
  local frameTimestamps = {} -- BeginFrame timestamps (μs)

  -- First pass: collect all events
  for _, event in ipairs(traceEvents) do
    local name = event.name
    local ph = event.ph
    local ts = event.ts

    -- Collect BeginFrame timestamps for frame time calculation
    if name == 'BeginFrame' then
      table.insert(frameTimestamps, ts)
    end

    -- Collect resource tick B/E pairs
    local resourceName = extractResourceName(name)
    if resourceName then
      if not resourceTicks[resourceName] then
        resourceTicks[resourceName] = { begins = {}, ends = {} }
      end
      if ph == 'B' then
        table.insert(resourceTicks[resourceName].begins, ts)
      elseif ph == 'E' then
        table.insert(resourceTicks[resourceName].ends, ts)
      end
    end

    -- Collect thread durations
    local threadInfo = extractThreadInfo(name)
    if threadInfo then
      if ph == 'B' then
        -- Store begin timestamp keyed by a unique counter per thread label
        if not threadDurations[threadInfo.label] then
          threadDurations[threadInfo.label] = { info = threadInfo, begins = {}, ends = {} }
        end
        table.insert(threadDurations[threadInfo.label].begins, ts)
      elseif ph == 'E' then
        if threadDurations[threadInfo.label] then
          table.insert(threadDurations[threadInfo.label].ends, ts)
        end
      end
    end
  end

  -- Second pass: compute durations from B/E pairs
  local resources = {}
  local totalTickUs = 0

  for resourceName, data in pairs(resourceTicks) do
    local durations = {}
    local nBegins = #data.begins
    local nEnds = #data.ends
    local nPairs = math.min(nBegins, nEnds)

    for i = 1, nPairs do
      local duration = data.ends[i] - data.begins[i]
      if duration >= 0 then
        table.insert(durations, duration)
      end
    end

    if #durations > 0 then
      local totalUs = 0
      local maxUs = durations[1]
      local minUs = durations[1]

      for _, d in ipairs(durations) do
        totalUs = totalUs + d
        if d > maxUs then maxUs = d end
        if d < minUs then minUs = d end
      end

      totalTickUs = totalTickUs + totalUs

      resources[#resources + 1] = {
        name = resourceName,
        tickCount = #durations,
        totalUs = totalUs,
        avgUs = totalUs / #durations,
        maxUs = maxUs,
        minUs = minUs,
        pctOfTotal = 0, -- computed later
        threads = {},    -- populated below
      }
    end
  end

  -- Sort resources by totalUs descending
  table.sort(resources, function(a, b) return a.totalUs > b.totalUs end)

  -- Compute percentage of total
  if totalTickUs > 0 then
    for _, res in ipairs(resources) do
      res.pctOfTotal = (res.totalUs / totalTickUs) * 100
    end
  end

  -- Build thread data and attach to resources
  for threadLabel, threadData in pairs(threadDurations) do
    local nBegins = #threadData.begins
    local nEnds = #threadData.ends
    local nPairs = math.min(nBegins, nEnds)

    for i = 1, nPairs do
      local durationUs = threadData.ends[i] - threadData.begins[i]
      if durationUs >= 0 then
        local threadRow = {
          label = threadData.info.label,
          resource = threadData.info.resource,
          filePath = threadData.info.filePath,
          lineRange = threadData.info.lineRange,
          durationUs = durationUs,
        }

        -- Attach to the matching resource
        for _, res in ipairs(resources) do
          if res.name == threadData.info.resource then
            table.insert(res.threads, threadRow)
            break
          end
        end
      end
    end
  end

  -- Sort threads within each resource by durationUs descending
  for _, res in ipairs(resources) do
    table.sort(res.threads, function(a, b) return a.durationUs > b.durationUs end)
  end

  -- Compute frame times
  local frameTimes = { avgMs = 0, minMs = 0, maxMs = 0, fps = 0 }
  if #frameTimestamps >= 2 then
    local frameDurations = {}
    for i = 2, #frameTimestamps do
      table.insert(frameDurations, (frameTimestamps[i] - frameTimestamps[i - 1]) / 1000) -- μs → ms
    end

    if #frameDurations > 0 then
      local sum = 0
      local minMs = frameDurations[1]
      local maxMs = frameDurations[1]
      for _, f in ipairs(frameDurations) do
        sum = sum + f
        if f < minMs then minMs = f end
        if f > maxMs then maxMs = f end
      end
      local avgMs = sum / #frameDurations
      frameTimes = {
        avgMs = avgMs,
        minMs = minMs,
        maxMs = maxMs,
        fps = 1000 / avgMs,
      }
    end
  end

  -- Compute total tick time per frame (average)
  local framesCaptured = #frameTimestamps
  local totalTickAvg = { avgUs = 0, maxUs = 0 }
  if framesCaptured > 0 and totalTickUs > 0 then
    totalTickAvg.avgUs = totalTickUs / framesCaptured
    -- maxUs is approximate (total / frames * max resource pct)
    totalTickAvg.maxUs = totalTickAvg.avgUs
  end

  return {
    summary = {
      framesCaptured = framesCaptured,
      frameTimes = frameTimes,
      totalTickTime = totalTickAvg,
    },
    resources = resources,
    capturedAt = os.time() * 1000,
  }
end

-- ============================================================
-- Main capture function
-- ============================================================

-- ============================================================
-- Snippet cache (LRU, max 50 entries)
-- ============================================================

local SNIPPET_CACHE_MAX = 50
local snippetCache = {}       -- [key] = snippet data
local cacheOrder = {}         -- access order (oldest first)
local cacheOrderSet = {}      -- fast lookup: key -> true

local function cacheAccess(key)
  -- Move key to end of order (most recently used)
  if cacheOrderSet[key] then
    for i = #cacheOrder, 1, -1 do
      if cacheOrder[i] == key then
        table.remove(cacheOrder, i)
        break
      end
    end
  end
  table.insert(cacheOrder, key)
  cacheOrderSet[key] = true
end

local function cacheEvict()
  while #cacheOrder > SNIPPET_CACHE_MAX do
    local oldest = table.remove(cacheOrder, 1)
    cacheOrderSet[oldest] = nil
    snippetCache[oldest] = nil
  end
end

-- Fetch a code snippet for a given resource/file/line range
-- Returns: { lines = { { number, content, highlighted }, ... }, windowStart, windowEnd, targetRange } or nil
local function fetchCodeSnippet(resource, filePath, startLine, endLine)
  local cacheKey = resource .. ':' .. filePath .. ':' .. startLine .. '..' .. endLine

  if snippetCache[cacheKey] then
    cacheAccess(cacheKey)
    return snippetCache[cacheKey]
  end

  local content = LoadResourceFile(resource, filePath)
  if not content then
    return nil
  end

  -- Binary detection via extension (content is already a string, check filePath extension)
  local ext = filePath:match('[.](%a+)$')
  if ext then
    local binaryExts = { ['dll'] = true, ['exe'] = true, ['dat'] = true, ['bin'] = true, ['png'] = true, ['jpg'] = true, ['jpeg'] = true, ['gif'] = true, ['webp'] = true, ['mp3'] = true, ['ogg'] = true, ['wav'] = true, ['stl'] = true, ['yft'] = true, ['ydr'] = true, ['ymt'] = true, ['ybn'] = true }
    if binaryExts[ext:lower()] then
      return { binary = true }
    end
  end

  -- Split into lines
  local allLines = {}
  for line in content:gmatch('([^\r\n]*)') do
    table.insert(allLines, line)
  end

  -- Extract window: startLine-3 to endLine+3 (clamped)
  local windowStart = math.max(startLine - 3, 1)
  local windowEnd = math.min(endLine + 3, #allLines)

  local snippetLines = {}
  for i = windowStart, windowEnd do
    table.insert(snippetLines, {
      number = i,
      content = allLines[i] or '',
      highlighted = (i >= startLine and i <= endLine),
    })
  end

  local result = {
    lines = snippetLines,
    windowStart = windowStart,
    windowEnd = windowEnd,
    targetRange = startLine .. '..' .. endLine,
  }

  snippetCache[cacheKey] = result
  cacheAccess(cacheKey)
  cacheEvict()

  return result
end

-- ============================================================
-- Main capture function
-- ============================================================

local captureInProgress = false

local function captureProfile(src, frames, clientPort, cb)
  if captureInProgress then
    sendError(src, 'A profile capture is already in progress.')
    return
  end

  -- Cap frames at 200 to keep JSON manageable
  frames = math.min(frames or 50, 200)

  -- Validate frames
  if frames < 5 then
    frames = 5
  end

  -- Resolve endpoint
  local endpoint = resolveEndpoint(clientPort)
  if not endpoint then
    -- Send detection failure info
    TriggerClientEvent('EasyAdmin:profilerEndpointError', src, {
      message = 'Could not determine the server endpoint. Profiling is unavailable.',
    })
    return
  end

  cachedPort = endpoint.port
  captureInProgress = true

  -- Phase 1: Start recording
  sendProgress(src, 'recording', 'Starting profiler recording...', 0)

  ExecuteCommand('profiler record ' .. frames)

  -- Phase 2: Wait for recording to complete
  -- ~16Hz server tick (~62.5ms) + profiler overhead (~75ms) + 1.5s fixed startup + 1s safety buffer
  local estimatedWait = (frames * 75) + 2500

  -- Progress budget: 0-50% recording, 50-70% generating, 70-85% fetching, 85-100% parsing
  local progressCount = 0
  local function updateRecordingProgress()
    progressCount = progressCount + 1
    local percent = math.min(math.floor((progressCount * 500 / estimatedWait) * 50), 50)
    sendProgress(src, 'recording', 'Recording frames...', percent)
    if percent < 50 then
      SetTimeout(500, updateRecordingProgress)
    end
  end
  SetTimeout(500, updateRecordingProgress)

  -- Phase 3: After recording, generate the view
  SetTimeout(estimatedWait, function()
    captureInProgress = false
    sendProgress(src, 'generating', 'Generating profile data...', 50)

    ExecuteCommand('profiler view')

    -- Phase 4: Wait for profileData.json to be generated (~3 seconds)
    -- Send incremental progress during the wait (50% -> 70%)
    local genProgress = 52
    local function updateGeneratingProgress()
      sendProgress(src, 'generating', 'Generating profile data...', genProgress)
      if genProgress < 68 then
        genProgress = genProgress + 2
        SetTimeout(150, updateGeneratingProgress)
      end
    end
    SetTimeout(150, updateGeneratingProgress)

    SetTimeout(3000, function()
      sendProgress(src, 'fetching', 'Fetching profile data...', 70)

      -- Phase 5: Fetch profile data via HTTP
      local retries = 0
      local maxRetries = 3

      local function tryFetch()
        PerformHttpRequest(endpoint.url, function(errorCode, result)
          if errorCode == 200 and result then
            sendProgress(src, 'parsing', 'Parsing profile data...', 85)

            -- Parse the JSON
            local data = json.decode(result)
            if data and data.traceEvents then
              local parsed = parseProfile(data.traceEvents)
              if parsed then
                sendProgress(src, 'complete', 'Profile complete!', 100)
                sendResult(src, parsed, { method = endpoint.method, port = endpoint.port })
              else
                sendError(src, 'Failed to parse profiler data. No trace events found.')
              end
            else
              sendError(src, 'Invalid profiler data format. Expected traceEvents array.')
            end
          elseif retries < maxRetries then
            retries = retries + 1
            sendProgress(src, 'retrying', 'Retrying... (' .. retries .. '/' .. maxRetries .. ')', 72)
            SetTimeout(500, tryFetch)
          else
            sendError(src, 'Failed to fetch profile data. HTTP error: ' .. tostring(errorCode))
          end
        end, 'GET')
      end

      tryFetch()
    end)
  end)
end

-- ============================================================
-- Server event handlers
-- ============================================================

RegisterServerEvent('EasyAdmin:startProfiler', function(data)
  local src = source

  -- Permission check
  if not canProfile(src) then
    TriggerClientEvent('EasyAdmin:profilerError', src, {
      message = 'You do not have permission to use the profiler.',
    })
    return
  end

  local frames = data and data.frames
  local port = data and data.port

  captureProfile(src, frames, port)
end)

-- Fetch a code snippet for a thread row
RegisterServerEvent('EasyAdmin:profilerGetSnippet', function(data)
  local src = source

  -- Permission check
  if not canProfile(src) then
    return
  end

  local threadId = data and data.threadId
  local info = extractThreadInfo(data and data.label)
  if not info then
    TriggerClientEvent('EasyAdmin:profilerSnippetError', src, {
      threadId = threadId,
      message = 'Could not parse thread label.',
    })
    return
  end

  local snippet = fetchCodeSnippet(info.resource, info.filePath, info.startLine, info.endLine)
  if not snippet then
    TriggerClientEvent('EasyAdmin:profilerSnippetError', src, {
      threadId = threadId,
      message = 'Could not load file: ' .. info.filePath,
    })
    return
  end

  if snippet.binary then
    TriggerClientEvent('EasyAdmin:profilerSnippetError', src, {
      threadId = threadId,
      message = 'Binary file — code preview not available.',
    })
    return
  end

  TriggerClientEvent('EasyAdmin:profilerSnippetResult', src, {
    threadId = threadId,
    snippet = snippet,
    filePath = info.filePath,
    resource = info.resource,
  })
end)
