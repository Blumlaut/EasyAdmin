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

-- Extract owner/repo from a GitHub URL
local function parseGitHubRepo(url)
  if not url then return nil, nil end
  local match = string.match(url, 'github[.]com/([^/]+)/([^/]+)')
  if match then
    local parts = {}
    for p in string.gmatch(match, '([^/]+)') do
      table.insert(parts, p)
    end
    return parts[1], parts[2]
  end
  return nil, nil
end

-- Fetch latest release tag from GitHub (async via PerformHttpRequest)
local function fetchLatestRelease(owner, repo, cb)
  local url = string.format('https://api.github.com/repos/%s/%s/releases/latest', owner, repo)
  PerformHttpRequest(url, function(err, response, headers)
    if err ~= 200 or not response then
      cb(nil)
      return
    end
    local data = json.decode(response)
    if data and data.tag_name then
      cb(data.tag_name)
    else
      cb(nil)
    end
  end, 'GET')
end

-- Get cached or fetch latest release for a repo key
local function getLatestRelease(owner, repo, cb)
  local key = string.format('%s/%s', owner, repo)
  local cached = githubCache[key]
  if cached and os.time() - cached.checkedAt < GITHUB_CACHE_TTL then
    cb(cached.tag)
    return
  end
  fetchLatestRelease(owner, repo, function(tag)
    if tag then
      githubCache[key] = { tag = tag, checkedAt = os.time() }
    end
    cb(tag)
  end)
end

-- Simple semver comparison (handles X.Y.Z and v-prefixed)
local function compareVersions(a, b)
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

    table.insert(resources, {
      name = name,
      state = state,
      isProtected = (name == currentResource),
      version = version,
      description = description,
      repository = repository,
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

-- Check for updates on specific resources
RegisterServerEvent('EasyAdmin:checkResourceUpdates', function(names)
  local src = source
  if not canManageResources(src) then return end
  if type(names) ~= 'table' then return end

  local results = {}
  local pending = 0

  for _, name in ipairs(names) do
    local version = GetResourceMetadata(name, 'version', 0)
    local repository = GetResourceMetadata(name, 'repository', 0)

    if not version or not repository then
      table.insert(results, { name = name, latest = nil, outdated = false })
      goto continue
    end

    local owner, repo = parseGitHubRepo(repository)
    if not owner or not repo then
      table.insert(results, { name = name, latest = nil, outdated = false })
      goto continue
    end

    pending = pending + 1
    getLatestRelease(owner, repo, function(latest)
      table.insert(results, {
        name = name,
        latest = latest,
        outdated = latest and compareVersions(version, latest) < 1,
      })
      pending = pending - 1
      if pending == 0 then
        TriggerClientEvent('EasyAdmin:resourceUpdatesResult', src, {
          updates = results,
        })
      end
    end)

    ::continue::
  end

  -- If no async checks needed, send immediately
  if pending == 0 then
    TriggerClientEvent('EasyAdmin:resourceUpdatesResult', src, {
      updates = results,
    })
  end
end)
