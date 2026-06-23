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

-- Reset these on each test run to avoid cross-test pollution
OnlineAdmins = {}
blacklist = {}
banIndex = {}
reports = {}
permissions = {}
MessageShortcuts = {}
maxRightTextWidth = 50
ChatReminders = {}
AdminCooldowns = {}
AnonymousAdmins = {}
moderationNotification = "https://discord.com/api/webhooks/test"
reportNotification = "false"

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
-- I18n: initialize with empty translations (server context)
-- ============================================================
I18nLoad()  -- Will use empty table since no language file in test context

-- ============================================================
-- Global helpers used by tests
-- ============================================================
function _resetGlobals()
    OnlineAdmins = {}
    blacklist = {}
    banIndex = {}
    reports = {}
    AdminCooldowns = {}
    AnonymousAdmins = {}
    _MockClearConvars()
    _MockClearPlayers()
    _MockClearFiles()
    _MockClearKvp()
end
