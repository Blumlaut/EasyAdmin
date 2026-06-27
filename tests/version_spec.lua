------------------------------------
-- Tests for parseVersion() and compareVersions()
-- Covers float-based versions ("8.0"), semver ("1.2.3"),
-- v-prefixed ("v1.2.3"), and pre-release suffixes ("8.0a1")
------------------------------------

describe("parseVersion", function()
    before_each(function()
        _resetGlobals()
    end)

    it("parses float-based version strings", function()
        assert.are.same({8, 0}, parseVersion("8.0"))
        assert.are.same({6, 52}, parseVersion("6.52"))
        assert.are.same({1}, parseVersion("1"))
    end)

    it("parses full semver strings", function()
        assert.are.same({1, 2, 3}, parseVersion("1.2.3"))
        assert.are.same({8, 0, 1}, parseVersion("8.0.1"))
    end)

    it("parses versions with more than 3 parts", function()
        assert.are.same({1, 0, 0, 5}, parseVersion("1.0.0.5"))
    end)

    it("strips leading 'v' prefix", function()
        assert.are.same({1, 2, 3}, parseVersion("v1.2.3"))
        assert.are.same({8, 0}, parseVersion("v8.0"))
    end)

    it("extracts all numeric groups from strings with suffixes", function()
        -- Non-numeric chars are ignored; all digit groups are extracted
        -- "8.0a1" -> {8, 0, 1} (the 'a' is ignored but '1' is a digit group)
        assert.are.same({8, 0, 1}, parseVersion("8.0a1"))
        assert.are.same({1, 2, 3}, parseVersion("1.2.3-beta"))
        assert.are.same({2, 0, 0, 1}, parseVersion("2.0.0-rc.1"))
    end)

    it("handles nil input gracefully", function()
        assert.are.same({}, parseVersion(nil))
    end)

    it("handles empty string gracefully", function()
        assert.are.same({}, parseVersion(""))
    end)

    it("handles non-numeric strings gracefully", function()
        assert.are.same({}, parseVersion("latest"))
        assert.are.same({}, parseVersion("master"))
    end)
end)

describe("compareVersions", function()
    before_each(function()
        _resetGlobals()
    end)

    describe("float-based versions (current EasyAdmin format)", function()
        it("detects outdated versions", function()
            assert.are.equals(-1, compareVersions("6.52", "8.0"))
            assert.are.equals(-1, compareVersions("7.9", "8.0"))
            assert.are.equals(-1, compareVersions("1.0", "2.0"))
        end)

        it("detects up-to-date versions", function()
            assert.are.equals(0, compareVersions("8.0", "8.0"))
            assert.are.equals(0, compareVersions("6.52", "6.52"))
        end)

        it("detects newer versions", function()
            assert.are.equals(1, compareVersions("8.0", "6.52"))
            assert.are.equals(1, compareVersions("9.0", "8.0"))
        end)
    end)

    describe("semver versions (future-proof)", function()
        it("compares patch versions correctly", function()
            assert.are.equals(-1, compareVersions("1.2.3", "1.2.4"))
            assert.are.equals(1, compareVersions("1.2.4", "1.2.3"))
            assert.are.equals(0, compareVersions("1.2.3", "1.2.3"))
        end)

        it("compares minor versions correctly", function()
            assert.are.equals(-1, compareVersions("1.2.0", "1.3.0"))
            assert.are.equals(1, compareVersions("1.3.0", "1.2.0"))
        end)

        it("compares major versions correctly", function()
            assert.are.equals(-1, compareVersions("1.0.0", "2.0.0"))
            assert.are.equals(1, compareVersions("2.0.0", "1.0.0"))
        end)

        it("handles v-prefixed semver", function()
            assert.are.equals(-1, compareVersions("v1.2.3", "v1.2.4"))
            assert.are.equals(0, compareVersions("v1.2.3", "1.2.3"))
            assert.are.equals(0, compareVersions("1.2.3", "v1.2.3"))
        end)
    end)

    describe("mixed format comparison (float vs semver)", function()
        it("treats '8.0' as equivalent to '8.0.0'", function()
            assert.are.equals(0, compareVersions("8.0", "8.0.0"))
            assert.are.equals(0, compareVersions("8.0.0", "8.0"))
        end)

        it("detects '8.0' as outdated when remote is '8.0.1'", function()
            assert.are.equals(-1, compareVersions("8.0", "8.0.1"))
        end)

        it("detects '8.0.1' as newer than '8.0'", function()
            assert.are.equals(1, compareVersions("8.0.1", "8.0"))
        end)
    end)

    describe("nil and edge cases", function()
        it("returns 0 when either version is nil", function()
            assert.are.equals(0, compareVersions(nil, "1.0"))
            assert.are.equals(0, compareVersions("1.0", nil))
            assert.are.equals(0, compareVersions(nil, nil))
        end)

        it("returns 0 when both versions are empty strings", function()
            assert.are.equals(0, compareVersions("", ""))
        end)

        it("handles non-numeric versions as equal (both empty)", function()
            assert.are.equals(0, compareVersions("latest", "master"))
        end)
    end)
end)
