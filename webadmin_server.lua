-- Page details
local PAGE_NAME = "easyadmin_settings"
local PAGE_TITLE = "EasyAdmin"
local PAGE_ICON = "plug"

-- Sidebar badge controls
local SHOW_PAGE_BADGE = false
local PAGE_BADGE_TEXT = "OK!"
local PAGE_BADGE_TYPE = "success"

local CV_BOOL, CV_INT, CV_STRING, CV_SLIDER, CV_MULTI, CV_COMBI, CV_PASSWORD = 1, 2, 3, 4, 5, 6, 7
local CONVARS = {
    -- CAT: name, [desc]
    -- BOOL: name, convar, type, default, [label]
    -- INT: name, convar, type, default, [min], [max]
    -- STRING: name, convar, type, default
    -- SLIDER: name, convar, type, default, min, max
    -- COMBI: name, convar, type, default, min, max
    -- MULTI: name, convar, type, items[{name, value}] (first is default)

    {"EasyAdmin", "General Settings"},
    {"Language",         "ea_LanguageName",          "CV_STRING",  "en"},
	{"Moderation Notification Webhook", "ea_moderationNotification", "CV_STRING", "https://discordapp.com/api/webhooks/000000/AAAA"},
	{"Enable Debugging", "ea_enableDebugging", "CV_BOOL", false},

	{"", "Menu Settings"},
	{"Menu Button",      "ea_MenuButton",      "CV_INT",    289},
	{"Show All Buttons", "ea_alwaysShowButtons", "CV_BOOL", false},
	{"", "Banlist Settings"},
	{"Minimum Matching Identifiers",        "ea_minIdentifierMatches",        "CV_INT",   2,1,3},
	{"", "Command Settings"},
	{"Enable calladmin command", "ea_enableCallAdminCommand", "CV_BOOL", true},
	{"Enable report command", "ea_enableReportCommand", "CV_BOOL", true},
	{"Default Minimum Reports", "ea_defaultMinReports", "CV_INT", 3},
	{"Minimum Report Modifier Enabled", "ea_MinReportModifierEnabled", "CV_BOOL", true},
	{"Minimum Report Modifier Players", "ea_MinReportPlayers", "CV_INT", 12},
	{"Report Modifier", "ea_MinReportModifier", "CV_INT", 4},
	{"Report Ban Time (unix time)", "ea_ReportBanTime", "CV_INT", 86400},


	{"", "Screenshot Settings"},
	{"Screenshot Image Uploader", "ea_screenshoturl", "CV_STRING", "https://wew.wtf/upload.php"},
	{"Screenshot Field", "ea_screenshotfield", "CV_STRING", "files[]"},
}



-- temporarily build settings on resource start in case i change anything remove this when done
SaveResourceFile(GetCurrentResourceName(), "settings.json", json.encode(CONVARS, {indent = true}), -1)

function CreatePage(FAQ, data, add)
	if data.action == "kick" and data.source and exports['webadmin']:isInRole("easyadmin.kick") then 
		print("JESUS")
	end
	if data.action == "ban" and data.source and exports['webadmin']:isInRole("easyadmin.ban") then 
		print("CHRIST")
	end
	if data.action == "mute" and data.source and exports['webadmin']:isInRole("easyadmin.mute") then 
		TriggerEvent("EasyAdmin:mutePlayer", data.source)
	end
    add(FAQ.Alert("info", "aaaaaaaaaaaaaaaaaaaa"))
    add(FAQ.InfoCard("fun things", {
        {"Banlist Entries", #blacklist},
		{"wowie"},
	}))

	local form = FAQ.Form("settings", {resource=GetCurrentResourceName()}, FAQ.Button("primary", {
		"Settings ", FAQ.Icon("cog")
	}, {type = "submit"}))
	add(form)
	local car = FAQ.CardText({"RIDDLE ME THIS<br>RIDDLE ME THAT<br>WHO'S AFRAID OF THE BIG BLACK?"})
	add(car)
	add(FAQ.Table({"#", "Name", "Ping", "GUID", "Action"}, GetPlayers(), function(source)
		return {source, GetPlayerName(source), GetPlayerPing(source), GetPlayerGuid(source), 

		FAQ.Form(PAGE_NAME, {source = source}, FAQ.Nodes({
			FAQ.ButtonToolbar({
				FAQ.ButtonGroup({
					FAQ.Button("primary", "Kick", {type = "submit", name = "action", value = "kick", disabled = (not exports['webadmin']:isInRole("easyadmin.kick") and "disabled" or nil)}),
					FAQ.Button("danger", "Ban", {type = "submit", name = "action", value = "ban", disabled = (not exports['webadmin']:isInRole("easyadmin.ban") and "disabled" or nil)}),
				}),
				FAQ.ButtonGroup({
					FAQ.Button("secondary", (MutedPlayers[tonumber(source)]) and "Unmute" or "Mute", {type = "submit", name = "action", value = "mute", disabled = (not exports['webadmin']:isInRole("easyadmin.mute") and "disabled" or nil)}),
				}),
			})
		}))

	}

	end))
    return true, "OK"
end

-- Automatically sets up a page and sidebar option based on the above configurations
-- This should not need to be altered, and serves as the foundation of the plugin
-- lol watch this *edits*
Citizen.CreateThread(function()
	local PAGE_ACTIVE = false
	if GetResourceState("webadmin-lua") == "missing" then 
		print("\nEasyAdmin: webadmin-lua is not installed on this Server, webadmin features unavailable")
		return
	else
		StartResource("webadmin-lua")
		repeat
			Wait(100)
			local yes = (GetResourceState("webadmin-lua") == "started")
		until yes
	end
	if GetResourceState("wap-settings") == "missing" then 
		print("\nEasyAdmin: wap-settings is not installed on this Server, webadmin settings page not available")
		return
	else
		StartResource("wap-settings")
	end
    local FAQ = exports['webadmin-lua']:getFactory()
    exports['webadmin']:registerPluginOutlet("nav/sideList", function(data) --[[R]]--
        if not exports['webadmin']:isInRole("webadmin."..PAGE_NAME..".view") then return "" end
        local _PAGE_ACTIVE = PAGE_ACTIVE PAGE_ACTIVE = false
        return FAQ.SidebarOption(PAGE_NAME, PAGE_ICON, PAGE_TITLE, SHOW_PAGE_BADGE and PAGE_BADGE_TEXT or false, PAGE_BADGE_TYPE, _PAGE_ACTIVE) --[[R]]--
    end)
    exports['webadmin']:registerPluginPage(PAGE_NAME, function(data) --[[E]]--
        if not exports['webadmin']:isInRole("webadmin."..PAGE_NAME..".view") then return "" end
        PAGE_ACTIVE = true
        return FAQ.Nodes({ --[[R]]--
            FAQ.PageTitle(PAGE_TITLE),
            FAQ.BuildPage(CreatePage, data), --[[R]]--
        })
    end)
end)
