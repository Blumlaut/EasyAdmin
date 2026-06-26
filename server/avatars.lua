------------------------------------
-- EasyAdmin: Avatar fetching
-- Fetches player avatars from the Cfx.re policy API
------------------------------------

-- Avatar cache: fivem identifier -> avatar URL (or false if no avatar)
local avatarCache = {}

---Fetch a player's avatar URL from the Cfx.re policy API.
---Uses the player's `fivem:` identifier to look up their forum avatar.
---Results are cached to avoid repeated API calls.
---@param playerId number
---@return string|nil
function GetPlayerAvatar(playerId)
	local identifiers = GetPlayerIdentifiers(playerId)
	local fivemAccount = nil

	for _, identifier in ipairs(identifiers) do
		if string.find(identifier, 'fivem:') then
			fivemAccount = string.sub(identifier, string.len('fivem:') + 1)
			break
		end
	end

	if not fivemAccount then
		return nil
	end

	-- Check cache
	if avatarCache[fivemAccount] ~= nil then
		return avatarCache[fivemAccount] == false and nil or avatarCache[fivemAccount]
	end

	-- Fetch from Cfx.re policy API
	local response, requestErr = HTTPRequest(string.format('https://policy-live.fivem.net/api/getUserInfo/%s', fivemAccount))
	if not response then
		avatarCache[fivemAccount] = false
		return nil
	end

	local success, parsed = pcall(json.decode, response)
	if success and parsed and parsed.avatar_template then
		local avatarURL = string.gsub(parsed.avatar_template, '{size}', '96')
		if string.find(avatarURL, 'http') == nil then
			avatarURL = 'https://forum.cfx.re' .. avatarURL
		end
		avatarCache[fivemAccount] = avatarURL
		return avatarURL
	end

	avatarCache[fivemAccount] = false
	return nil
end
exports('GetPlayerAvatar', GetPlayerAvatar)

---Fetch avatars for all online players and push to NUI.
---Called by the client when the player list is displayed.
RegisterServerEvent('EasyAdmin:fetchPlayerAvatars', function()
	local src = source
	if not DoesPlayerHavePermissionForCategory(src, 'player') then return end

	for _, player in pairs(GetPlayers()) do
		local playerId = tonumber(player)
		local avatar = GetPlayerAvatar(playerId)
		if avatar then
			TriggerClientEvent('EasyAdmin:playerAvatarResult', src, playerId, avatar)
		end
	end
end)
