# Plugin API

Since version 5.9, **EasyAdmin** supports the creation of **custom plugins**. These allow developers to add new items to the EasyAdmin menu and implement custom functionality. This document serves as a **quick-start guide** for developers.

---

## Introduction

EasyAdmin is built on [Frazzle's NativeUILua](https://github.com/FrazzIe/NativeUILua). When creating menus, ensure you follow the NativeUI API correctly.

> 🚨 **Important**: Menu items are created when their corresponding button is pressed. Menus can be generated multiple times, so **do not store state in global variables** that might affect future menu generations.

---

## Boilerplate Script

Here's a basic template to help you get started with creating an EasyAdmin plugin:

```lua
local somevalue = false

-- Functions MUST be prefixed with `local`

local function playerOptions(playerId)
    local thisItem = NativeUI.CreateItem("Example Item", "Player ID is " .. playerId)
    thisPlayer:AddItem(thisItem) -- `thisPlayer` is a global variable
    thisItem.Activated = function(ParentMenu, SelectedItem)
        -- Your client-side logic goes here
        somevalue = true -- Example state change
    end

    if DoesPlayerHavePermission(-1, "player.kick") then
        local thisExampleMenu = _menuPool:AddSubMenu(thisPlayer, "Example Submenu", "", true)
        thisExampleMenu:SetMenuWidthOffset(menuWidth)

        local thisItem = NativeUI.CreateItem("Example Submenu Item", "")
        thisExampleMenu:AddItem(thisItem)
    end
end

local function mainMenuOptions()
    error("help me I have become self-aware") -- Example error
end

local function cachedMenuOptions()
    -- Logic for cached players
	-- uses the same menu as the player menu
end

local function serverMenuOptions()
	local thisItem = NativeUI.CreateItem("Example Item", "Example Description")
	servermanagement:AddItem(thisItem)
	thisItem.Activated = function(ParentMenu,SelectedItem)
		local result = displayKeyboardInput("FMMC_KEY_TIP8", "", 128)
		
		if result then
			print("Keyboard input: " .. result)
		else
			print("Keyboard input cancelled")
		end
	end
end

local function settingsMenuOptions()
    -- Logic for settings menu, Menu ID is "settingsMenu"
end

local function menuRemoved()
    somevalue = false -- Reset state
end

-- Plugin metadata
local pluginData = {
    name = "Demo",
    functions = {
        mainMenu = mainMenuOptions,
        playerMenu = playerOptions,
        cachedMenu = cachedMenuOptions,
        serverMenu = serverMenuOptions,
        settingsMenu = settingsMenuOptions,
        menuRemoved = menuRemoved,
    }
}

addPlugin(pluginData) -- Registers the plugin with EasyAdmin
```

---

## Adding Custom Permissions

Permissions can be added using a shared Lua file with the following structure:

```lua
Citizen.CreateThread(function()
    repeat
        Wait(0)
    until permissions
    permissions["your.custom.permission"] = false
end)
```

> ⚠️ All permissions are automatically prefixed with `easyadmin`, so `your.custom.permission` becomes `easyadmin.your.custom.permission`.

You can check if a user has a permission server-side using:
```lua
DoesPlayerHavePermission(source, "your.custom.permission")
```
Or client-side using:
```lua
DoesPlayerHavePermission(-1, "your.custom.permission")
```

---

## Porting Plugins to 6.8

Porting your plugin to version 6.8 is straightforward. Replace event handlers with local functions:

```diff
- AddEventHandler("EasyAdmin:BuildPlayerOptions", function(playerId)
+ local function playerOptions(playerId)

- AddEventHandler("EasyAdmin:MenuRemoved", function()
+ local function menuRemoved()
```

After updating your functions, add the plugin registration block at the bottom of your script:

```lua
local pluginData = {
    name = "Demo",
    functions = {
        mainMenu = mainMenuOptions,
        playerMenu = playerOptions,
        cachedMenu = cachedMenuOptions,
        serverMenu = serverMenuOptions,
        settingsMenu = settingsMenuOptions,
        menuRemoved = menuRemoved,
    }
}

addPlugin(pluginData)
```

> 📌 Ensure your function names in the `functions` table match the actual function names. For example, if your function is named `generatePlayerMenu`, the key should be `playerMenu = generatePlayerMenu`.

---

## Replacing Notifications

EasyAdmin allows you to replace its built-in notifications with custom ones.

To do this, cancel the `EasyAdmin:receivedNotification` event and forward the notification text to your custom script.

Example:
- See [EasyAdmin/plugins/notifications](https://github.com/Blumlaut/EasyAdmin/tree/master/plugins/notifications) for working implementations.

> 🤯 If two notification systems are active at the same time, **remove the one you don’t want** from the `plugins` folder.

---

## Functions and Events

### Utility Functions

| Function | Arguments | Description |
|----------|-----------|-------------|
| `PrintDebugMessage` | content, level | Prints debug messages to logs if the player's log level is appropriate |
| `displayKeyboardInput` | title, defaultText, maxLength | Displays a keyboard input dialog (added in 6.4) |
| `copyToClipboard` | text | Copies text to the player's clipboard |
| `DoesPlayerHavePermission` | player, permission | Checks if a player has a specific permission |
| `DoesPlayerHavePermissionForCategory` | player, permission | Checks if the player has **any** permission in a category |
| `GetVersion` | N/A | Returns the EasyAdmin version and whether it's from a release or master branch |
| `GetLocalisedText` | string | Returns a translated string |
| `formatDateString` | unix timestamp | Converts a timestamp to a readable date/time |
| `math.round` | number, decimals | Rounds a number to a specific decimal place |
| `string.split` | string, separator | Splits a string using a separator |
| `string.reverse` | string | Reverses a string |
| `UIMenu:RefreshIndexRecursively()` | N/A | Forces menu index refresh, needed when items are added/removed while menu is open |

---

### Events You Can Receive (but shouldn't trigger)

| Event | Arguments | Description |
|-------|-----------|-------------|
| `EasyAdmin:BuildPlayerOptions` | playerId | Used to build player-specific menu options |
| `EasyAdmin:BuildCachedOptions` | cachedId | Used to build cached player options (not real players) |
| `EasyAdmin:BuildServerManagementOptions` | none | Used to build server management menu options |
| `EasyAdmin:BuildSettingsOptions` | none | Used to build settings menu options |
| `EasyAdmin:MenuRemoved` | none | Triggered when the main menu is closed |

---

### Events You Can Trigger

| Event | Arguments | Returns | Description |
|-------|-----------|---------|-------------|
| `EasyAdmin:amiadmin` | none | none | Resends permissions for a player |
| `EasyAdmin:GetInfinityPlayerList` | none | Table(PlayerCache) | Gets all players on the server |
| `EasyAdmin:requestCachedPlayers` | none | Table(PlayerCache) | Gets all cached players |
| `EasyAdmin:kickPlayer` | playerId, reason | none | Kicks a player with a reason and logs it |
| `EasyAdmin:addBan` | playerId, reason, expires, banner | none | Bans a player (both online and cached) |
| `EasyAdmin:requestBanlist` | none | table(banlist) | Gets the current ban list |
| `EasyAdmin:SlapPlayer` | playerId, slapAmount | none | Slaps a player (removes HP) |
| `EasyAdmin:TakeScreenshot` | playerId | httpResponse | Takes a screenshot of a player's screen |
| `EasyAdmin:unbanPlayer` | banId | none | Unbans a player by ID |
| `EasyAdmin:mutePlayer` | playerId | none | Toggles a mute on a player |

---

### Internal Events

These are used internally by EasyAdmin and may not be stable or documented in detail.

| Event | Direction | Arguments |
|-------|-----------|-----------|
| `EasyAdmin:adminresponse` | S->C | Table of permissions and values |
| `EasyAdmin:SetSetting` | S->C | Function and state (e.g., keybind settings) |
| `EasyAdmin:SetLanguage` | S->C | Language strings for the current locale |
| `EasyAdmin:fillBanlist` | S->C | Ban list as a table |
| `EasyAdmin:fillCachedPlayers` | S->C | Table of cached players |
| `EasyAdmin:GetInfinityPlayerList` | S->C | Table of all players |
| `EasyAdmin:NewReport` | S->C | Adds a new report |
| `EasyAdmin:RemoveReport` | S->C | Removes a report |
| `EasyAdmin:requestSpectate` | S<->C | Starts spectating a player |
| `EasyAdmin:TeleportRequest` | S->C | Teleports a player to a location |
| `EasyAdmin:SlapPlayer` | S->C | Slaps a player |
| `EasyAdmin:FreezePlayer` | S->C | Freezes a player |
| `EasyAdmin:amiadmin` | C->S | Requests permissions for a player |
| `EasyAdmin:reportAdded` | S->S | Adds a report to the server |
| `EasyAdmin:reportClaimed` | S->S | Claims a report |
| `EasyAdmin:reportRemoved` | S->S | Removes a report |

---