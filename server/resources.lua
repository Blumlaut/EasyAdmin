------------------------------------
-- EasyAdmin: Server-side resource management
-- All resource data and operations run server-side for correctness.
-- Client only sees what the server sends.
------------------------------------

local currentResource = GetCurrentResourceName()

-- ============================================================
-- Permission helpers
-- ============================================================

local function canManageResources(src)
  return DoesPlayerHavePermission(src, 'server.resources.start') or DoesPlayerHavePermission(src, 'server.resources.stop')
end

local function canStartResources(src)
  return DoesPlayerHavePermission(src, 'server.resources.start')
end

local function canStopResources(src)
  return DoesPlayerHavePermission(src, 'server.resources.stop')
end

-- ============================================================
-- GitHub latest release cache
-- ============================================================

-- Cache: { [repoKey] = { tag = string, checkedAt = number } }
local githubCache = {}
-- TTL: 6 hours
local GITHUB_CACHE_TTL = 6 * 3600

-- Resource update results cache (shared across all admins)
-- { [resourceName] = { latest = string|nil, outdated = boolean, checkedAt = number } }
local resourceUpdateCache = {}
-- TTL: 1 hour (stale results are still useful for admins opening the page later)
local UPDATE_CACHE_TTL = 3600
-- Delay between GitHub API requests (ms) to avoid rate limiting
local GITHUB_REQUEST_DELAY = 1000

-- Extract owner/repo from a GitHub URL
local function parseGitHubRepo(url)
  if not url then return nil, nil end
  local owner, repo = string.match(url, 'github[.]com/([^/]+)/([^/]+)')
  if owner and repo then
    return owner, repo
  end
  return nil, nil
end

-- Short TTL for failed fetches: retry failed repos after 5 minutes
-- instead of 6 hours (so flaky/404 repos stop hammering the API immediately)
local GITHUB_CACHE_FAIL_TTL = 300

-- Fetch latest release tag from GitHub (async via PerformHttpRequest)
local function fetchLatestRelease(owner, repo, cb)
  local url = string.format('https://api.github.com/repos/%s/%s/releases/latest', owner, repo)
  PrintDebugMessage('[Server] fetchLatestRelease: GET ' .. url, 4)
  PerformHttpRequest(url, function(err, response, headers)
    PrintDebugMessage('[Server] fetchLatestRelease: HTTP status=' .. tostring(err) .. ', response=' .. tostring(response and string.sub(response, 1, 120) or 'nil'), 4)
    if err ~= 200 or not response then
      PrintDebugMessage('[Server] fetchLatestRelease: request failed (status=' .. tostring(err) .. '), callback(nil)', 4)
      cb(nil)
      return
    end
    local data = json.decode(response)
    if data and data.tag_name then
      PrintDebugMessage('[Server] fetchLatestRelease: tag_name=' .. data.tag_name, 4)
      cb(data.tag_name)
    else
      PrintDebugMessage('[Server] fetchLatestRelease: no tag_name in response, callback(nil)', 4)
      cb(nil)
    end
  end, 'GET')
end

-- Get cached or fetch latest release for a repo key.
-- Always caches the result (including failures with nil tag) to prevent
-- repeated failed requests from the same GitHub repo across multiple resources.
-- A nil tag means "we fetched but the request failed" — this stops hammering
-- broken/404 repo URLs when many resources share the same GitHub source.
local function getLatestRelease(owner, repo, cb)
  local key = string.format('%s/%s', owner, repo)
  local cached = githubCache[key]
  if cached then
    local ttl = cached.tag and GITHUB_CACHE_TTL or GITHUB_CACHE_FAIL_TTL
    if os.time() - cached.checkedAt < ttl then
      PrintDebugMessage('[Server] getLatestRelease: using cache for ' .. key .. ' (tag=' .. (cached.tag or '(fail)') .. ')', 4)
      cb(cached.tag)
      return
    end
  end
  PrintDebugMessage('[Server] getLatestRelease: cache miss for ' .. key .. ', fetching', 4)
  fetchLatestRelease(owner, repo, function(tag)
    if tag then
      githubCache[key] = { tag = tag, checkedAt = os.time() }
      PrintDebugMessage('[Server] getLatestRelease: cached ' .. key .. ' = ' .. tag, 4)
      cb(tag)
    else
      -- Cache the failure with nil tag and short TTL.
      -- This prevents every resource sharing this GitHub repo from
      -- triggering independent failed requests.
      -- Uses nil (falsy in Lua) so the TTL branch and downstream checks
      -- correctly treat it as "no tag available".
      githubCache[key] = { tag = nil, checkedAt = os.time() }
      PrintDebugMessage('[Server] getLatestRelease: cached failure for ' .. key .. ' (short TTL: 5m)', 4)
      cb(nil)
    end
  end)
