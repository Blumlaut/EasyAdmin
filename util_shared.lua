permissions = {
	["player.ban.temporary"] = false,
	["player.ban.permanent"] = false,
	["player.ban.view"] = false,
	["player.ban.edit"] = false,
	["player.ban.remove"] = false,
	["player.kick"] = false,
	["player.spectate"] = false,
	["player.teleport.single"] = false,
	["player.slap"] = false,
	["player.freeze"] = false,
	["player.screenshot"] = false,
	["player.mute"] = false,
	["player.warn"] = false,
	["player.teleport.everyone"] = false,
	["player.reports.view"] = false,
	["player.reports.claim"] = false,
	["player.reports.process"] = false,
	
	["server.cleanup.cars"] = false,
	["server.cleanup.props"] = false,
	["server.cleanup.peds"] = false,
	["server.permissions.read"] = false,
	["server.permissions.write"] = false,
	["server.shortcut.add"] = false,
	["server.reminder.add"] = false,
	["server.convars"] = false,
	["server.resources.start"] = false,
	["server.resources.stop"] = false,
	["server.chat"] = false,
	
	["immune"] = false,
	["anon"] = false,
}


function PrintDebugMessage(msg,level)
	loglevel = (GetConvarInt("ea_logLevel", 1))
	if not level or not tonumber(level) then level = 3 end
	
	if level == 1 and loglevel >= level then -- ERROR Loglevel
		Citizen.Trace("^1"..GetCurrentResourceName().."^7: "..msg.."^7\n")

		if IsDuplicityVersion() then
			for i,k in pairs(GetOnlineAdmins()) do
				TriggerClientEvent("EasyAdmin:showNotification", i, string.gsub(msg, "%^%d", ""))
			end
		else
			TriggerEvent("EasyAdmin:showNotification", string.gsub(msg, "%^%d", ""))
		end
	elseif level == 2 and loglevel >= level then -- WARN Loglevel
		Citizen.Trace("^3"..GetCurrentResourceName().."^7: "..msg.."^7\n")
	elseif level == 3 and loglevel >= level then -- INFO Loglevel 
		Citizen.Trace("^0"..GetCurrentResourceName().."^7: "..msg.."^7\n")
	elseif level == 4 and loglevel >= level then -- DEV Loglevel
		Citizen.Trace("^7"..GetCurrentResourceName().."^7: "..msg.."^7\n")
	elseif level > 4 and loglevel >= level then -- anything above 4 shouldn't exist, but kept just in case
		Citizen.Trace("^5"..GetCurrentResourceName().."^7: "..msg.."^7\n")
	end
end

if IsDuplicityVersion() then
	if GetConvar("ea_enableDebugging", "false") ~= "false" or GetConvarInt("ea_logLevel", 1) ~= 1 then
		SetConvar("ea_enableDebugging", "false")
		if GetConvarInt("ea_logLevel", 1) == 1 then
			SetConvar("ea_logLevel", 3)
		end
		if GetConvarInt("ea_logLevel", 1) > 1 then
			PrintDebugMessage("Debug Messages Enabled, Verbosity is ^2"..GetConvarInt("ea_logLevel", 1).."^7.", 2)
		end
	else
		enableDebugging = false
	end
end

if not IsDuplicityVersion() then
	RegisterNUICallback("keyboardFinished", function(data, cb)
		keyboardResult = data.result
		keyboardState = data.state
		cb('ok')
	end)
end


function displayKeyboardInput(title,default,maxLength)
	if alreadyTyping then return nil end
	keyboardResult, keyboardState = nil
	local label = GetLabelText(title)

	SetNuiFocus(true, true)
	SendNUIMessage({action= "open", title=label, default=default, maxLength=maxLength, resource=GetCurrentResourceName()})

	alreadyTyping = true

	while not keyboardState do --While typing is not aborted and not finished, this loop waits
		Citizen.Wait(0)
	end

	alreadyTyping = false
	SetNuiFocus(false,false)
	if keyboardState == 0 then
		return keyboardResult
	else
		return nil
	end
