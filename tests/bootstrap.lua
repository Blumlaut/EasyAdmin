------------------------------------
-- Bootstrap: load FiveM mocks + shared globals before each test spec
-- Loaded by busted via helpers in busted.yml
------------------------------------

-- Resolve the tests directory
-- busted runs from project root, so "tests/" is the working directory for specs
local bootstrapPath = debug.getinfo(1, "S").source:match("^@(.*)")
_TESTS_DIR = bootstrapPath:match("(.*)/bootstrap%.lua$") or "tests"

-- Load the FiveM mock layer first
dofile(_TESTS_DIR .. "/fivem_mock.lua")

-- ============================================================
-- Shared global state (mirrors what fxmanifest.lua loads)
-- ============================================================
-- Use _G to ensure all specs and loaded modules share the same tables
-- (busted 2.x runs specs in separate _ENV scopes)
-- ============================================================

_G.OnlineAdmins = {}
_G.blacklist = {}
_G.banIndex = {}
_G.reports = {}
_G.permissions = {}
_G.MessageShortcuts = {}
_G.maxRightTextWidth = 50
_G.ChatReminders = {}
_G.AdminCooldowns = {}
_G.AnonymousAdmins = {}
_G.moderationNotification = "https://discord.com/api/webhooks/test"
_G.reportNotification = "false"

-- Also set on _ENV so modules loaded via dofile() in busted's _ENV see them
-- (busted 2.x loads helpers in a custom _ENV that may not index into _G)
OnlineAdmins = _G.OnlineAdmins
blacklist = _G.blacklist
banIndex = _G.banIndex
reports = _G.reports
permissions = _G.permissions
MessageShortcuts = _G.MessageShortcuts
maxRightTextWidth = _G.maxRightTextWidth
ChatReminders = _G.ChatReminders
AdminCooldowns = _G.AdminCooldowns
AnonymousAdmins = _G.AnonymousAdmins
moderationNotification = _G.moderationNotification
reportNotification = _G.reportNotification

-- ============================================================
-- Load shared utility functions
-- ============================================================
dofile(_TESTS_DIR .. "/../shared/util_shared.lua")
dofile(_TESTS_DIR .. "/../shared/i18n.lua")
dofile(_TESTS_DIR .. "/../shared/kvp.lua")
dofile(_TESTS_DIR .. "/../shared/permissions.lua")

-- ============================================================
-- Load server-side file utils
-- ============================================================
dofile(_TESTS_DIR .. "/../server/lib/file_utils.lua")

-- ============================================================
-- Load server-side admin utils (pure functions + helpers)
-- ============================================================
dofile(_TESTS_DIR .. "/../server/core/admin_utils.lua")

-- ============================================================
-- I18n: initialize with empty translations (server context)
-- ============================================================
I18nLoad()  -- Will use empty table since no language file in test context

-- ============================================================
-- Global helpers used by tests
-- ============================================================
-- Clear a table in-place (preserves the reference for functions that captured it)
local function clearTable(t)
    for k in pairs(t) do
        t[k] = nil
    end
end

function _resetGlobals()
    clearTable(_G.OnlineAdmins)
    clearTable(_G.blacklist)
    clearTable(_G.banIndex)
    clearTable(_G.reports)
    clearTable(_G.AdminCooldowns)
    clearTable(_G.AnonymousAdmins)
    _MockClearConvars()
    _MockClearPlayers()
    _MockClearFiles()
    _MockClearKvp()
    _MockClearTimeouts()
end