end

-- Get cached update info for a resource (returns nil if expired)
local function getCachedUpdate(resourceName)
  local cached = resourceUpdateCache[resourceName]
  if cached and os.time() - cached.checkedAt < UPDATE_CACHE_TTL then
    return cached.latest, cached.outdated
  end
  return nil, nil
end

-- Store update info for a resource in the shared cache
local function setCachedUpdate(resourceName, latest, outdated)
  resourceUpdateCache[resourceName] = {
    latest = latest,
    outdated = outdated,
    checkedAt = os.time(),
  }
end

-- Check a single resource against GitHub, cache result, then call next()
local function checkOneResource(name, results, next)
  local version = GetResourceMetadata(name, 'version', 0)
  local repository = GetResourceMetadata(name, 'repository', 0)

  PrintDebugMessage('[Server] checkOneResource resource=' .. name .. ', version=' .. tostring(version) .. ', repository=' .. tostring(repository), 4)

  if not version or not repository then
    PrintDebugMessage('[Server] checkOneResource resource=' .. name .. ': skipping (missing version or repository)', 4)
    table.insert(results, { name = name, latest = nil, outdated = false })
    Citizen.SetTimeout(GITHUB_REQUEST_DELAY, next)
    return
  end

  local owner, repo = parseGitHubRepo(repository)
  if not owner or not repo then
    PrintDebugMessage('[Server] checkOneResource resource=' .. name .. ': could not parse GitHub repo', 4)
    table.insert(results, { name = name, latest = nil, outdated = false })
    Citizen.SetTimeout(GITHUB_REQUEST_DELAY, next)
    return
  end

  PrintDebugMessage('[Server] checkOneResource resource=' .. name .. ': fetching latest release for ' .. owner .. '/' .. repo, 4)
  getLatestRelease(owner, repo, function(latest)
    local isOutdated = latest and compareVersions(version, latest) < 1
    PrintDebugMessage('[Server] checkOneResource resource=' .. name .. ': latest=' .. tostring(latest) .. ', outdated=' .. tostring(isOutdated), 4)

    setCachedUpdate(name, latest, isOutdated)

    table.insert(results, {
      name = name,
      latest = latest,
      outdated = isOutdated,
    })
    Citizen.SetTimeout(GITHUB_REQUEST_DELAY, next)
  end)
end

