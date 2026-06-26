------------------------------------
-- EasyAdmin: Session tracking (client)
-- Fires a single event when the player is fully loaded so the server
-- can record an accurate session start time.
------------------------------------

-- Wait until the player ped is loaded, then fire once
CreateThread(function()
    local playerPed = PlayerPedId()

    -- Wait for the ped to be a valid player (not a dummy/pending ped)
    while not IsPedAPlayer(playerPed) do
        Wait(100)
        playerPed = PlayerPedId()
    end

    -- Small delay to ensure network is fully initialised
    Wait(500)

    TriggerServerEvent('EasyAdmin:sessionStart')
end)