--[[ -- default V Input
	DisplayOnscreenKeyboard(1, title, "", default, "", "", "", maxLength)

	while UpdateOnscreenKeyboard() ~= 1 and UpdateOnscreenKeyboard() ~= 2 do --While typing is not aborted and not finished, this loop waits
		Citizen.Wait(0)
	end
		
	if UpdateOnscreenKeyboard() ~= 2 then
		local result = GetOnscreenKeyboardResult()
		return result
	else
		return nil
	end
]]
end

function copyToClipboard(text)
	SendNUIMessage({action= "clip", text=text})
	TriggerEvent("EasyAdmin:showNotification", GetLocalisedText("copiedtoclipboard"))
end

function DoesPlayerHavePermission(player, object)
	if IsDuplicityVersion() then
		local haspermission = false
		if (player == 0 or player == "") then
			return true
		end-- Console. It's assumed this will be an admin with access.
		
		if not string.find(object, "easyadmin.") then -- compatability with outdated plugins
			object = "easyadmin."..object
		end
		
		if IsPlayerAceAllowed(player,object) then -- check if the player has access to this permission
			haspermission = true
			PrintDebugMessage(getName(player, true).." has Permissions for "..object..".", 4)
		else
			haspermission = false
			PrintDebugMessage(getName(player, true).." does not have Permissions for "..object..".", 4)
		end
		return haspermission
	else
		return permissions[object]
	end
end

function DoesPlayerHavePermissionForCategory(player, object)
	for perm in pairs(permissions) do
		if string.startswith(perm, object) then
			if DoesPlayerHavePermission(player, perm) then
				return true
			end
		end
	end
	return false
end


function GetVersion()
	local resourceName = GetCurrentResourceName()
	local version = GetResourceMetadata(resourceName, 'version', 0)
	local is_master = GetResourceMetadata(resourceName, 'is_master', 0) == "yes" or false
	return version, is_master
end


function GetLocalisedText(string)
	if not strings then return "Strings not Loaded yet!" end
	if not string then return "No String!" end
	if strings[string] then
		return strings[string]
	else
		return "String "..string.." not found in "..strings.language
	end
end

function formatDateString(string)
	local dateFormat = GetConvar("ea_dateFormat", '%d/%m/%Y 	%H:%M:%S')
	return os.date(dateFormat, string)
end

function formatShortcuts(thisstring)
	if not thisstring then return thisstring end
	local cleanString = string.gsub(string.lower(thisstring), " ", "")
	for shortcut,value in pairs(MessageShortcuts) do
		if string.lower(shortcut) == cleanString then
			thisstring = value
		end
	end
	return thisstring
end

function formatRightString(thisstring, customWidth)
	if not thisstring then return thisstring end -- in case string is nil, just yeet it back.
	local width = (customWidth or maxRightTextWidth)
	if string.len(thisstring) > width then
		thisstring = string.sub(thisstring, 1, width)..".."
	end

	return thisstring
end


-- some util funcs so i dont have to mess with NativeUI Source Code.
function getMenuItemTitle(item)
	if (item.Base and type(item.Base.Text) == "table" and item.Base.Text._Text) then
		return item.Base.Text._Text
	elseif (item.Text and type(item.Text) == "table" and item.Text._Text) then
		return item.Text._Text
	end
end

function setMenuItemTitle(item,text)
	if (item.Base and type(item.Base.Text) == "table" and item.Base.Text._Text) then
		item.Base.Text._Text = text
	elseif (item.Text and type(item.Text) == "table" and item.Text._Text) then
		item.Text._Text = text
	end
end

function math.round(num, numDecimalPlaces)
	if numDecimalPlaces and numDecimalPlaces>0 then
		local mult = 10^numDecimalPlaces
		return math.floor(num * mult + 0.5) / mult
	end
	return math.floor(num + 0.5)
end

function string.split(inputstr, sep)
	if sep == nil then
		sep = "%s"
	end
	local t={} ; i=1
	for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
		t[i] = str
		i = i + 1
	end
	return t
end

function string.reverse(s)
	local r = ""
	for p,c in utf8.codes(s) do
		r = utf8.char(c)..r
	end
	return r
end