-- Sequential update checker: processes names[index..#names] one at a time.
-- onComplete is called when all are done. Pass nil for src to skip client event.
local function checkUpdatesSequential(names, index, results, onComplete)
  if index > #names then
    PrintDebugMessage('[Server] checkUpdatesSequential: all complete (count=' .. #results .. ')', 4)
    onComplete(results)
    return
  end

  local name = names[index]
  PrintDebugMessage('[Server] checkUpdatesSequential resource=' .. name .. ' (index=' .. index .. '/' .. #names .. ')', 4)

  checkOneResource(name, results, function()
    checkUpdatesSequential(names, index + 1, results, onComplete)
  end)
end

-- Simple semver comparison (handles X.Y.Z and v-prefixed)
function compareVersions(a, b)
  if not a or not b then return 0 end
  -- Strip leading 'v'
  a = string.gsub(a, '^v', '')
  b = string.gsub(b, '^v', '')

  local partsA = {}
  local partsB = {}
  for part in string.gmatch(a, '%d+') do
    table.insert(partsA, tonumber(part))
  end
  for part in string.gmatch(b, '%d+') do
    table.insert(partsB, tonumber(part))
  end

  local len = math.max(#partsA, #partsB)
  for i = 1, len do
    local va = partsA[i] or 0
    local vb = partsB[i] or 0
    if va < vb then return -1 end
    if va > vb then return 1 end
  end
  return 0
end

-- ============================================================
-- Build resource list with metadata summaries
-- ============================================================

local function buildResourceList()
  local count = GetNumResources() - 1
  local resources = {}

  for i = 0, count - 1 do
    local name = GetResourceByFindIndex(i)
    if not name then goto continue end

    local state = GetResourceState(name) or 'stopped'

    -- Extract key metadata entries (query known keys directly — API requires specific keys)
    local version = GetResourceMetadata(name, 'version', 0)
    local description = GetResourceMetadata(name, 'description', 0)
    local repository = GetResourceMetadata(name, 'repository', 0)

    -- Merge cached update info (from last check)
    local cachedLatest, cachedOutdated = getCachedUpdate(name)

    table.insert(resources, {
      name = name,
      state = state,
      isProtected = (name == currentResource),
      version = version,
      description = description,
      repository = repository,
      latestVersion = cachedLatest,
      outdated = cachedOutdated or false,
    })

    ::continue::
  end

  return resources
end

-- Known fxmanifest.lua metadata keys (FiveM API requires specific keys, cannot enumerate)
local KNOWN_METADATA_KEYS = {
  'game', 'games', 'fx_version', 'lua54', 'rdr3_warning', 'node_version',
  'author', 'description', 'repository', 'version', 'is_master',
  'map', 'client_script', 'server_script', 'shared_script', 'script',
  'ui_page', 'ui_loop', 'html', 'file', 'files',
  'dependency', 'dependencies', 'provide', 'loadscreen',
  'toolbar_offset', 'tls_cert', 'tls_key',
  'escrow_ignore', 'use_fxv2_oal', 'release_exports_early',
  'no_reload', 'thread', 'rate', 'priority',
}

-- Build metadata entries for a single resource by querying known keys
local function buildMetadata(name)
  local entries = {}

  for _, key in ipairs(KNOWN_METADATA_KEYS) do
    local valCount = GetNumResourceMetadata(name, key)
    if valCount and valCount > 0 then
      for idx = 0, valCount - 1 do
        local value = GetResourceMetadata(name, key, idx)
        if value then
          table.insert(entries, { key = key, value = value })
        end
      end
    end
  end

  return {
    name = name,
    state = GetResourceState(name) or 'unknown',
    entries = entries,
  }
end

-- ============================================================
-- Server events
-- ============================================================

-- Fetch full resource list with metadata summaries
RegisterServerEvent('EasyAdmin:requestResources', function()
  local src = source
  if not canManageResources(src) then return end

  TriggerClientEvent('EasyAdmin:resourcesResult', src, {
    resources = buildResourceList(),
    protected = currentResource,
  })
end)

-- Fetch metadata for a single resource
RegisterServerEvent('EasyAdmin:requestResourceMetadata', function(name)
  local src = source
  if not canManageResources(src) then return end
  if not name or name == '' then return end

  TriggerClientEvent('EasyAdmin:resourceMetadataResult', src, {
    metadata = buildMetadata(name),
  })
end)

-- Fetch metadata for multiple resources (batch)
RegisterServerEvent('EasyAdmin:requestResourceMetadataBatch', function(names)
  local src = source
  if not canManageResources(src) then return end
  if type(names) ~= 'table' then return end

  local results = {}
  for _, name in ipairs(names) do
    if name and name ~= '' then
      table.insert(results, buildMetadata(name))
    end
  end

  TriggerClientEvent('EasyAdmin:resourceMetadataBatchResult', src, {
    metadata = results,
  })
end)

-- Start a resource
RegisterServerEvent('EasyAdmin:startResource', function(name)
  local src = source
  if not canStartResources(src) then return end
  if not name or name == '' then return end

  local state = GetResourceState(name)
  if state == 'started' then
    TriggerClientEvent('EasyAdmin:resourceActionToast', src, {
      text = name .. ' is already started',
      type = 'info',
    })
    return
  end

  StartResource(name)
  TriggerClientEvent('EasyAdmin:resourceActionToast', src, {
    text = 'Started ' .. name,
    type = 'success',
  })
  -- Push updated list
  TriggerClientEvent('EasyAdmin:resourcesResult', src, {
    resources = buildResourceList(),
    protected = currentResource,
  })
end)

-- Stop a resource
RegisterServerEvent('EasyAdmin:stopResource', function(name)
  local src = source
  if not canStopResources(src) then return end
  if not name or name == '' then return end

  if name == currentResource then
    TriggerClientEvent('EasyAdmin:resourceActionToast', src, {
      text = 'You cannot stop EasyAdmin itself',
      type = 'error',
    })
    return
  end

  local state = GetResourceState(name)
  if state ~= 'started' then
    TriggerClientEvent('EasyAdmin:resourceActionToast', src, {
      text = name .. ' is not running',
      type = 'info',
    })
    return
  end

  StopResource(name)
  TriggerClientEvent('EasyAdmin:resourceActionToast', src, {
    text = 'Stopped ' .. name,
    type = 'success',
  })
  -- Push updated list
  TriggerClientEvent('EasyAdmin:resourcesResult', src, {
    resources = buildResourceList(),
    protected = currentResource,
  })
end)

-- Get cached update summary (for Dashboard alert)
RegisterServerEvent('EasyAdmin:requestResourceUpdateSummary', function()
  local src = source
  if not canManageResources(src) then return end

  local outdated = {}
  for name, cached in pairs(resourceUpdateCache) do
    if cached.outdated and cached.latest then
      local version = GetResourceMetadata(name, 'version', 0)
      table.insert(outdated, {
        name = name,
        current = version,
        latest = cached.latest,
      })
    end
  end

  TriggerClientEvent('EasyAdmin:resourceUpdateSummaryResult', src, {
    outdated = outdated,
  })
end)

-- Check for updates on specific resources (sequential with delays)
RegisterServerEvent('EasyAdmin:checkResourceUpdates', function(names)
  local src = source
  PrintDebugMessage('[Server] EasyAdmin:checkResourceUpdates event received from src=' .. src .. ', names: ' .. (names and json.encode(names) or 'nil'), 4)
  if not canManageResources(src) then
    PrintDebugMessage('[Server] checkResourceUpdates: src=' .. src .. ' lacks permissions', 4)
    return
  end
  if type(names) ~= 'table' or #names == 0 then
    PrintDebugMessage('[Server] checkResourceUpdates: names is empty or not a table', 4)
    TriggerClientEvent('EasyAdmin:resourceUpdatesResult', src, { updates = {} })
    return
  end

  checkUpdatesSequential(names, 1, {}, function(results)
    TriggerClientEvent('EasyAdmin:resourceUpdatesResult', src, { updates = results })
  end)
end)

-- ============================================================
-- Background update check (every 24 hours)
-- ============================================================

-- Collect all resources that have both a version and a GitHub repository
local function collectCheckableResources()
  local checkable = {}
  local count = GetNumResources() - 1

  for i = 0, count - 1 do
    local name = GetResourceByFindIndex(i)
    if not name then goto continue end

    local version = GetResourceMetadata(name, 'version', 0)
    local repository = GetResourceMetadata(name, 'repository', 0)

    if version and repository then
      local owner, repo = parseGitHubRepo(repository)
      if owner and repo then
        table.insert(checkable, name)
      end
    end

    ::continue::
  end

  return checkable
end

-- Run update check and cache results (no client target needed)
local function runBackgroundUpdateCheck()
  local names = collectCheckableResources()
  if #names == 0 then
    PrintDebugMessage('[Server] backgroundUpdateCheck: no checkable resources found', 4)
    return
  end

  PrintDebugMessage('[Server] backgroundUpdateCheck: checking ' .. #names .. ' resources', 4)

  checkUpdatesSequential(names, 1, {}, function(results)
    PrintDebugMessage('[Server] backgroundUpdateCheck: complete, cached ' .. #results .. ' results', 4)
  end)
end

-- Periodic background update check thread
Citizen.CreateThread(function()
  -- Wait a bit after startup before first check
  Wait(30000)
  PrintDebugMessage('[Server] backgroundUpdateCheck: starting periodic checks (interval: 24h)', 4)

  while true do
    runBackgroundUpdateCheck()
    -- Wait 24 hours between checks
    Wait(24 * 60 * 60 * 1000)
  end
end)
