------------------------------------
-- EasyAdmin: Centralized KVP helpers
--
-- Key naming convention (type prefix):
--   s<name>  = string  (e.g. "shighContrast")
--   i<name>  = integer (e.g. "ifontSize")
--   f<name>  = float   (e.g. "fcooldown")
--
-- No "ea_" prefix — resource KVPs are already resource-scoped.
------------------------------------

--- Read a KVP value by type prefix
function KvpGet(key)
  local prefix = key:sub(1, 1)
  if prefix == 'i' then
    -- GetResourceKvpInt returns 0 for unset keys, so treat 0 as nil
    -- to allow `or` fallbacks to work correctly
    local val = GetResourceKvpInt(key)
    return val ~= 0 and val or nil
  elseif prefix == 'f' then
    return GetResourceKvpFloat(key)
  else
    -- default to string ('s' or unknown)
    return GetResourceKvpString(key)
  end
end

--- Write a KVP value by type prefix
function KvpSet(key, value)
  local prefix = key:sub(1, 1)
  if prefix == 'i' then
    SetResourceKvpInt(key, tonumber(value) or 0)
  elseif prefix == 'f' then
    SetResourceKvpFloat(key, tonumber(value) or 0.0)
  else
    SetResourceKvp(key, tostring(value))
  end
end

--- Write a KVP value by type prefix (no disk sync — faster, use for non-critical data)
function KvpSetNoSync(key, value)
  local prefix = key:sub(1, 1)
  if prefix == 'i' then
    SetResourceKvpIntNoSync(key, tonumber(value) or 0)
  elseif prefix == 'f' then
    SetResourceKvpFloatNoSync(key, tonumber(value) or 0.0)
  else
    SetResourceKvpNoSync(key, tostring(value))
  end
end

--- Delete a KVP (type-agnostic)
function KvpDelete(key)
  DeleteResourceKvp(key)
end

--- Ensure default values for all known settings
function KvpEnsureDefaults()
  local defaults = {
    { key = 'shighContrast', value = 'false' },
    { key = 'ifontSize',     value = 100 },
    { key = 'smenuSize',     value = 'default' },
    { key = 'ixWindowPos',   value = 0 },
    { key = 'iyWindowPos',   value = 0 },
  }

  for _, d in ipairs(defaults) do
    local current = KvpGet(d.key)
    if current == nil or current == '' then
      KvpSet(d.key, d.value)
    end
  end
end

--- Migrate old ea_* KVPs to new prefixed names, then delete old keys
function KvpMigrate()
  -- shighContrast: string, straightforward migration
  local oldHighContrast = GetResourceKvpString('ea_highContrast')
  if oldHighContrast and KvpGet('shighContrast') == nil then
    KvpSet('shighContrast', oldHighContrast)
  end
  DeleteResourceKvp('ea_highContrast')

  -- ifontSize: was stored as int OR string (bug), handle both
  if KvpGet('ifontSize') == nil then
    local success, intVal = pcall(GetResourceKvpInt, 'ea_fontSize')
    local newVal
    if success and intVal ~= 0 then
      newVal = intVal
    else
      -- Might be a string or doesn't exist
      local strVal = GetResourceKvpString('ea_fontSize')
      if strVal then
        newVal = tonumber(strVal)
      end
    end
    if newVal then
      KvpSet('ifontSize', newVal)
    end
  end
  DeleteResourceKvp('ea_fontSize')

  -- smenuSize: string, straightforward migration
  local oldMenuSize = GetResourceKvpString('ea_menuSize')
  if oldMenuSize and KvpGet('smenuSize') == nil then
    KvpSet('smenuSize', oldMenuSize)
  end
  DeleteResourceKvp('ea_menuSize')

  -- ea_overrideEgg: dropping entirely
  DeleteResourceKvp('ea_overrideEgg')
end

-- Run migration and defaults on module load (happens once per context)
KvpMigrate()
KvpEnsureDefaults()
