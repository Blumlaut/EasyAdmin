------------------------------------
-- EasyAdmin NUI: core
-- Visibility, focus, menu toggle, shared helpers
------------------------------------

local nuiVisible = false

function IsNuiVisible()
  return nuiVisible
end

function IsNuiEnabled()
  return GetConvar('ea_useNUI', 'true') == 'true'
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
    SetNuiFocus(true, true)
    -- Send current settings to NUI
    NuiSendSettings()
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
    SetNuiFocus(false, false)
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
end

function NuiBuildPlayerList()
  local playerData = {}

  if (RedM and settings.infinity) or not RedM then
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

  -- Ensure defaults exist
  if not GetResourceKvpString('ea_highContrast') then
    SetResourceKvp('ea_highContrast', 'false')
  end
  if not GetResourceKvpInt('ea_fontSize') then
    SetResourceKvpInt('ea_fontSize', 100)
  end
  if not GetResourceKvpString('ea_menuSize') then
    SetResourceKvp('ea_menuSize', 'default')
  end

  SendNUIMessage({
    action = 'initSettings',
    data = {
      anonymous = false, -- anonymous is per-session, not persisted
      highContrast = GetResourceKvpString('ea_highContrast') == 'true',
      fontSize = GetResourceKvpInt('ea_fontSize') or 100,
      menuSize = GetResourceKvpString('ea_menuSize') or 'default',
    },
  })
end

function NuiCloseMenu()
  nuiVisible = false
  SetNuiFocus(false, false)
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
    SetResourceKvp(data.key, tostring(data.value))
  end
  cb({ ok = true })
end)

RegisterNUICallback('copyToClipboard', function(data, cb)
  if data and data.text then
    SendNUIMessage({ action = 'clipboardCopy', data = { text = data.text } })
  end
  cb({ ok = true })
end)
