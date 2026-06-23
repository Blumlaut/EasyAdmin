------------------------------------
-- FiveM mock layer for running unit tests outside of FXServer
-- Load this file BEFORE any EasyAdmin Lua code
------------------------------------

-- ============================================================
-- Convar mocks
-- ============================================================
local _convars = {}

function GetConvar(key, default)
    return _convars[key] or default
end

function GetConvarInt(key, default)
    local val = GetConvar(key)
    if val ~= nil then
        return tonumber(val) or default
    end
    return default or 0
end

function SetConvar(key, value)
    _convars[key] = tostring(value)
end

function GetConvarReplicated(key, default)
    return GetConvar(key, default)
end

-- Helper to set convars in tests
_MockSetConvar = function(key, value)
    _convars[key] = tostring(value)
end

-- Helper to clear all convars
_MockClearConvars = function()
    _convars = {}
end

-- ============================================================
-- Citizen / CfxLua runtime
-- ============================================================
Citizen = {
    CreateThread = function(fn)
        -- Don't actually run threads in tests
    end,
    Wait = function(ms) end,
    SetTimeout = function(ms, fn)
        fn()  -- Execute immediately in tests
    end,
    Trace = function(...) end,
}

-- ============================================================
-- JSON (FiveM uses a custom json module)
-- ============================================================
json = {
    encode = function(tbl, opts)
        -- Simple JSON encoder for test purposes
        local result = require('json').encode(tbl)
        return result
    end,
    decode = function(str)
        local ok, result = pcall(require('json').decode, str)
        if ok then return result end
        return nil
    end,
}

-- ============================================================
-- Event system (no-op for tests)
-- ============================================================
function AddEventHandler(name, fn) end
function TriggerEvent(name, ...) end
function TriggerClientEvent(name, target, ...) end
function TriggerServerEvent(name, ...) end
function TriggerLatentClientEvent(name, target, timeout, ...) end

-- ============================================================
-- Resource management
-- ============================================================
local _currentResource = "easyadmin"

function GetCurrentResourceName()
    return _currentResource
end

function GetResourcePath(name)
    return "/fake/path/" .. name
end

function GetResourceState(name)
    return "started"
end

function GetResourceMetadata(name, key, index)
    if key == "version" then return "9.0.0" end
    if key == "is_master" then return "yes" end
    return nil
end

-- ============================================================
-- Player functions
-- ============================================================
local _mockPlayers = {}  -- src -> { name, identifiers, tokens }
local _playerCounter = 0

function _MockAddPlayer(name, identifiers, tokens)
    _playerCounter = _playerCounter + 1
    _mockPlayers[_playerCounter] = {
        name = name,
        identifiers = identifiers or {},
        tokens = tokens or {},
    }
    return _playerCounter
end

function _MockRemovePlayer(src)
    _mockPlayers[src] = nil
end

function _MockClearPlayers()
    _mockPlayers = {}
    _playerCounter = 0
end

function GetPlayerIdentifiers(src)
    local player = _mockPlayers[tonumber(src)]
    return player and player.identifiers or {}
end

function GetPlayerName(src)
    local player = _mockPlayers[tonumber(src)]
    return player and player.name or false
end

function GetPlayerIdentifier(src, index)
    local ids = GetPlayerIdentifiers(src)
    return ids[tonumber(index) + 1] or ""
end

function GetPlayerIdentifierByType(src, typ)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if id:find("^" .. typ .. ":") then
            return id
        end
    end
    return false
end

function GetPlayers()
    local result = {}
    for src in pairs(_mockPlayers) do
        table.insert(result, src)
    end
    return result
end

function IsPlayerAceAllowed(player, privilege)
    return false  -- Default: no permissions
end

function DropPlayer(src, reason) end

-- Token functions (may not exist on older servers)
function GetNumPlayerTokens(src)
    local player = _mockPlayers[tonumber(src)]
    return player and #player.tokens or 0
end

function GetPlayerToken(src, index)
    local player = _mockPlayers[tonumber(src)]
    return player and player.tokens[index + 1] or nil
end

-- ============================================================
-- Entity functions
-- ============================================================
function GetAllVehicles() return {} end
function GetAllPeds() return {} end
function GetAllObjects() return {} end
function DoesEntityExist(entity) return false end
function GetEntityCoords(entity) return 0, 0, 0 end
function DeleteEntity(entity) end
function IsPedAPlayer(ped) return false end
function GetDistanceBetweenCoords(x1, y1, z1, x2, y2, z2) return 0 end

-- ============================================================
-- Duplicity check
-- ============================================================
function IsDuplicityVersion()
    return true  -- Assume server context for tests
end

-- ============================================================
-- File I/O
-- ============================================================
local _mockFiles = {}

function LoadResourceFile(resource, path)
    return _mockFiles[path]
end

function SaveResourceFile(resource, path, data, size)
    _mockFiles[path] = data
    return true
end

function _MockSetFile(path, content)
    _mockFiles[path] = content
end

function _MockClearFiles()
    _mockFiles = {}
end

-- ============================================================
-- Command registration (no-op)
-- ============================================================
function RegisterCommand(name, fn, restricted) end
function ExecuteCommand(cmd) end

-- ============================================================
-- NUI functions
-- ============================================================
function SetNuiFocus(focus, allowInput) end
function SendNUIMessage(data) end
function DisplayOnscreenKeyboard(flag, text, ...) end
function UpdateOnscreenKeyboard() return 1 end
function GetOnscreenKeyboardResult() return "" end

-- ============================================================
-- Label / text
-- ============================================================
function GetLabelText(key)
    return key  -- Return key as-is
end

-- ============================================================
-- Misc
-- ============================================================
function GetInvokingResource()
    return nil
end

-- ============================================================
-- Exports (FiveM export system)
-- ============================================================
function exports(name, fn) end  -- No-op in tests

-- ============================================================
-- KVP (Key-Value Pair) storage
-- ============================================================
local _kvpStore = {}

function GetResourceKvpString(key)
    local val = _kvpStore[key]
    return type(val) == "string" and val or nil
end

function GetResourceKvpInt(key)
    local val = _kvpStore[key]
    return type(val) == "number" and val or 0
end

function GetResourceKvpFloat(key)
    local val = _kvpStore[key]
    return type(val) == "number" and val or 0.0
end

function SetResourceKvp(key, value)
    _kvpStore[key] = tostring(value)
end

function SetResourceKvpInt(key, value)
    _kvpStore[key] = tonumber(value) or 0
end

function SetResourceKvpFloat(key, value)
    _kvpStore[key] = tonumber(value) or 0.0
end

function SetResourceKvpNoSync(key, value)
    SetResourceKvp(key, value)
end

function SetResourceKvpIntNoSync(key, value)
    SetResourceKvpInt(key, value)
end

function SetResourceKvpFloatNoSync(key, value)
    SetResourceKvpFloat(key, value)
end

function DeleteResourceKvp(key)
    _kvpStore[key] = nil
end

function _MockClearKvp()
    _kvpStore = {}
end
