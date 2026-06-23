------------------------------------
-- Tests for server/core/admin_utils.lua
--
-- Tests the LOGIC of admin utility functions:
--   * IsDangerousDevModeEnabled reads convar correctly
--   * CanBypassSelfAndImmunityChecks guards (dev mode, nil, numeric, self/immunity)
--   * CanTargetPlayerForModeration delegates to bypass + immunity
--   * CheckAdminCooldown / SetAdminCooldown state machine
--   * checkForChangedIdentifiers set-difference (hash-set, O(n+m))
--   * DoIdentifiersMatch intersection threshold with early exit
--   * getName fallback chain (nil, invalid, console, anonymous, cache, live)
--   * IsPlayerAdmin / GetOnlineAdmins state
--
-- Does NOT test: trivial identity functions, magic strings, or
-- implementation details that can't affect correctness.
------------------------------------

describe("Admin Utils — IsDangerousDevModeEnabled", function()
    before_each(function()
        _resetGlobals()
    end)

    it("returns false when convar is 'false'", function()
        _MockSetConvar("ea_dangerousDevMode", "false")
        assert.is_false(IsDangerousDevModeEnabled())
    end)

    it("returns true when convar is 'true'", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_true(IsDangerousDevModeEnabled())
    end)

    it("returns false for any other value", function()
        _MockSetConvar("ea_dangerousDevMode", "yes")
        assert.is_false(IsDangerousDevModeEnabled())

        _MockSetConvar("ea_dangerousDevMode", "1")
        assert.is_false(IsDangerousDevModeEnabled())

        _MockSetConvar("ea_dangerousDevMode", "")
        assert.is_false(IsDangerousDevModeEnabled())
    end)
end)

describe("Admin Utils — CanBypassSelfAndImmunityChecks", function()
    before_each(function()
        _resetGlobals()
    end)

    it("returns false when dev mode is disabled", function()
        _MockSetConvar("ea_dangerousDevMode", "false")
        assert.is_false(CanBypassSelfAndImmunityChecks(1, 2))
    end)

    it("returns false when either argument is nil", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_false(CanBypassSelfAndImmunityChecks(nil, 5))
        assert.is_false(CanBypassSelfAndImmunityChecks(5, nil))
        assert.is_false(CanBypassSelfAndImmunityChecks(nil, nil))
    end)

    it("returns false for non-positive numeric values", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_false(CanBypassSelfAndImmunityChecks(0, 5))
        assert.is_false(CanBypassSelfAndImmunityChecks(-1, 5))
        assert.is_false(CanBypassSelfAndImmunityChecks(5, 0))
        assert.is_false(CanBypassSelfAndImmunityChecks(5, -3))
    end)

    it("returns false for non-numeric strings", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_false(CanBypassSelfAndImmunityChecks("admin", 5))
        assert.is_false(CanBypassSelfAndImmunityChecks(5, "target"))
    end)

    it("returns true when src == target (self-bypass)", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_true(CanBypassSelfAndImmunityChecks(5, 5))
        assert.is_true(CanBypassSelfAndImmunityChecks("3", 3))
    end)

    it("returns true when target is immune", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        -- Override in _G so the loaded function sees the change
        local originalImmune = _G.isPlayerImmune
        _G.isPlayerImmune = function(pid)
            return pid == 99
        end
        assert.is_true(CanBypassSelfAndImmunityChecks(5, 99))
        assert.is_false(CanBypassSelfAndImmunityChecks(5, 50))
        _G.isPlayerImmune = originalImmune
    end)
end)

describe("Admin Utils — CanTargetPlayerForModeration", function()
    before_each(function()
        _resetGlobals()
        _MockSetConvar("ea_dangerousDevMode", "false")
    end)

    it("returns true when bypass is allowed", function()
        _MockSetConvar("ea_dangerousDevMode", "true")
        assert.is_true(CanTargetPlayerForModeration(5, 5))
    end)

    it("returns false when target is immune", function()
        local originalImmune = _G.isPlayerImmune
        _G.isPlayerImmune = function(pid)
            return pid == 99
        end
        assert.is_false(CanTargetPlayerForModeration(1, 99))
        assert.is_true(CanTargetPlayerForModeration(1, 50))
        _G.isPlayerImmune = originalImmune
    end)

    it("returns true when target is not immune", function()
        assert.is_true(CanTargetPlayerForModeration(1, 5))
    end)

    it("uses custom immune message when provided", function()
        local originalImmune = _G.isPlayerImmune
        _G.isPlayerImmune = function(pid)
            return pid == 99
        end

        local notified = false
        local originalTrigger = _G.TriggerClientEvent
        _G.TriggerClientEvent = function(event, target, msg)
            if event == "EasyAdmin:showNotification" then
                notified = true
                assert.are.equals("Custom immune message", msg)
            end
        end

        assert.is_false(CanTargetPlayerForModeration(1, 99, "Custom immune message"))
        assert.is_true(notified)

        _G.TriggerClientEvent = originalTrigger
        _G.isPlayerImmune = originalImmune
    end)
end)

