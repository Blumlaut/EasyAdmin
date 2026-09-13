------------------------------------
-- Tests for server/map.lua
--
-- Tests the LOGIC of the server-side position collection:
--   * CollectMapPositions returns authoritative coords for spawned players
--   * skips players without a ped (loading screen / not yet spawned)
--   * skips players whose ped does not exist
--   * reports the requesting admin as selfId
--   * handles an empty player list
--
-- The stream loop itself (RegisterNetEvent / Citizen.CreateThread wiring)
-- is not tested: it is pure FiveM integration with no decisions.
------------------------------------

describe("Map — CollectMapPositions", function()
    before_each(function()
        _resetGlobals()

        -- Default entity stubs; tests override via _G where needed.
        _G.GetPlayerPed = function(_src) return 0 end
        _G.DoesEntityExist = function(_ped) return false end
        _G.GetEntityCoords = function(_ped) return 0, 0, 0 end

        -- Load the file; event/thread registration are no-ops in the mock.
        local chunk = assert(loadfile(_TESTS_DIR .. "/../server/map.lua"))
        chunk()
    end)

    local function positionOf(result, id)
        for _, p in ipairs(result.players) do
            if p.id == id then return p end
        end
        return nil
    end

    it("returns authoritative coords for every spawned player", function()
        local a = _MockAddPlayer("Alice")
        local b = _MockAddPlayer("Bob")
        local c = _MockAddPlayer("Carol")
        local coords = {
            [a] = { 10, 20, 30 },
            [b] = { -42.5, 5566, 812 },
            [c] = { 0, 0, 0 },
        }
        _G.GetPlayerPed = function(src) return 1000 + src end
        _G.DoesEntityExist = function(_ped) return true end
        _G.GetEntityCoords = function(ped)
            local src = ped - 1000
            local c = coords[src]
            return c[1], c[2], c[3]
        end

        local result = CollectMapPositions(b)

        assert.are.equals(3, #result.players)
        assert.are.equals(10, positionOf(result, a).x)
        assert.are.equals(812, positionOf(result, b).z)
        assert.are.equals(0, positionOf(result, c).y)
    end)

    it("skips players without a ped (loading screen)", function()
        local a = _MockAddPlayer("Alice")
        local b = _MockAddPlayer("Bob")
        _G.GetPlayerPed = function(src)
            if src == a then return 0 end -- not spawned yet
            return 2000 + src
        end
        _G.DoesEntityExist = function(_ped) return true end
        _G.GetEntityCoords = function(ped)
            local src = ped - 2000
            return src * 1, src * 2, src * 3
        end

        local result = CollectMapPositions(a)

        assert.are.equals(1, #result.players)
        assert.is_nil(positionOf(result, a))
        assert.are.equals(b, result.players[1].id)
    end)

    it("skips players whose ped does not exist", function()
        local a = _MockAddPlayer("Alice")
        local b = _MockAddPlayer("Bob")
        _G.GetPlayerPed = function(src) return 3000 + src end
        _G.DoesEntityExist = function(ped)
            return ped ~= 3000 + b -- Bob's ped is gone
        end
        _G.GetEntityCoords = function(ped)
            local src = ped - 3000
            return src, src, src
        end

        local result = CollectMapPositions(b)

        assert.are.equals(1, #result.players)
        assert.are.equals(a, result.players[1].id)
    end)

    it("reports the requesting admin as selfId", function()
        _MockAddPlayer("Alice")
        local b = _MockAddPlayer("Bob")

        local result = CollectMapPositions(b)

        assert.are.equals(b, result.selfId)
    end)

    it("returns an empty player list when nobody is connected", function()
        local result = CollectMapPositions(1)

        assert.are.equals(0, #result.players)
        assert.are.equals(1, result.selfId)
    end)
end)
