
-- EasyAdmin Plugin Example, this allows injecting new UI Elements directly into EasyAdmin Menus, see NativeUILua Docs on Guides how to add new Items, below is an example code.

local somevalue = false

-- functions MUST be prefixed with local!

local function playerOption(playerId)
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

local function mainMenu()
	error("You have the example plugin enabled, this is only meant to be used as a template for new plugins.")
end

local function cachedMenu()
end

local function serverMenu()
end

local function settingsMenu()
end

local function menuRemoved()
	somevalue = false -- reset our value :)
end


local pluginData = {
	name = "Demo", 
	functions = {
		mainMenu = mainMenu,
		playerMenu = playerOption,
		cachedMenu = cachedMenu,
		serverMenu = serverMenu,
		settingsMenu = settingsMenu,
		menuRemoved = menuRemoved,
	}
}

-- uncomment to enable plugin
-- addPlugin(pluginData)