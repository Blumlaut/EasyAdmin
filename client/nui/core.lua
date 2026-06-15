------------------------------------
-- EasyAdmin NUI: core
-- Visibility, focus, menu toggle
------------------------------------

local M = {}

local nuiVisible = false

function M.isVisible()
  return nuiVisible
end

function M.isNuiEnabled()
  return GetConvar('ea_useNUI', 'true') == 'true'
end

function M.toggle()
  if not isAdmin then
    TriggerServerEvent('EasyAdmin:amiadmin')
    CreateThread(function()
      local waitTime = 0
      repeat
        Wait(10)
        waitTime = waitTime + 1
      until isAdmin or waitTime > 100
      if not isAdmin then return end
      M.toggle()
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
      M.sendPlayerData()
    end)
  else
    SetNuiFocus(false, false)
  end
end

function M.sendPlayerData()
  if not nuiVisible then return end
  local perms = permissions or {}
  local players = {}
  if perms.player then
    players = M.buildPlayerList()
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
end

function M.buildPlayerList()
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

function M.closeMenu()
  nuiVisible = false
  SetNuiFocus(false, false)
  SendNUIMessage({
    action = 'menuToggle',
    data = { visible = false },
  })
end

M.callbacks = {
  closeMenu = function(_data, cb)
    M.closeMenu()
    cb({ ok = true })
  end,
  requestPlayers = function(_data, cb)
    if DoesPlayerHavePermissionForCategory(-1, 'player') then
      TriggerServerEvent('EasyAdmin:GetInfinityPlayerList')
      CreateThread(function()
        local waitTime = 0
        repeat
          Wait(10)
          waitTime = waitTime + 1
        until playerlist or waitTime > 100
        M.sendPlayerData()
      end)
    end
    cb({ ok = true })
  end,
  setResourceKvp = function(data, cb)
    if data and data.key and data.value then
      SetResourceKvp(data.key, tostring(data.value))
    end
    cb({ ok = true })
  end,
  copyToClipboard = function(data, cb)
    if data and data.text then
      -- Best-effort clipboard write (web API used by FiveM NUI)
      SendNUIMessage({ action = 'clipboardCopy', data = { text = data.text } })
    end
    cb({ ok = true })
  end,
}

return M