function string.startswith(string,start)
	return string:sub(1,string.len(start))==start
 end


--- http://www.lua.org/pil/11.5.html
function Set (list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end

-- Convert a lua table into a lua syntactically correct string
function table_to_string(tbl)
	return json.encode(tbl)
end

function mergeTables(t1, t2)
	local t = t1
	for i,v in pairs(t2) do
		table.insert(t, v)
	end
	return t
end


-- terrible function to look for URLs in a string
function matchURL(text_with_URLs)
	
	local domains = [[.ac.ad.ae.aero.af.ag.ai.al.am.an.ao.aq.ar.arpa.as.asia.at.au.aw.ax.az.ba.bb.bd.be.bf.bg.bh.bi.biz.bj.bm.bn.bo.br.bs.bt.bv.bw.by.bz.ca.cat.cc.cd.cf.cg.ch.ci.ck.cl.cm.cn.co.com.coop.cr.cs.cu.cv.cx.cy.cz.dd.de.dj.dk.dm.do.dz.ec.edu.ee.eg.eh.er.es.et.eu.fi.firm.fj.fk.fm.fo.fr.fx.ga.gb.gd.ge.gf.gh.gi.gl.gm.gn.gov.gp.gq.gr.gs.gt.gu.gw.gy.hk.hm.hn.hr.ht.hu.id.ie.il.im.in.info.int.io.iq.ir.is.it.je.jm.jo.jobs.jp.ke.kg.kh.ki.km.kn.kp.kr.kw.ky.kz.la.lb.lc.li.lk.lr.ls.lt.lu.lv.ly.ma.mc.md.me.mg.mh.mil.mk.ml.mm.mn.mo.mobi.mp.mq.mr.ms.mt.mu.museum.mv.mw.mx.my.mz.na.name.nato.nc.ne.net.nf.ng.ni.nl.no.nom.np.nr.nt.nu.nz.om.org.pa.pe.pf.pg.ph.pk.pl.pm.pn.post.pr.pro.ps.pt.pw.py.qa.re.ro.ru.rw.sa.sb.sc.sd.se.sg.sh.si.sj.sk.sl.sm.sn.so.sr.ss.st.store.su.sv.sy.sz.tc.td.tel.tf.tg.th.tj.tk.tl.tm.tn.to.tp.tr.travel.tt.tv.tw.tz.ua.ug.uk.um.us.uy.va.vc.ve.vg.vi.vn.vu.web.wf.ws.xxx.ye.yt.yu.za.zm.zr.zw]]
		
	local tlds = {}
	for tld in domains:gmatch'%w+' do
		tlds[tld] = true
	end
	local function max4(a,b,c,d) return math.max(a+0, b+0, c+0, d+0) end
	local protocols = {[''] = 0, ['http://'] = 0, ['https://'] = 0, ['ftp://'] = 0}
	local finished = {}
	
	for pos_start, url, prot, subd, tld, colon, port, slash, path in
	text_with_URLs:gmatch'()(([%w_.~!*:@&+$/?%%#-]-)(%w[-.%w]*%.)(%w+)(:?)(%d*)(/?)([%w_.~!*:@&+$/?%%#=-]*))'
	do
		if protocols[prot:lower()] == (1 - #slash) * #path and not subd:find'%W%W'
		and (colon == '' or port ~= '' and port + 0 < 65536)
		and (tlds[tld:lower()] or tld:find'^%d+$' and subd:find'^%d+%.%d+%.%d+%.$'
		and max4(tld, subd:match'^(%d+)%.(%d+)%.(%d+)%.$') < 256)
		then
			finished[pos_start] = true
			return url
		end
	end
	
	for pos_start, url, prot, dom, colon, port, slash, path in
	text_with_URLs:gmatch'()((%f[%w]%a+://)(%w[-.%w]*)(:?)(%d*)(/?)([%w_.~!*:@&+$/?%%#=-]*))'
	do
		if not finished[pos_start] and not (dom..'.'):find'%W%W'
		and protocols[prot:lower()] == (1 - #slash) * #path
		and (colon == '' or port ~= '' and port + 0 < 65536)
		then
			return url
		end
	end
end