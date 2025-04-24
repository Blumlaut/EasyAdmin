# Plugin API

Since 5.9 EasyAdmin Supports creating custom Plugins which allow Developers to create new Items in the Menu and add custom Functions, this is a Quick-Start Guide for Developers.


## Foreword

EasyAdmin is based on [Frazzle's NativeUILua](https://github.com/FrazzIe/NativeUILua), so when creating Menus, make sure that you follow it's API Properly.

Menu Items are generated when the Button for it is pressed, do note that the menu can and WILL be generated multiple times, so do not store any variables which may affect the menu generation on later iterations.


## Boilerplate Script

Here is a Boilerplate Script that can help you get started with EasyAdmin Plugins:

```Lua
local somevalue = false

-- functions MUST be prefixed with local!

local function playerOptions(playerId)
	local thisItem = NativeUI.CreateItem("Example Item","Player ID is "..playerId) -- create our new item
	thisPlayer:AddItem(thisItem) -- thisPlayer is global.
	thisItem.Activated = function(ParentMenu,SelectedItem)
		-- enter your clientside code here, this will be run once the button has been activated.
		somevalue = true -- set some value we want to undo once the menu closes.

	end

	if DoesPlayerHavePermission(-1, "player.kick") then -- you can also check if a user has a specific Permission.
		local thisExampleMenu = _menuPool:AddSubMenu(thisPlayer,"Example Submenu","",true) -- Submenus work, too!
		thisExampleMenu:SetMenuWidthOffset(menuWidth)

		local thisItem = NativeUI.CreateItem("Example Submenu Item","")
		thisExampleMenu:AddItem(thisItem) -- Items dont require a trigger.

	end
end

local function mainMenuOptions()
	error("help me i have become self aware") -- you can also cast arbitrary errors, this will be visible in the console, with a proper stack trace, and easyadmin will not fail due to it.
end

local function cachedMenuOptions()
end

local function serverMenuOptions()
end

local function settingsMenuOptions()
end

local function menuRemoved()
	somevalue = false -- reset our value :)
end


local pluginData = { -- enter your plugin infos, and any optional data, here.
	name = "Demo", -- your plugin name
	functions = { -- functions which dont exist dont need to be added here.
		mainMenu = mainMenuOptions,
		playerMenu = playerOptions,
		cachedMenu = cachedMenuOptions,
		serverMenu = serverMenuOptions,
		settingsMenu = settingsMenuOptions,
		menuRemoved = menuRemoved,
	}
}


addPlugin(pluginData) -- this function will add the plugin to EasyAdmin
```

### Adding new Permissions

Permissions can be added to EasyAdmin by making a `shared` file using the following boilerplate:
```Lua
Citizen.CreateThread(function()
	repeat
		Wait(0)
	until permissions
	permissions["your.custom.permission"] = false
end)
```

Of note is that all permissions are prefixed with `easyadmin` automatically, so `your.custom.permission` becomes `easyadmin.your.custom.permission`

You can then use the permission you added by simply checking it server-side using `DoesPlayerHavePermission(source, "your.custom.permission")` or clientside using `permissions["your.custom.permission"]`, these will return a true/false boolean.


## Porting Plugins to 6.8

Porting your Plugin to 6.8 is fairly trivial, the menu generation event handlers have been replaced with functions:

```diff
- AddEventHandler("EasyAdmin:BuildPlayerOptions", function(playerId)
+ local function playerOptions(playerId)

- AddEventHandler("EasyAdmin:MenuRemoved", function() 
+ local function menuRemoved()
```

Actual menu syntax has not changed, so no code changes in the UI generation are required.

After you have changed all your EasyAdmin-related event handlers to local functions, add the following to the bottom of the script:

```Lua
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

the "name" property would be the name of your plugin, this can be any arbitrary string, your function names must also match the ones defined in the functions table.

For example, if your playerMenu function is called `generatePlayerMenu`, then your should reflect that as `playerMenu = generatePlayerMenu,` in the functions table.

Legacy Plugins are expected to stop working around Q1 2023.

## Replacing Notifications

EasyAdmin supports replacing the native Notifications with custom ones, to do this the `EasyAdmin:receivedNotification` event has to be cancelled and the text from `EasyAdmin:showNotification` to be forwarded to your Notification Script, for examples see [EasyAdmin/plugins/notifications](https://github.com/Blumlaut/EasyAdmin/tree/master/plugins/notifications)

**Do you have two different notification systems being triggered at the same time?**
Choose which notification system you want to keep, and remove the other scripts in the [plugins folder](https://github.com/Blumlaut/EasyAdmin/tree/master/plugins/notifications)


## Functions and Events

### Utility Functions

EasyAdmin ships with some Utility functions that can be run in Plugins, here is a table of examples:

| Function | Arguments | Description |
|-------|-------|-------|
| PrintDebugMessage | content, level | Prints a message in the client/server log, depending on if their ea_logLevel matches or is above the level provided |
| displayKeyboardInput | title,defaultText,maxLength | added in EasyAdmin 6.4, displays a keyboard, executing this function halts execution, make sure to run this in a thread if you want to run it asynchronously |
| copyToClipboard | text | Pastes a text to player's clipboard |
| DoesPlayerHavePermission | player, permission | returns weither or not a player has a permission, for example `player.ban.view` |
| DoesPlayerHavePermissionForCategory | player, permission | Same as above, but checks if player has **any** permission in that category, for example `player.ban` |
| GetVersion | N/A | Returns 2 variables, Version string and if EasyAdmin was cloned from master instead of downloading a release |
| GetLocalisedText | string | returns a translated string for a language variable. |
| formatDateString | unix timestamp | Converts a unix timestamp into a Time/Datestring |
| math.round | number, decimals | rounds a number to the amount of decimals |
| string.split | string, seperator | splits a string via the given seperator |
| string.reverse | string | gnirts a sesrever |
| UIMenu:RefreshIndexRecursively() | N/A | Refreshes the Indices of the Menu and (if any) Child Menus, forcing the cursor to reset in those menus, this is required when adding/removing items while the menu is open.  |

### Recieving Events

These are the events that your script can recieve and use, but should never trigger.


|                 Event                  | Arguments | Function |
|----------------------------------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| EasyAdmin:BuildPlayerOptions           | playerId  | This event is meant to be used if new Menu options are meant to be created inside a player's submenu, the playerId is passed, you can use the "thisPlayer" variable to access the Menu.                         |
| EasyAdmin:BuildCachedOptions           | cachedId  | This event is for adding Menu Options to cached players, do note that these are not real players and the Id cannot be interacted with with Natives. Menu is "thisPlayer".                              |
| EasyAdmin:BuildServerManagementOptions | none      | This event is meant to be used for adding menu options to the "Server Management" Submenu, the menu is called "servermanagement"                                                                       |
| EasyAdmin:BuildSettingsOptions         | none      | This event is meant to be used for adding menu options to the "Settings" Submenu, the menu is called "settingsMenu"                                                                                    |
| EasyAdmin:MenuRemoved                  | none      | This event is used when the EasyAdmin Menu is closed and/or Removed, this happens if the menu is closed and not active. This can trigger multiple times in a row so be careful what code you put here. |

### Sending Events

EasyAdmin has a powerful API with which you can already do lots of things, here are a few Server Events which you can Trigger:


|              Event              |             Arguments              |      Returns       |                                                                            Function                                                                                                                                    |
|---------------------------------|------------------------------------|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| EasyAdmin:amiadmin              | none                               | none               | Re-send Permissions list on a Player, this also gets done sometimes if a player opens the menu.                                                                                                                        |
| EasyAdmin:GetInfinityPlayerList | none                               | Table(PlayerCache) | This Event sends a Clientside event with the same name back, containing a Table of all Players                                                                                                                         |
| EasyAdmin:requestCachedPlayers  | none                               | Table(PlayerCache) | This Event sends an Event called `EasyAdmin:fillCachedPlayers` back which is a table of all cached Players, this includes active and not active players.                                                               |
| EasyAdmin:kickPlayer            | playerId,reason                    | none               | This Event Kicks a Player if the User has permissions to do so and sends a Webhook Message with it.                                                                                                                    |
| EasyAdmin:addBan                | playerId,reason,expires,banner | none               | This Event Bans a player (both online and cached) using EasyAdmin's Ban Feature, "Expires" has to be a timeframe(for ex. 1 week) in Unix Time. |
| EasyAdmin:requestBanlist        | none                               | table(banlist)     | This Event sends an event called `EasyAdmin:fillBanlist` back with a table of all Bans.                                                                                                                                |
| EasyAdmin:SlapPlayer            | playerId,slapAmount                | none               | This Event Slaps a player, taking away HP according to "SlapAmount".                                                                                                                                                   |
| EasyAdmin:TakeScreenshot        | playerId                           | httpResponse       | This Event Takes a screenshot of the player's screen and once successful, triggers `EasyAdmin:TookScreenshot` with the HTTP Response, screenshot-basic is required.                                                    |
| EasyAdmin:unbanPlayer           | banId                              | none               | Unbans a Player according to their Ban Id                                                                                                                                                                              |
| EasyAdmin:mutePlayer   		  | playerId                           | none               | Toggles a Mute on a Player. |


### Internal Events

These are events that EasyAdmin may trigger to internally send informations to the server or clients, these may not be up to date, reading the source code to be sure is recommended.

| Event | Direction | Arguments |
|-------|-------|-------|
| EasyAdmin:adminresponse | S->C | A Table of Permissions and their respective values `[permissionName = true/false]` |
| EasyAdmin:SetSetting | S->C | A Function and a State, contains options such as Menu Keybind |
| EasyAdmin:SetLanguage | S->C | Passes a table of Strings from the Language Configured. |
| EasyAdmin:fillBanlist | S->C | Passes the Banlist as a Table |
| EasyAdmin:fillCachedPlayers | S->C | Same as above, but with Cached Players. |
| EasyAdmin:GetInfinityPlayerList | S->C | Same, but with Players. |
| EasyAdmin:getServerAces | S->C | Sends 2 tables, of aces and principals respectively |
| EasyAdmin:NewReport | S->C | Adds a new Report to the current Table of Reports | 
| EasyAdmin:RemoveReport | S->C | Removes a Report from the table of Reports |
| EasyAdmin:requestSpectate | S<->C | Is both the event to Request and start the spectate process | EasyAdmin:TeleportRequest | S->C | Tells a player to teleport to a specific location. Passes a target ID and/or Coordiantes |
| EasyAdmin:SlapPlayer | S->C | Slaps the current Player for the amount of HP |
| EasyAdmin:FreezePlayer | S->C | Same as above, except Freezing | 
| EasyAdmin:amiadmin | C->S | Will check all Permissions for a player and send back the permissions in `EasyAdmin:adminresponse` |
| EasyAdmin:reportAdded | S->S | Passes the report that has been created |
| EasyAdmin:reportClaimed | S->S | Passes the report that has been claimed | 
| EasyAdmin:reportRemoved | S->S | Passes the report that has been removed | 
