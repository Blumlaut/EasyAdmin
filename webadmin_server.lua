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
    {"Language",         "ea_LanguageName",          "CV_STRING_R",  "en"},
	{"Moderation Notification Webhook", "ea_moderationNotification", "CV_STRING", "https://discordapp.com/api/webhooks/000000/AAAA"},
	{"Enable Debugging", "ea_enableDebugging", "CV_BOOL", false},

	{"", "Menu Settings"},
	{"Menu Button",      "ea_MenuButton",      "CV_INT_R",    289},
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

-- Input group builder
local function GenerateInputGroup(FAQ, input, left, right)
    return FAQ.Node("div", {class = "input-group mb-3"}, {
        left and FAQ.Node("div", {class = "input-group-prepend"}, left) or "",
        input,
        right and FAQ.Node("div", {class = "input-group-append"}, right) or "",
    })
end
local function GenerateCustomSelect(FAQ, name, list)
    local options = {}
    for _, entry in next, list do
        table.insert(options, FAQ.Node("option", {value = entry[2]}, entry[1]))
    end
    return FAQ.Node("select", {class = "custom-select", name = name}, options)
end

local function GenerateBanOptions(FAQ)
	banLength = {
		{label = GetLocalisedText("permanent"), time = 10444633200},
		{label = GetLocalisedText("oneday"), time = 86400},
		{label = GetLocalisedText("threedays"), time = 259200},
		{label = GetLocalisedText("oneweek"), time = 518400},
		{label = GetLocalisedText("twoweeks"), time = 1123200},
		{label = GetLocalisedText("onemonth"), time = 2678400},
		{label = GetLocalisedText("oneyear"), time = 31536000},
	}
	local t = {}
	for i, info in ipairs(banLength) do 
		table.insert(t, {info.label, info.time})
	end
	return t
end


-- Generate a paginator widget to navigate between pages
GeneratePaginatorExceptWithMoreData = function(FAQ, pageName, currentPage, maxPages, align, extraSauce)
	local paginatorList = {}
	local data = extraSauce or {}
    if maxPages > 0 then
		if currentPage > maxPages or currentPage < 0 then currentPage = 1 end
		local backData = data
		backData.page = 1
        table.insert(paginatorList, {"First", FAQ.GenerateDataUrl(pageName, backData), false, currentPage == 1})
		for i = 1, maxPages do
			if (i>currentPage-5 and i<currentPage+20) then
				data["page"] = i
				table.insert(paginatorList, {i, FAQ.GenerateDataUrl(pageName, data), i == currentPage})
			end
		end
		local nextData = data
		nextData.page = maxPages
        table.insert(paginatorList, {"Last", FAQ.GenerateDataUrl(pageName, nextData), false, currentPage == maxPages})
        return FAQ.Pagination(paginatorList, align or "center")
    end
    return FAQ.Pagination({
        {"Previous", "#", false, true},
        {"-", "#", true, true},
        {"Next", "#", false, true},
    }, "center")
end

	function TakeWebScreenshot(playerId)
		Citizen.CreateThread(function()
			if scrinprogress then
				currentScreenshotURL="error"
				return
			end
			scrinprogress = true
			local src=source
			local playerId = playerId
			local scrResult = false

			thistemporaryevent = AddEventHandler("EasyAdmin:TookScreenshot", function(result)
				res = tostring(result)
				SendWebhookMessage(moderationNotification, string.format(GetLocalisedText("admintookscreenshot"), "Console", getName(playerId), res))
				PrintDebugMessage("Screenshot for Player "..getName(playerId,true).." done, "..res.." requsted by".."Console")
				currentScreenshotURL = res
				scrinprogress = false
				RemoveEventHandler(thistemporaryevent)
			end)
			
			TriggerClientEvent("EasyAdmin:CaptureScreenshot", playerId)
			local timeoutwait = 0
			repeat
				timeoutwait=timeoutwait+1
				Wait(1000)
				if timeoutwait == 5 then
					RemoveEventHandler(thistemporaryevent)
					scrinprogress = false -- cancel screenshot, seems like it failed
					currentScreenshotURL="error"
				end
			until not scrinprogress
		end)
	end

