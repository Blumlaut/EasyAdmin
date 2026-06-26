------------------------------------
-- EasyAdmin: server-side file utils
-- Server-only helpers for JSON resource file persistence
------------------------------------

function LoadJsonResourceFile(path, defaultValue)
	local data = LoadResourceFile(GetCurrentResourceName(), path)
	if not data then
		return defaultValue
	end

	local ok, decoded = pcall(json.decode, data)
	if ok and type(decoded) == "table" then
		return decoded
	end

	PrintDebugMessage(string.format("Failed to decode %s, using fallback.", path), 1)
	return defaultValue
end

function SaveJsonResourceFile(path, data)
	local encoded = json.encode(data, { indent = true })
	if not encoded then
		PrintDebugMessage(string.format("Failed to encode %s.", path), 1)
		return false
	end

	local success = SaveResourceFile(GetCurrentResourceName(), path, encoded, -1)
	if not success then
		PrintDebugMessage(string.format("Failed to save %s — check folder write permissions.", path), 1)
		return false
	end

	return true
end
