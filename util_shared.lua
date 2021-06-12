permissions = {
	["ban.temporary"] = false,
	["ban.permanent"] = false,
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
	["warn"] = false
}


function PrintDebugMessage(msg,level)
	loglevel = (GetConvarInt("ea_logLevel", 1))
	if not level or not tonumber(level) then level = 3 end

	if level == 1 and loglevel >= level then -- ERROR Loglevel
		Citizen.Trace("^1"..GetCurrentResourceName().."^7: "..msg.."^7\n")
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


--- http://www.lua.org/pil/11.5.html
function Set (list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end

-- Convert a lua table into a lua syntactically correct string
function table_to_string(tbl)
    local result = "{"
    for k, v in pairs(tbl) do
        -- Check the key type (ignore any numerical keys - assume its an array)
        if type(k) == "string" then
            result = result.."[\""..k.."\"]".."="
        end

        -- Check the value type
        if type(v) == "table" then
            result = result..table_to_string(v)
        elseif type(v) == "boolean" then
            result = result..tostring(v)
        else
            result = result.."\""..v.."\""
        end
        result = result..","
    end
    -- Remove leading commas from the result
    if result ~= "" then
        result = result:sub(1, result:len()-1)
    end
    return result.."}"
end