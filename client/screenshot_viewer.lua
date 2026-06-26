------------------------------------
-- EasyAdmin Screenshot Viewer (Admin Side)
--
-- Receives screenshot data URIs from the server and forwards them
-- to the admin's NUI for display in the floating viewer window.
------------------------------------

--- Receive a screenshot data URI from the server.
--- @param dataUri string  The webp data URI of the captured screenshot.
--- @param playerName string Name of the player who was captured.
RegisterNetEvent('EasyAdmin:ScreenshotReceived', function(dataUri, playerName)
    SendNUIMessage({
        action = 'screenshot:received',
        data = {
            image = dataUri,
            playerName = playerName or 'Unknown',
        },
    })
end)