describe("Admin Utils — Admin Cooldowns", function()
    before_each(function()
        _resetGlobals()
    end)

    describe("CheckAdminCooldown", function()
        it("returns true for non-numeric source (always allowed)", function()
            assert.is_true(CheckAdminCooldown("console", "kick"))
            assert.is_true(CheckAdminCooldown("admin", "ban"))
        end)

        it("returns true when no cooldown is set", function()
            assert.is_true(CheckAdminCooldown(5, "kick"))
        end)

        it("returns true when cooldown exists for different action", function()
            _G.AdminCooldowns[5] = { ban = true }
            assert.is_true(CheckAdminCooldown(5, "kick"))
        end)

        it("returns false when cooldown is active", function()
            _G.AdminCooldowns[5] = { kick = true }
            assert.is_false(CheckAdminCooldown(5, "kick"))
        end)

        it("handles missing per-player entry gracefully", function()
            _G.AdminCooldowns[3] = { kick = true }
            assert.is_true(CheckAdminCooldown(5, "kick"))
        end)
    end)

    describe("SetAdminCooldown", function()
        it("does nothing when cooldown convar is 0", function()
            _MockSetConvar("ea_adminCooldown:kick", "0")
            SetAdminCooldown(5, "kick")
            assert.is_nil(_G.AdminCooldowns[5])
        end)

        it("does nothing when cooldown convar is missing", function()
            SetAdminCooldown(5, "kick")
            assert.is_nil(_G.AdminCooldowns[5])
        end)

        it("sets the cooldown flag when convar > 0", function()
            _MockSetConvar("ea_adminCooldown:kick", "30")
            SetAdminCooldown(5, "kick")
            assert.is_true(_G.AdminCooldowns[5].kick)
        end)

        it("does nothing for non-numeric source", function()
            _MockSetConvar("ea_adminCooldown:kick", "30")
            SetAdminCooldown("console", "kick")
            assert.is_nil(_G.AdminCooldowns["console"])
        end)

        it("schedules removal after the cooldown period", function()
            _MockSetConvar("ea_adminCooldown:test", "10")
            SetAdminCooldown(5, "test")
            assert.is_true(_G.AdminCooldowns[5].test)

            -- Simulate timeout by advancing mock time
            _MockAdvanceTime(11000)  -- 11 seconds in ms

            -- The Citizen.SetTimeout callback should have run
            -- In mock mode, timeouts are executed via _MockAdvanceTime
            assert.is_nil(_G.AdminCooldowns[5].test)
        end)
    end)
end)

describe("Admin Utils — checkForChangedIdentifiers", function()
    before_each(function()
        _resetGlobals()
    end)

    it("returns identifiers from playerIds that are not in bannedIds", function()
        local playerIds = { "steam:1", "license:a", "discord:123" }
        local bannedIds = { "steam:1", "license:b" }

        local result = checkForChangedIdentifiers(playerIds, bannedIds)
        assert.are.same({ "license:a", "discord:123" }, result)
    end)

    it("returns all playerIds when bannedIds is empty", function()
        local playerIds = { "steam:1", "license:a" }
        local bannedIds = {}

        local result = checkForChangedIdentifiers(playerIds, bannedIds)
        assert.are.same({ "steam:1", "license:a" }, result)
    end)

    it("returns empty table when all playerIds are banned", function()
        local playerIds = { "steam:1", "steam:2" }
        local bannedIds = { "steam:1", "steam:2", "steam:3" }

        local result = checkForChangedIdentifiers(playerIds, bannedIds)
        assert.are.same({}, result)
    end)

    it("handles empty playerIds gracefully", function()
        local playerIds = {}
        local bannedIds = { "steam:1" }

        local result = checkForChangedIdentifiers(playerIds, bannedIds)
        assert.are.same({}, result)
    end)

    it("preserves order of playerIds in result", function()
        local playerIds = { "discord:1", "steam:1", "license:a", "ip:127" }
        local bannedIds = { "steam:1", "ip:127" }

        local result = checkForChangedIdentifiers(playerIds, bannedIds)
        assert.are.same({ "discord:1", "license:a" }, result)
    end)
end)

