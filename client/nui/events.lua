------------------------------------
-- EasyAdmin NUI: events
-- Wires server -> client events to NUI messages
------------------------------------

local M = {}

local core = require('nui.core')

-- Mirror the server player list to the NUI when the menu is open.
RegisterNetEvent('EasyAdmin:GetInfinityPlayerList', function(_pl)
  if core.isVisible() then
    CreateThread(function()
      Wait(50)
      core.sendPlayerData()
    end)
  end
end)

-- Push frozen/muted state to the NUI.
RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(playerId, state)
  FrozenPlayers[playerId] = state
  if core.isVisible() then core.sendPlayerData() end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(playerId, state)
  MutedPlayers[playerId] = state
  if core.isVisible() then core.sendPlayerData() end
end)

-- Cleanup focus on resource stop
AddEventHandler('onClientResourceStop', function(resource)
  if resource == GetCurrentResourceName() and core.isVisible() then
    SetNuiFocus(false, false)
  end
end)

return M
