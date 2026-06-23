# Writing Lua Tests

This project uses **[busted](https://lunarmodules.github.io/busted/)** for Lua unit testing. Tests run outside of FiveM using a mock layer that stubs all FXServer-specific globals (`GetConvar`, `TriggerClientEvent`, `json`, etc.).

## Running Tests

From the project root:

```bash
./tests/run.sh tests/
```

Or with TAP output:

```bash
./tests/run.sh tests/ --tap
```

Run a single test file:

```bash
./tests/run.sh tests/banlist_spec.lua
```

Filter by test name:

```bash
./tests/run.sh tests/ --filter="duplicate"
```

## Project Structure

```
tests/
├── busted.yml          # Busted config (helpers, output format)
├── bootstrap.lua       # Loaded before every spec — sets up mocks + shared globals
├── fivem_mock.lua      # FiveM global stubs (GetConvar, TriggerClientEvent, json, etc.)
├── WRITING_TESTS.md    # This file
└── *_spec.lua          # Test specs (one per module or feature)
```

## What to Test

**Test LOGIC, not identity.** A test should verify that a function makes the right *decision* given certain inputs — not just that it returns *something*.

### ✅ Good Tests (testing decisions and behavior)

```lua
-- Tests that the counter increments correctly
it("increments ban ID by 1 on each call", function()
    assert.are.equals(10, getNextId())
    assert.are.equals(11, getNextId())
    assert.are.equals(12, getNextId())
end)

-- Tests that self-ban detection handles type coercion
it("returns true for same numeric ID as string and number", function()
    assert.is_true(IsSelfBan("5", 5))
end)

-- Tests that expired bans are removed
it("removes bans past their expiry time", function()
    -- ... setup ...
    assert.are.equals(1, #remainingBans)
    assert.are.equals(2, remainingBans[1].banid)
end)

-- Tests that duplicate IDs are reassigned
it("reassigns duplicate ban IDs to fresh values", function()
    -- ... setup with duplicate IDs ...
    assert.is_false(seen[banlist[3].banid], "Duplicate ID found")
end)

-- Tests edge cases and boundary conditions
it("handles banlist with no banid field gracefully", function()
    -- ... setup with missing fields ...
    assert.are.equals(8, nextId)
end)
```

### ❌ Bad Tests (testing obvious things)

```lua
-- DON'T: Tests that a function returns its input unchanged
it("returns the string", function()
    assert.is_true(type(getSomeString()) == "string")
end)

-- DON'T: Tests magic constants
it("returns the right constant", function()
    assert.are.equals(10444633200, getPermanentExpiry())
    -- This will always be true. The constant is the constant.
end)

-- DON'T: Tests that a function doesn't error (without testing behavior)
it("runs without error", function()
    assert.has.no.errors(function() doSomething() end)
    -- This tells us nothing about whether it did the right thing.
end)

-- DON'T: Tests implementation details that can't affect correctness
it("calls GetConvar", function()
    -- Mocking GetConvar and asserting it was called is an implementation detail.
    -- Test the *outcome* of the convar check, not the check itself.
end)
```

## Test Philosophy

1. **Test decisions, not data.** If a function chooses between two paths based on input, test that it picks the right one. If a function just returns a hardcoded string, there's nothing to test.

2. **Test edge cases.** Empty tables, nil values, type mismatches, boundary values — these are where bugs hide.

3. **Test invariants.** "After merging two entries, only the primary remains indexed." "After removing expired bans, all remaining bans have valid expiry." These are properties that should always hold.

4. **Test the optimization, not the original.** If you replaced an O(n²) algorithm with O(n), test that the result is correct — the performance improvement is verified by code review, not tests.

5. **One assertion per concept.** Each `it()` block should test one logical behavior. If you need more than 3 assertions to describe the expected state, consider splitting into multiple tests.

## Using the Mock Layer

The `fivem_mock.lua` file provides stubs for all FiveM globals. Test helpers are prefixed with `_Mock`:

```lua
-- Set a convar for a test
_MockSetConvar("ea_useTokenIdentifiers", "true")

-- Add a mock player
local src = _MockAddPlayer("TestUser", { "steam:123", "license:abc" })

-- Set a file for LoadResourceFile to return
_MockSetFile("banlist.json", json.encode({ { banid = 1 } }))
```

### Available Mock Helpers

| Helper | Purpose |
|---|---|
| `_MockSetConvar(key, value)` | Set a convar value |
| `_MockClearConvars()` | Reset all convars |
| `_MockAddPlayer(name, identifiers, tokens)` | Add a mock player, returns source ID |
| `_MockRemovePlayer(src)` | Remove a mock player |
| `_MockClearPlayers()` | Remove all mock players |
| `_MockSetFile(path, content)` | Set content for `LoadResourceFile` |
| `_MockClearFiles()` | Clear all mock files |
| `_MockClearKvp()` | Clear mock KVP store |
| `_MockAdvanceTime(ms)` | Execute queued `Citizen.SetTimeout` callbacks whose delay ≤ ms |
| `_MockClearTimeouts()` | Clear all queued timeouts |
| `_resetGlobals()` | Reset all shared global state (call in `before_each`) |

### Shared State and Busted Scoping

Busted 2.x loads helper files and spec files in separate `_ENV` scopes. Functions loaded via `dofile()` in the bootstrap capture the bootstrap's `_ENV`, while test code runs in the spec's `_ENV`.

**Always access shared tables via `_G`** to ensure the test and the function under test reference the same table:

```lua
-- ✅ Correct: both test and function see _G.AdminCooldowns
_G.AdminCooldowns[5] = { kick = true }
assert.is_true(CheckAdminCooldown(5, "kick"))

-- ❌ Wrong: test writes to spec's _ENV, function reads bootstrap's _ENV
AdminCooldowns[5] = { kick = true }  -- Different table!
```

Similarly, when overriding mock functions that loaded functions depend on:

```lua
-- ✅ Correct: override in _G so loaded functions see the change
local original = _G.isPlayerImmune
_G.isPlayerImmune = function(pid) return pid == 99 end
-- ... test ...
_G.isPlayerImmune = original

-- ❌ Wrong: overrides spec's _ENV, loaded function uses bootstrap's _ENV
isPlayerImmune = function(pid) return pid == 99 end
```

### Timeouts

`Citizen.SetTimeout` queues callbacks instead of executing them immediately. Use `_MockAdvanceTime(ms)` to simulate time passing:

```lua
SetAdminCooldown(5, "kick")  -- Sets 30s timeout
assert.is_true(_G.AdminCooldowns[5].kick)  -- Still active

_MockAdvanceTime(31000)  -- Advance 31 seconds
assert.is_nil(_G.AdminCooldowns[5].kick)  -- Cleared
```

## Writing a New Spec

1. Create `tests/<module>_spec.lua`
2. Use `describe()` blocks to group related tests
3. Use `before_each()` to reset state via `_resetGlobals()`
4. If testing a function that has FiveM side effects on load (e.g., `RegisterServerEvent`), extract the pure logic and test it directly — don't try to load the full file
5. Run with `busted tests/` to verify

## Example Spec Template

```lua
describe("Module — Feature", function()
    before_each(function()
        _resetGlobals()
        -- Set up any test-specific state
    end)

    describe("sub-feature", function()
        it("does the right thing given normal input", function()
            -- Arrange
            local input = { ... }

            -- Act
            local result = someFunction(input)

            -- Assert
            assert.are.equals(expected, result)
        end)

        it("handles edge case gracefully", function()
            -- ...
        end)
    end)
end)
```
