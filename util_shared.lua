permissions = {
	["ban"] = false,
	["kick"] = false,
	["spectate"] = false,
	["unban"] = false,
	["teleport.player"] = false,
	["manageserver"] = false,
	["slap"] = false,
	["freeze"] = false,
	["screenshot"] = false,
	["immune"] = false,
	["anon"] = false,
	["mute"] = false,
	["teleport.everyone"] = false,
}


function GetLocalisedText(string)
	if not strings then return "Strings not Loaded yet!" end
	if not string then return "No String!" end
	if strings[string] then
		return strings[string]
	else
		return "String "..string.." not found in "..strings.language
	end
end

function PrintDebugMessage(msg)
	if enableDebugging then -- make sure debugging is enabled before Proceding
		Citizen.Trace("^1"..GetCurrentResourceName().."^7: "..msg.."^7\n")
	else
		if GetConvar("ea_enableDebugging", "false") == "true" then
			enableDebugging = true
			PrintDebugMessage(msg) -- recursion?
		end
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

--- http://www.lua.org/pil/11.5.html
function Set (list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end
