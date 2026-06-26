-- Client-side i18n: receive translations from server
-- Replaces the handlers previously in client/admin_client.lua
RegisterNetEvent('EasyAdmin:SetLanguage', function(strings, language)
    I18nSet(strings, language)
    -- Push to NUI (same contract as today)
    SendNUIMessage({
        action = 'setLanguage',
        data = { strings = strings, lang = language }
    })
end)
