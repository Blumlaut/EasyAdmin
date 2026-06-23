-- ============================================================
-- EasyAdmin i18n — shared module (server + client)
-- Loaded as shared_script, MUST load BEFORE other shared scripts
-- ============================================================

local _lang = 'en'
local _translations = nil  -- nil = not yet loaded

--- Load translations from language file (server-only, uses LoadResourceFile)
--- Call once during server startup from server/init/
--- @return boolean success
function I18nLoad()
    if not IsDuplicityVersion() then return false end
    if _translations ~= nil then return true end  -- already loaded

    local langName = GetConvar('ea_LanguageName', 'en')
    local strfile = LoadResourceFile(GetCurrentResourceName(), 'language/' .. langName .. '.json')

    if strfile then
        local decoded = json.decode(strfile)
        if decoded and type(decoded) == 'table' then
            _translations = decoded
            _lang = langName
            return true
        end
    end

    -- Fallback: empty table means every key falls through to itself
    _translations = {}
    return false
end

--- Set translations directly (client-side, called from SetLanguage handler)
--- @param strings table
--- @param language string
function I18nSet(strings, language)
    _translations = strings or {}
    _lang = language or _lang
end

--- Translate a key with optional named placeholders.
--- Falls back to the key itself if not found or translations not loaded.
--- Never returns nil, never returns error messages.
--- @param key string
--- @param params table?
--- @return string
function I18nT(key, params)
    if not key or key == '' then return '' end

    local template = _translations and _translations[key]
    if not template then
        template = key  -- key-as-fallback (same as NUI and bot)
    end

    if params and type(params) == 'table' then
        template = template:gsub('{(.-)}', function(m)
            return tostring(params[m] or '{' .. m .. '}')
        end)
    end

    return template
end

--- Get current language code
--- @return string
function I18nGetLang()
    return _lang
end

--- Get translations table and language code (for server-to-client push)
--- @return table, string
function I18nGetTranslations()
    return _translations, _lang
end

-- Backward-compatible global alias (all existing call sites + export)
GetLocalisedText = I18nT
exports('GetLocalisedText', GetLocalisedText)