Citizen.CreateThread(function()

	function CreatePage(FAQ, data, add)


		if data.action == "kickModal" and data.source then
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h2", {}, "<b>Kick User</b>"))
		

			add(FAQ.Node("h5", {}, "<b>Name:</b> "..GetPlayerName(data.source)))
			add(FAQ.Node("h5", {}, "<b>Reports:</b> "..(PlayerReports[source] and #PlayerReports[source] or "0")))
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h5", {}, "<b>Reason:</b>"))
			add(FAQ.Form(PAGE_NAME, {source=data.source, action="kick"}, { FAQ.Node("input", {
				class = "form-control",
				type = "text",
				name = "reason",
				value = "",
				placeholder = "No Reason Provided",
			}, ""),FAQ.Node("div", {}, "&nbsp;"), FAQ.Button("danger", {
				"Kick User"
			}, {type = "submit"})}))



			return true, "OK" -- dont render any further
		end

		if data.action == "banModal" and data.source then
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h2", {}, "<b>Ban User</b>"))
		

			add(FAQ.Node("h5", {}, "<b>Name:</b> "..GetPlayerName(data.source)))
			add(FAQ.Node("h5", {}, "<b>Reports:</b> "..(PlayerReports[source] and #PlayerReports[source] or "0")))
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h5", {}, "<b>Reason:</b>"))
			add(FAQ.Form(PAGE_NAME, {source=data.source, action="ban"}, 
			{
				FAQ.Node("input", {
					class = "form-control",
					name = "reason",
					value = "",
					placeholder = "No Reason Provided",
				}, ""),
			
			FAQ.Node("h3", {}, ""),
			FAQ.Node("div", {}, "&nbsp;"),
			
			FAQ.Node("h5", {}, "<b>Ban Length:</b>"),
			GenerateInputGroup(FAQ, 
				GenerateCustomSelect(FAQ, "expires", GenerateBanOptions()), 
				FAQ.Node("span", {class = "input-group-text", style = "min-width: 30px;"}, "Ban Length")
			),

			FAQ.Button("danger", {"Ban User"}, {type = "submit", value=value, expires = expires or 10444633200}) 

			}))


			return true, "OK" -- dont render any further
		end

		if data.action == "takeScreenshot" then

			if currentScreenshotURL then 
				data.action="viewidentifiers"
			else
				if not data.started then 
					TakeWebScreenshot(data.source)
				end
				add(FAQ.Node("h3", {}, "One Moment, Please."))
				add(FAQ.Node("h5", {}, "(your screenshot is being created)"))
				add(FAQ.Node("script", {type="text/javascript"}, 'setTimeout(function(){ window.location = "/webadmin/Plugin/Page?name=easyadmin_settings&started=true&action=takeScreenshot&source='..data.source..'";}, 2000);'))
					return true, "OK" -- dont render any further
			end
	

		end


		if data.action == "viewidentifiers" and data.source then
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h2", {}, "<b>User Info</b>"))
		

			add(FAQ.Node("h5", {}, "<b>Name:</b> "..GetPlayerName(data.source)))
			add(FAQ.Node("h5", {}, "<b>Reports:</b> "..(PlayerReports[source] and #PlayerReports[source] or "0")))
			add(FAQ.Node("h5", {}, "<b>Identifiers:</b>"))

			add(FAQ.Node("ul", {class="list-group"}, ""))

			for i, identifier in ipairs(GetPlayerIdentifiers(data.source)) do 
				add(FAQ.Node("li", {class="list-group-item"}, identifier))
			end
			add(FAQ.Node("div", {}, "&nbsp;"))
			if screenshots and not currentScreenshotURL then
				local form = FAQ.Form(PAGE_NAME, {action="takeScreenshot", source=data.source}, FAQ.Button("info", {
					"Take Screenshot "}, {type = "submit", disabled = (not exports['webadmin']:isInRole("easyadmin.screenshot") and "disabled" or nil)}))
				add(form)
			end

			if currentScreenshotURL then 
				add(FAQ.Node("div", {}, "&nbsp;"))
				add(FAQ.Node("h5", {}, "<b>Screenshot</b>"))
				add(FAQ.Node("img", {src=currentScreenshotURL, width=1600}, ""))
				add(FAQ.Node("a", {href=currentScreenshotURL}, "<br>"..currentScreenshotURL))
				currentScreenshotURL=nil
				add(FAQ.Node("br", {}, ""))
				add(FAQ.Node("br", {}, ""))
			end
			
			return true, "OK" -- dont render any further
		end



		if data.action == "kick" and data.source and data.reason and exports['webadmin']:isInRole("easyadmin.kick") then 
			if data.reason == "" then 
				data.reason = "No Reason Provided"
			end 
			add(FAQ.Alert("primary", "Kicking Player "..GetPlayerName(data.source).." for "..data.reason.."..."))
			TriggerEvent("EasyAdmin:kickPlayer", data.source, data.reason) 
			print(json.encode(data))
		end
		if data.action == "ban" and data.source and data.reason and exports['webadmin']:isInRole("easyadmin.ban") then 
			if data.reason == "" then 
				data.reason = "No Reason Provided"
			end 
			add(FAQ.Alert("primary", "Banning Player "..GetPlayerName(data.source).." for "..data.reason.."..."))
			TriggerEvent("EasyAdmin:banPlayer", data.source, data.reason, data.expires or 10444633200) 

			print(json.encode(data))
		end
		if data.action == "mute" and data.source and exports['webadmin']:isInRole("easyadmin.mute") then 
			add(FAQ.Alert("primary", "Muting Player "..GetPlayerName(data.source).."..."))
			print(json.encode(data))
			TriggerEvent("EasyAdmin:mutePlayer", data.source)
		end


		if data.site == "managebans" and data.action=="removeBan" and exports['webadmin']:isInRole("easyadmin.unban") then 
			add(FAQ.Alert("primary", "Removing Ban "..data.banid.."..."))
			print(json.encode(data))
			TriggerEvent("EasyAdmin:unbanPlayer", data.banid)
		end

		if data.site == "managebans" and data.action=="addBan" and exports['webadmin']:isInRole("easyadmin.ban") then 
			add(FAQ.Alert("primary", "Adding Ban..."))
			print(json.encode(data))
			local identifiers = mysplit(data.identifiers, ",")

			for i, identifier in ipairs(identifiers) do 
				print(identifier)
			end
			--EasyAdmin:addBan", function(playerId,reason,expires)
			TriggerEvent("EasyAdmin:addBan", identifiers, data.reason, os.time()+data.expires,true)
		end

		if data.site == "managebans" and data.action=="editBan" and exports['webadmin']:isInRole("easyadmin.editban")  then 
			add(FAQ.Alert("primary", "Editing Ban..."))
			print(json.encode(data))
			local identifiers = mysplit(data.identifiers, ",")

			for i, identifier in ipairs(identifiers) do 
				print(identifier)
			end
			updateBan(data.source,{banid=blacklist[data.source].banid, banner=data.banner,reason=data.reason, identifiers=identifiers, expire=os.time()+data.expires })
		end

		if data.site == "managebans" and data.action=="editBanModal" and exports['webadmin']:isInRole("easyadmin.editban")  then
			add(FAQ.Alert("danger", "Changing any informations in this ban will change them <b>permanently</b>!"))

			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h2", {}, "<b>Edit Ban</b>"))
		
			local identifiers = ""
			for i,id in ipairs(blacklist[data.banid].identifiers) do 
				if id ~= "" and i ~= #blacklist[data.banid].identifiers then
					identifiers = identifiers..id..","
				elseif id ~= "" and i == #blacklist[data.banid].identifiers then
					identifiers = identifiers..id
				end	
			end

			add(FAQ.Node("h5", {}, "<b>Reason:</b>"))
			add(FAQ.Form(PAGE_NAME, {source=data.banid, site="managebans", action="editBan"}, 
			{
				FAQ.Node("input", {
					class = "form-control",
					name = "reason",
					value = blacklist[data.banid].reason,
					placeholder = "No Reason Provided",
				}, ""),

				FAQ.Node("h5", {}, "<b>Banner:</b>"),
				FAQ.Node("input", {
					class = "form-control",
					name = "banner",
					value = (blacklist[data.banid].banner or "Console"),
					placeholder = "Console",
				}, ""),
							
				FAQ.Node("h5", {}, "<b>Ban Length:</b>"),
				GenerateInputGroup(FAQ, 
					GenerateCustomSelect(FAQ, "expires", GenerateBanOptions()), 
					FAQ.Node("span", {class = "input-group-text", style = "min-width: 30px;"}, "Ban Length")
				),

				FAQ.Node("h5", {}, "<b>Identiifers:</b>"),
				FAQ.Node("input", {
					class = "form-control",
					name = "identifiers",
					value = (identifiers),
					placeholder = "steam:123,license:abc,fivem:567",
				}, ""),
			

			FAQ.Button("danger", {"Edit Ban"}, {type = "submit", value="editBan", expires = expires or 10444633200}) 

			}))

			return true, "OK" -- dont render any further

		end


		if data.site == "managebans" and data.action=="removeBanModal" and exports['webadmin']:isInRole("easyadmin.unban")  then
			add(FAQ.Alert("danger", "Removing this ban will remove it <b>permanently</b>!"))

			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h2", {}, "<b>Remove Ban</b>"))
		

			add(FAQ.Node("h5", {}, "<b>Reason:</b> "..blacklist[data.banid].reason))
			add(FAQ.Node("h5", {}, "<b>Banner:</b> "..(blacklist[data.banid].banner or "N/A")))
			add(FAQ.Node("div", {}, "&nbsp;"))
			add(FAQ.Node("h5", {}, "<b>Ban (would) Expire</b> "..os.date('%Y-%m-%d %H:%M:%S', blacklist[data.banid].expire)))
			
			add(FAQ.Node("div", {}, "&nbsp;"))

			
			add(FAQ.Node("h5", {}, "<b>Identifiers</b>"))
			add(FAQ.Node("ul", {class="list-group"}, ""))

			for i, identifier in ipairs(blacklist[data.banid].identifiers) do 
				add(FAQ.Node("li", {class="list-group-item"}, identifier))
			end
			

			local form = FAQ.Form(PAGE_NAME, {site="managebans", action="removeBan", banid=blacklist[data.banid].banid}, FAQ.Button("danger", {
				"Unban User"
			}, {type = "submit"}))
			add(form)

			return true, "OK" -- dont render any further
		end

		if data.site == "managebans" and data.action=="addBanModal" and exports['webadmin']:isInRole("easyadmin.ban")  then
			add(FAQ.Node("h2", {}, "<b>Add Ban</b>"))
		

		--	add(FAQ.Node("h5", {}, "<b>Ban (would) Expire</b> "..os.date('%Y-%m-%d %H:%M:%S', blacklist[data.banid].expire)))

			add(FAQ.Node("h5", {}, "<b>Reason:</b>"))
			add(FAQ.Form(PAGE_NAME, {action="addBan", site="managebans"}, 
			{
				FAQ.Node("input", {
					class = "form-control",
					name = "reason",
					reason = "",
					placeholder = "No Reason Provided",
				}, ""),
			
			FAQ.Node("h3", {}, ""),
			FAQ.Node("div", {}, "&nbsp;"),
			
			FAQ.Node("h5", {}, "<b>Ban Length:</b>"),
			GenerateCustomSelect(FAQ, "expires", GenerateBanOptions()),
			FAQ.Node("div", {}, "&nbsp;"),

			FAQ.Node("h5", {}, "<b>Identifiers:</b>"),
			FAQ.Node("h6", {}, "(seperated by commas)"),
			FAQ.Node("input", {
				class = "form-control",
				name = "identifiers",
				identifiers = "",
				placeholder = "steam:123,license:abc,fivem:567",
			}, ""),
			FAQ.Node("div", {}, "&nbsp;"),

			FAQ.Button("danger", {"Ban User"}, {type = "submit", reason=reason, identifiers=identifiers, expires = expires or 10444633200})

			}))
			

			return true, "OK" -- dont render any further
		end

		if data.site == "managebans" and exports['webadmin']:isInRole("easyadmin.unban")  then 


			if not data.page then data.page = 1 end -- set a page value if none exist
			local pageEntries = 20
			if (#blacklist/pageEntries) <1 then 
				maxpages = 1
			else
				maxpages = math.ceil(#blacklist/pageEntries)
			end

			local thisPage = {}

			for i,theBanned in ipairs(blacklist) do
				if i<(data.page*pageEntries)+1 and i>(data.page*pageEntries)-pageEntries then
					if theBanned then
						local t = theBanned
						t.id = i
						table.insert(thisPage, t)
					end
				end
			end
			add(FAQ.Node("h3", {}, "<br>Banlist"))

			local form = FAQ.Form(PAGE_NAME, {site="managebans", action="addBanModal"}, FAQ.Button("primary", {
				"Add New Ban ", FAQ.Icon("cog")
			}, {type = "submit", disabled = (not exports['webadmin']:isInRole("easyadmin.ban") and "disabled" or nil)}))
			add(form)
			add(FAQ.Node("div", {}, "&nbsp;"))


			add(FAQ.Table({"#", "Reason", "Banner", "Expires","Actions"}, thisPage, function(data)
				return {data.banid, data.reason, (data.banner or "N/A"), os.date('%Y-%m-%d %H:%M:%S', data.expire), 
		
				FAQ.Form(PAGE_NAME, {source = source, site="managebans", action=action}, FAQ.Nodes({
					FAQ.ButtonToolbar({
						FAQ.ButtonGroup({

							FAQ.Form(PAGE_NAME,{source=source, banid=data.id, action="editBanModal"}, {
								FAQ.ButtonGroup({
									FAQ.Button("primary", "Edit Ban", {type = "submit", source=source, action="editBanModal", disabled = (not exports['webadmin']:isInRole("easyadmin.editban") and "disabled" or nil)}),
								}),
							}),
							FAQ.Form(PAGE_NAME,{action="removeBanModal", banid=data.id, site="managebans"}, {
								FAQ.ButtonGroup({
									FAQ.Button("danger", "Unban", {type = "submit", disabled = (not exports['webadmin']:isInRole("easyadmin.unban") and "disabled" or nil)}),
								}),
							}),
		
						}),
					})
				}))
			} end) )
			add(GeneratePaginatorExceptWithMoreData(FAQ,PAGE_NAME, data.page, maxpages, "center", {site="managebans"}))
			return true, "OK"
		elseif data.site == "managebans" and not exports['webadmin']:isInRole("easyadmin.unban") then
			add(FAQ.Node("h3", {}, "u think u sneaky lmao"))
			return true, "OK"
		end


		if not blacklist then 
			add(FAQ.Alert("danger", "Banlist file could not be loaded! This means bans <b>WILL NOT WORK</b>, please check this and fix the banlist.json!"))
			SHOW_PAGE_BADGE = true
			PAGE_BADGE_TEXT = "ERROR!"
			PAGE_BADGE_TYPE = "danger"
		else
			SHOW_PAGE_BADGE = false
		end

		if not data.hidestats then
			add(FAQ.InfoCard("Statistics", {
				{"Banlist Entries", (blacklist) and #blacklist or "ERROR"},
				{"Screenshots Module", (screenshots) and "Enabled" or "Disabled"},
				{"WebAdmin Settings Module", (wap_settings) and "Enabled" or "Disabled"}
			}))
		
			local form = FAQ.Form(PAGE_NAME, {site="managebans"}, FAQ.Button("primary", {
				"Manage Banlist ", FAQ.Icon("cog")
			}, {type = "submit", disabled = (not exports['webadmin']:isInRole("easyadmin.unban") and "disabled" or nil)}))
			add(form)

			add(FAQ.Node("h3", {}, "<br>Player List"))

		end

		if not data.page then data.page = 1 end -- set a page value if none exist
		local pageEntries = 15
		local PlayerList = GetPlayers()
		if (#PlayerList/pageEntries) <1 then 
			maxpages = 1
		else
			maxpages = math.ceil(#PlayerList/pageEntries)
		end

		local thisPage = {}

		for i,thePlayer in ipairs(PlayerList) do
			if i<(data.page*pageEntries)+1 and i>(data.page*pageEntries)-pageEntries then
				if thePlayer then
					table.insert(thisPage, thePlayer)
				end
			end
		end

		add(FAQ.Table({"#", "Name", "Ping", "Reports", "Action"}, thisPage, function(source)
			return {source, {GetPlayerName(source).." ", (DoesPlayerHavePermission(source,"easyadmin.kick")) and FAQ.Badge("info", "Staff") or ""	}, GetPlayerPing(source), (PlayerReports[source]) and #PlayerReports[source] or "0", 

			FAQ.Form(PAGE_NAME, {source = source, action=action}, FAQ.Nodes({
				FAQ.ButtonToolbar({
					FAQ.ButtonGroup({
						FAQ.Form(PAGE_NAME,{action="kickModal"}, {
							FAQ.ButtonGroup({
								FAQ.Button("primary", "Kick", {type = "submit", action="kickModal", disabled = (not exports['webadmin']:isInRole("easyadmin.kick") and "disabled" or nil)}),
							}),
						}),

						FAQ.Form(PAGE_NAME,{source=source, action="banModal"}, {
							FAQ.ButtonGroup({
								FAQ.Button("danger", "Ban", {type = "submit", source=source, action="banModal", disabled = (not exports['webadmin']:isInRole("easyadmin.ban") and "disabled" or nil)}),
							}),
						}),
					}),
					FAQ.Form(PAGE_NAME, {source=source, action="mute"}, {
						FAQ.ButtonGroup({
							FAQ.Button("secondary", (MutedPlayers[tonumber(source)]) and "Unmute" or "Mute", {type = "submit", name = "action", value = "mute", disabled = (not exports['webadmin']:isInRole("easyadmin.mute") and "disabled" or nil)}),
						}),
					}),
					FAQ.Form(PAGE_NAME, {source=source, action="viewidentifiers"}, {
						FAQ.ButtonGroup({
							FAQ.Button("info", "More", {type = "submit"}),
						}),
					})
				})
			}))
		}

		end))
		add(GeneratePaginatorExceptWithMoreData(FAQ,PAGE_NAME, data.page, maxpages, "center", {hidestats=true}))


		return true, "OK"
	end
end)
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
	end
	if GetResourceState("wap-settings") == "missing" then 
		print("\nEasyAdmin: wap-settings is not installed on this Server, webadmin settings page not available")
	else
		StartResource("wap-settings")
		SaveResourceFile(GetCurrentResourceName(), "settings.json", json.encode(CONVARS, {indent = true}), -1)
		wap_settings = true
	end
	if not blacklist then 
		SHOW_PAGE_BADGE = true
		PAGE_BADGE_TEXT = "ERROR!"
		PAGE_BADGE_TYPE = "danger"
	end
    local FAQ = exports['webadmin-lua']:getFactory()
    exports['webadmin']:registerPluginOutlet("nav/sideList", function(data) --[[R]]--
        if not exports['webadmin']:isInRole("easyadmin.web") then return "" end
        local _PAGE_ACTIVE = PAGE_ACTIVE PAGE_ACTIVE = false
        return FAQ.SidebarOption(PAGE_NAME, PAGE_ICON, PAGE_TITLE, SHOW_PAGE_BADGE and PAGE_BADGE_TEXT or false, PAGE_BADGE_TYPE, _PAGE_ACTIVE) --[[R]]--
    end)
    exports['webadmin']:registerPluginPage(PAGE_NAME, function(data) --[[E]]--
        if not exports['webadmin']:isInRole("easyadmin.web") then return "" end
        PAGE_ACTIVE = true
        return FAQ.Nodes({ --[[R]]--
            FAQ.PageTitle(PAGE_TITLE),
            FAQ.BuildPage(CreatePage, data), --[[R]]--
        })
    end)
end)