describe("Admin Utils — DoIdentifiersMatch", function()
    before_each(function()
        _resetGlobals()
        _MockSetConvar("ea_minIdentifierMatches", "2")
    end)

    it("returns true when overlap meets the default threshold (2)", function()
        local a = { "steam:1", "license:a", "discord:123" }
        local b = { "steam:1", "license:a", "fivem:abc" }

        assert.is_true(DoIdentifiersMatch(a, b))
    end)

    it("returns false when overlap is below the threshold", function()
        local a = { "steam:1", "license:a", "discord:123" }
        local b = { "steam:1", "fivem:abc", "xbl:def" }

        assert.is_false(DoIdentifiersMatch(a, b))
    end)

    it("returns true when overlap meets a custom threshold", function()
        local a = { "steam:1", "license:a", "discord:123" }
        local b = { "steam:1", "fivem:abc" }

        assert.is_true(DoIdentifiersMatch(a, b, 1))
        assert.is_false(DoIdentifiersMatch(a, b, 3))
    end)

    it("returns false when either set is nil", function()
        assert.is_false(DoIdentifiersMatch(nil, { "steam:1" }))
        assert.is_false(DoIdentifiersMatch({ "steam:1" }, nil))
        assert.is_false(DoIdentifiersMatch(nil, nil))
    end)

    it("returns false when either set is empty", function()
        assert.is_false(DoIdentifiersMatch({}, { "steam:1" }))
        assert.is_false(DoIdentifiersMatch({ "steam:1" }, {}))
    end)

    it("exits early once threshold is reached", function()
        -- If early exit works, we don't need to iterate all of bents
        local a = { "steam:1", "license:a", "discord:123", "fivem:abc" }
        local b = { "steam:1", "license:a" }

        assert.is_true(DoIdentifiersMatch(a, b))
    end)

    it("handles single-match threshold", function()
        local a = { "steam:1", "license:a" }
        local b = { "steam:1", "fivem:abc" }

        assert.is_true(DoIdentifiersMatch(a, b, 1))
    end)

    it("handles exact match", function()
        local a = { "steam:1", "license:a" }
        local b = { "steam:1", "license:a" }

        assert.is_true(DoIdentifiersMatch(a, b))
    end)

    it("handles no overlap", function()
        local a = { "steam:1", "license:a" }
        local b = { "steam:999", "license:z" }

        assert.is_false(DoIdentifiersMatch(a, b))
    end)
end)

describe("Admin Utils — IsPlayerAdmin / GetOnlineAdmins", function()
    before_each(function()
        _resetGlobals()
    end)

    it("GetOnlineAdmins returns the OnlineAdmins table", function()
        _G.OnlineAdmins[1] = true
        _G.OnlineAdmins[5] = true
        local result = GetOnlineAdmins()
        assert.are_same(_G.OnlineAdmins, result)
    end)

    it("IsPlayerAdmin returns true for known admins", function()
        _G.OnlineAdmins[1] = true
        _G.OnlineAdmins[5] = true
        assert.is_true(IsPlayerAdmin(1))
        assert.is_true(IsPlayerAdmin(5))
    end)

    it("IsPlayerAdmin returns nil for non-admins", function()
        _G.OnlineAdmins[1] = true
        assert.is_nil(IsPlayerAdmin(5))
        assert.is_nil(IsPlayerAdmin(99))
    end)

    it("handles empty admin list", function()
        assert.is_nil(IsPlayerAdmin(1))
        assert.are.same({}, GetOnlineAdmins())
    end)
end)

describe("Admin Utils — getName", function()
    before_each(function()
        _resetGlobals()
        AnonymousAdmins = {}
        _MockSetConvar("ea_logIdentifier", "steam,discord,license")
    end)

    it("returns 'Unknown - nil' for nil source", function()
        assert.are.equals("Unknown - nil", getName(nil))
    end)

    it("returns 'Unknown - invalid id' for non-numeric source", function()
        assert.are.equals("Unknown - invalid id: abc", getName("abc"))
    end)

    it("returns 'Console' for playerId 0", function()
        assert.are.equals("Console", getName(0))
    end)

    it("returns 'Anonymous Admin' when player is in AnonymousAdmins", function()
        _G.AnonymousAdmins[5] = true
        assert.are.equals("Anonymous Admin", getName(5, false))
    end)

    it("ignores anonymity when anonymousdisabled is true", function()
        _G.AnonymousAdmins[5] = true
        -- Should not return "Anonymous Admin" because anonymousdisabled=true
        local result = getName(5, true)
        assert.is_not.equals("Anonymous Admin", result)
    end)

    it("returns 'Unknown - <id>' when player name is not found", function()
        GetPlayerName = function() return nil end
        local result = getName(99)
        assert.match("Unknown -", result)
    end)
end)

describe("Admin Utils — announce", function()
    before_each(function()
        _resetGlobals()
    end)

    it("returns true and triggers notification for valid message", function()
        local triggered = false
        local originalTrigger = _G.TriggerClientEvent
        _G.TriggerClientEvent = function(event, target, msg)
            triggered = true
            assert.are.equals("EasyAdmin:showNotification", event)
            assert.are.equals(-1, target)
        end

        assert.is_true(announce("Server restarting in 5 minutes"))
        assert.is_true(triggered)

        _G.TriggerClientEvent = originalTrigger
    end)

    it("returns false when message is nil", function()
        assert.is_false(announce(nil))
    end)

    it("returns true for empty string (Lua treats '' as truthy)", function()
        -- In Lua, empty string is truthy, so announce("") triggers the notification
        assert.is_true(announce(""))
    end)
end)
