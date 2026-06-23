-- Send translations to all players on join (not gated behind admin handshake)
-- This ensures GetLocalisedText() works on the client before the menu is opened
AddEventHandler('playerAddedToServer', function()
    local src = source
    local strings, lang = I18nGetTranslations()
    if strings then
        TriggerClientEvent('EasyAdmin:SetLanguage', src, strings, lang)
    end
end)
