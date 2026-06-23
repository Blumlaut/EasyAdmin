------------------------------------
-- EasyAdmin NUI: core
-- Visibility, focus, menu toggle, shared helpers
------------------------------------

-- `nuiVisible`  - the menu is shown (NUI is rendering)
-- `nuiFocused`  - the NUI has input focus (mouse + keyboard)
-- `nuiBackground` is the inverse of `nuiFocused` (kept for readability
-- in `SendNUIMessage` payloads and for the NUI to render correctly).
local nuiVisible   = false
local nuiFocused   = false
local nuiBackground = false

function IsNuiVisible()
  return nuiVisible
end

function IsNuiBackground()
  return nuiBackground
end

-- Centralized focus setter so the NUI stays in sync with the Lua state.
-- Whenever focus is acquired we send `nuiRehook`; whenever it is
-- released we send `nuiUnhook`. The NUI uses these to dim/undim the
-- window and show/hide the "Press ALT to interact" hint.
local function SetNuiFocused(focused)
  if nuiFocused == focused then
    -- No-op: still send a sync message in case the NUI state drifted
    -- (e.g. it missed a previous SendNUIMessage). Cheap, idempotent.
  end
  nuiFocused = focused
  nuiBackground = not focused
  SetNuiFocus(focused, focused)
  SendNUIMessage({
    action = focused and 'nuiRehook' or 'nuiUnhook',
  })
end

function NuiToggle()
  if not isAdmin then
    TriggerServerEvent('EasyAdmin:amiadmin')
    CreateThread(function()
      local waitTime = 0
      repeat
        Wait(10)
        waitTime = waitTime + 1
      until isAdmin or waitTime > 100
      if not isAdmin then return end
      NuiToggle()
    end)
    return
  end

  nuiVisible = not nuiVisible

  SendNUIMessage({
    action = 'menuToggle',
    data = { visible = nuiVisible },
  })

  if nuiVisible then
    -- Opening the menu: always start with focus.
    SetNuiFocused(true)
    -- Send current settings to NUI
    NuiSendSettings()
    -- Sync registered plugins to NUI
    TriggerEvent('EasyAdmin:syncPluginsToNUI')
    if DoesPlayerHavePermissionForCategory(-1, 'player') then
      TriggerServerEvent('EasyAdmin:GetInfinityPlayerList')
    end
    -- send initial data once player list is available
    CreateThread(function()
      local waitTime = 0
      repeat
        Wait(10)
        waitTime = waitTime + 1
      until playerlist or waitTime > 50
      NuiSendPlayerData()
    end)
  else
    SetNuiFocused(false)
  end
end

function NuiSendPlayerData()
  if not nuiVisible then
    return
  end
  local perms = permissions or {}
  local players = {}
  local hasPlayerPerm = DoesPlayerHavePermissionForCategory(-1, 'player')
  if hasPlayerPerm then
    players = NuiBuildPlayerList()
  end
  SendNUIMessage({
    action = 'updatePlayers',
    data = {
      players = players,
      permissions = perms,
      redm = RedM or false,
      ipprivacy = GetConvar('ea_IpPrivacy', 'true') == 'true',
    },
  })
  -- Send reason shortcuts to NUI on every player data refresh
  local shortcutList = {}
  for k, v in pairs(MessageShortcuts or {}) do
    table.insert(shortcutList, { key = k, value = v })
  end
  SendNUIMessage({
    action = 'updateShortcuts',
    data = { shortcuts = shortcutList },
  })
  -- Fetch avatars for all players (server-side, pushes via playerUpdated NUI events)
  if hasPlayerPerm and playerlist then
    TriggerServerEvent('EasyAdmin:fetchPlayerAvatars')
  end
end

function NuiBuildPlayerList()
  local playerData = {}

  if (RedM and infinity) or not RedM then
    local localplayers = playerlist or {}
    local temp = {}
    for i, thePlayer in pairs(localplayers) do
      table.insert(temp, thePlayer.id)
    end
    table.sort(temp)

    for _, thePlayerId in pairs(temp) do
      for _, thePlayer in pairs(localplayers) do
        if thePlayerId == thePlayer.id then
          local p = {}
          p.id = thePlayer.id
          p.name = thePlayer.name
          p.identifier = thePlayer.identifier
          p.ip = thePlayer.ip
          p.discord = thePlayer.discord
          p.license = thePlayer.license
          p.xbl = thePlayer.xbl
          p.ipprivacy = thePlayer.ipprivacy
          p.frozen = FrozenPlayers[thePlayer.id] or false
          p.muted = MutedPlayers[thePlayer.id] or false
          p.developer = thePlayer.developer
          p.contributor = thePlayer.contributor
          table.insert(playerData, p)
        end
      end
    end
  else
    for i = 0, 128 do
      if NetworkIsPlayerActive(i) then
        local serverId = GetPlayerServerId(i)
        local p = {}
        p.id = serverId
        p.name = GetPlayerName(i)
        p.frozen = FrozenPlayers[serverId] or false
        p.muted = MutedPlayers[serverId] or false
        table.insert(playerData, p)
      end
    end
  end

  return playerData
end

