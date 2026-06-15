------------------------------------
-- EasyAdmin NUI: events
-- Wires server -> client events to NUI messages
------------------------------------

-- Mirror the server player list to the NUI when the menu is open.
RegisterNetEvent('EasyAdmin:GetInfinityPlayerList', function(_pl)
  if IsNuiVisible() then
    CreateThread(function()
      Wait(50)
      NuiSendPlayerData()
    end)
  end
end)

-- Push frozen/muted state to the NUI.
RegisterNetEvent('EasyAdmin:SetPlayerFrozen', function(playerId, state)
  FrozenPlayers[playerId] = state
  if IsNuiVisible() then NuiSendPlayerData() end
end)

RegisterNetEvent('EasyAdmin:SetPlayerMuted', function(playerId, state)
  MutedPlayers[playerId] = state
  if IsNuiVisible() then NuiSendPlayerData() end
end)

-- Cleanup focus on resource stop
AddEventHandler('onClientResourceStop', function(resource)
  if resource == GetCurrentResourceName() and IsNuiVisible() then
    SetNuiFocus(false, false)
  end
end)