-- Send current settings to NUI (loaded from KVP)
function NuiSendSettings()
  if not nuiVisible then return end

  local sidebarMode = KvpGet('ssidebarMode') or 'vertical'
  local sidebarDirection = KvpGet('ssidebarDirection') or 'right'

  if sidebarMode ~= 'vertical' and sidebarMode ~= 'horizontal' then
    sidebarMode = 'vertical'
  end

  if sidebarMode == 'vertical' then
    if sidebarDirection ~= 'right' and sidebarDirection ~= 'left' then
      sidebarDirection = 'right'
    end
  else
    if sidebarDirection ~= 'down' and sidebarDirection ~= 'up' then
      sidebarDirection = 'down'
    end
  end

  SendNUIMessage({
    action = 'initSettings',
    data = {
      anonymous = false, -- anonymous is per-session, not persisted
      highContrast = KvpGet('shighContrast') == 'true',
      fontSize = KvpGet('ifontSize') or 12,
      sidebarMode = sidebarMode,
      sidebarDirection = sidebarDirection,
    },
  })

  -- Send saved window position (nil if unset — JS handles centering)
  SendNUIMessage({
    action = 'initWindowPos',
    data = {
      x = KvpGet('ixWindowPos'),
      y = KvpGet('iyWindowPos'),
    },
  })

  -- Send saved window size
  SendNUIMessage({
    action = 'initWindowSize',
    data = {
      width = KvpGet('iwSizeW') or 1210,
      height = KvpGet('iwSizeH') or 750,
    },
  })
end

function NuiCloseMenu()
  nuiVisible = false
  SetNuiFocused(false)
  SendNUIMessage({
    action = 'menuToggle',
    data = { visible = false },
  })
end

-- Core callbacks
RegisterNUICallback('closeMenu', function(_data, cb)
  NuiCloseMenu()
  cb({ ok = true })
end)

-- Player dismissed the full-screen warning overlay.
-- Release NUI focus so the game regains input.
RegisterNUICallback('dismissWarning', function(_data, cb)
  SetNuiFocus(false, false)
  cb({ ok = true })
end)

-- Release NUI focus but keep the menu rendered. The user can re-engage
-- by pressing the -ea_setFocused keybind. Used by the "click the
-- background" affordance in the NUI.
RegisterNUICallback('releaseFocus', function(_data, cb)
  if nuiVisible and nuiFocused then
    SetNuiFocused(false)
  end
  cb({ ok = true })
end)

RegisterNUICallback('requestPlayers', function(_data, cb)
  if DoesPlayerHavePermissionForCategory(-1, 'player') then
    TriggerServerEvent('EasyAdmin:GetInfinityPlayerList')
    CreateThread(function()
      local waitTime = 0
      repeat
        Wait(10)
        waitTime = waitTime + 1
      until playerlist or waitTime > 100
      NuiSendPlayerData()
    end)
  end
  cb({ ok = true })
end)

RegisterNUICallback('setResourceKvp', function(data, cb)
  if data and data.key and data.value then
    KvpSet(data.key, data.value)
  end
  cb({ ok = true })
end)

-- Request current update info from the server
RegisterNUICallback('requestUpdateInfo', function(_data, cb)
  TriggerServerEvent('EasyAdmin:requestUpdateInfo')
  -- Server responds asynchronously via the 'updateInfo' NUI event
  cb({ ok = true })
end)

-- ============================================================
-- "Press to toggle focus" keybind (Alt to unfold/fold)
-- ============================================================
-- The user can release the NUI into background mode (by clicking the
-- backdrop or via the unhook button) and then re-engage by pressing
-- the bound key. Pressing again toggles focus off (folds back in).
--
-- The default key is Left Alt (the `lmenu` VK code). FiveM only
-- supports RegisterKeyMapping on FiveM (not RedM), so we guard the
-- registration behind the existing RedM flag.

RegisterCommand('-ea_setFocused', function()
  if not nuiVisible then return end
  SetNuiFocused(not nuiFocused)
end, false)

-- Only register the key mapping on FiveM. We can't rely on the
-- global `RedM` flag yet because it is set inside a CreateThread in
-- client/gui_client.lua, which is loaded before us but whose body may
-- not have executed by the time we reach this point. We use the same
-- `CompendiumHorseObserved` existence check the original code uses
-- for the `easyadmin` keybind.
if not CompendiumHorseObserved then
  RegisterKeyMapping(
    '-ea_setFocused',
    'EasyAdmin - Toggle menu focus',
    'keyboard',
    'lmenu'
  )
end

-- ============================================================
-- Player warning overlay (full-screen, replaces txAdmin warning)
-- ============================================================
-- Server pushes warning data; client grants NUI focus so keyboard
-- input (hold-to-dismiss) is captured. The NUI calls back via
-- 'dismissWarning' to release focus.

RegisterNetEvent('EasyAdmin:showWarning')
AddEventHandler('EasyAdmin:showWarning', function(warnedBy, message, title, labelWarnedBy, labelDismiss) 
  -- Grab NUI focus so the overlay can capture keyboard input
  SetNuiFocus(true, true)
  SendNUIMessage({
    action = 'showWarning',
    data = {
      title = title,
      message = message,
      warnedBy = labelWarnedBy .. ' ' .. warnedBy,
      dismissText = labelDismiss,
    },
  })
end)
