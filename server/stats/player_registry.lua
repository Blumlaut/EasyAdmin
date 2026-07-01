------------------------------------
-- EasyAdmin: Player registry
-- Tracks unique players by identifiers across sessions.
-- Handles name history, session lengths, and playtime.
-- Persists to data/statistics/players.json
------------------------------------

-- ============================================================
-- In-memory state
-- ============================================================

-- Player registry keyed by a unique numeric ID.
-- { id, identifiers, name, firstSeen, lastSeen, sessions, playtime, sessionLengths, nameHistory }
local playerRegistry = {}
local nextPlayerId = 1

-- Reverse index: any identifier string → player registry entry ID
local playerIndex = {}

-- Direct index: entry ID → entry reference (avoids O(n) scan of playerRegistry)
local playerById = {}

-- Temporary: track connect times per source for session length calculation
local sessionStarts = {}

-- Temporary: map source → best identifier (set at sessionStart, used at playerDropped)
local sourceBestId = {}

-- File path (shared with player_history module)
local playersFile = 'data/statistics/players.json'

-- ============================================================
-- Helpers
-- ============================================================

---Pick the most stable identifier from a list (for display / primary reference).
---Preference: license2 > discord > license > ip > first available
---@param identifiers table
---@return string
local function pickStableIdentifier(identifiers)
	for _, id in ipairs(identifiers) do
		if id:find('^license2:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^discord:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^license:') and not id:find('^license2:') then return id end
	end
	for _, id in ipairs(identifiers) do
		if id:find('^ip:') then return id end
	end
	return identifiers[1] or 'unknown'
end

---Index all identifiers for a player entry (for reverse lookup).
---@param entry table
local function indexPlayerIdentifiers(entry)
	for _, id in ipairs(entry.identifiers) do
		playerIndex[id] = entry.id
	end
end

---Remove all identifier indices for a player entry.
---@param entry table
local function unindexPlayerIdentifiers(entry)
	for _, id in ipairs(entry.identifiers) do
		playerIndex[id] = nil
	end
end

---Find an existing player registry entry by checking ALL provided identifiers.
---@param identifiers table
---@return table|nil entry
local function findPlayerByIdentifiers(identifiers)
	local seen = {}
	for _, id in ipairs(identifiers) do
		local entryId = playerIndex[id]
		if entryId and not seen[entryId] then
			seen[entryId] = true
			return playerById[entryId]
		end
	end
	return nil
end

-- ============================================================
-- Persistence
-- ============================================================

local function load()
	local data = LoadJsonResourceFile(playersFile, {})
	local playerCounts = data.playerCounts or {} -- preserved but owned by player_history module
	playerRegistry = data.players or {}
	nextPlayerId = data.nextPlayerId or 1
	playerIndex = {}

	playerById = {}
	for _, entry in ipairs(playerRegistry) do
		indexPlayerIdentifiers(entry)
		playerById[entry.id] = entry
		if entry.id >= nextPlayerId then
			nextPlayerId = entry.id + 1
		end
	end
end

local function save()
	-- Read current playerCounts from disk so we don't overwrite them
	local existing = LoadJsonResourceFile(playersFile, {})
	SaveJsonResourceFile(playersFile, {
		playerCounts = existing.playerCounts or {},
		players = playerRegistry,
		nextPlayerId = nextPlayerId,
	})
end

-- ============================================================
-- Migration: backfill nameHistory for existing entries
-- ============================================================

local function migrateNameHistory()
	local migrated = 0
	for _, entry in ipairs(playerRegistry) do
		if not entry.nameHistory or #entry.nameHistory == 0 then
			if entry.name then
				entry.nameHistory = {
					{ name = entry.name, firstSeen = entry.firstSeen or 0, lastSeen = nil },
				}
				migrated = migrated + 1
			end
		end
	end
	if migrated > 0 then
		PrintDebugMessage(string.format('Backfilled nameHistory for %d player entries.', migrated), 2)
	end
end

-- ============================================================
-- Session events
-- ============================================================

---Client fires EasyAdmin:sessionStart once their ped is fully loaded.
RegisterServerEvent('EasyAdmin:sessionStart', function()
	local src = source
	local identifiers = GetPlayerIdentifiers(src)
	if #identifiers == 0 then return end

	local bestId = pickStableIdentifier(identifiers)
	local playerName = GetPlayerName(src) or 'Unknown'
	local now = os.time()

	sessionStarts[src] = now
	sourceBestId[src] = bestId

	-- Push translations so GetLocalisedText() works before the menu opens
	local strings, lang = I18nGetTranslations()
	if strings then
		TriggerClientEvent('EasyAdmin:SetLanguage', src, strings, lang)
	end

	local existingEntry = findPlayerByIdentifiers(identifiers)

	if existingEntry then
		if existingEntry.name ~= playerName then
			for _, nh in ipairs(existingEntry.nameHistory or {}) do
				if nh.name == existingEntry.name and nh.lastSeen == nil then
					nh.lastSeen = now
				end
			end
			if not existingEntry.nameHistory then
				existingEntry.nameHistory = {}
			end
			table.insert(existingEntry.nameHistory, {
				name = playerName,
				firstSeen = now,
				lastSeen = nil,
			})
		end
		existingEntry.name = playerName

		local hasNewIds = false
		local allIds = {}
		for _, id in ipairs(existingEntry.identifiers) do allIds[id] = true end
		for _, id in ipairs(identifiers) do
			if not allIds[id] then
				hasNewIds = true
				break
			end
		end

		if hasNewIds then
			unindexPlayerIdentifiers(existingEntry)
			for _, id in ipairs(identifiers) do
				if not allIds[id] then
					table.insert(existingEntry.identifiers, id)
				end
			end
			indexPlayerIdentifiers(existingEntry)
		end

		existingEntry.lastSeen = now
		existingEntry.sessions = (existingEntry.sessions or 0) + 1
	else
		local entry = {
			id             = nextPlayerId,
			name           = playerName,
			identifiers    = identifiers,
			firstSeen      = now,
			lastSeen       = now,
			sessions       = 1,
			playtime       = 0,
			sessionLengths = {},
			nameHistory = { { name = playerName, firstSeen = now, lastSeen = nil } },
		}
		nextPlayerId = nextPlayerId + 1
		table.insert(playerRegistry, entry)
		indexPlayerIdentifiers(entry)
		playerById[entry.id] = entry
	end
end)

---Handle playerDropped: calculate session length, store it, and persist.
AddEventHandler('playerDropped', function(reason) -- luacheck: ignore 212
	local src = source
	local connectTime = sessionStarts[src]
	if not connectTime then return end

	local sessionLength = os.time() - connectTime
	sessionStarts[src] = nil

	local trackedBestId = sourceBestId[src]
	sourceBestId[src] = nil

	if not trackedBestId then return end

	local entryId = playerIndex[trackedBestId]
	if not entryId then return end

	local entry = playerById[entryId]
	if entry then
		entry.playtime = (entry.playtime or 0) + sessionLength
		entry.lastSeen = os.time()

		if not entry.sessionLengths then
			entry.sessionLengths = {}
		end
		table.insert(entry.sessionLengths, sessionLength)
		if #entry.sessionLengths > 50 then
			table.remove(entry.sessionLengths, 1)
		end
	end

	save()
end)

-- ============================================================
-- Save on resource stop
-- ============================================================

AddEventHandler('onServerResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		save()
	end
end)

-- ============================================================
-- Public API
-- ============================================================

---Get the full player registry (internal use by stats_events)
function GetPlayerRegistry()
	return playerRegistry
end

---Find a player by identifiers
function FindPlayerByIdentifiers(identifiers)
	return findPlayerByIdentifiers(identifiers)
end

---Pick a stable identifier for display
function PickStableIdentifier(identifiers)
	return pickStableIdentifier(identifiers)
end

---Get all players filtered by cutoff and optional search query
---@param cutoff number unix timestamp (0 = no filter)
---@param query string|nil search query (case-insensitive name match)
---@return table
function GetFilteredPlayers(cutoff, query)
	local filtered = {}
	for _, data in ipairs(playerRegistry) do
		if data.firstSeen and data.firstSeen < cutoff then
			goto continue
		end
		if query then
			local name = (data.name or 'Unknown'):lower()
			if not name:find(query, 1, true) then
				goto continue
			end
		end
		table.insert(filtered, {
			name        = data.name or 'Unknown',
			identifier  = pickStableIdentifier(data.identifiers),
			firstSeen   = data.firstSeen or 0,
			lastSeen    = data.lastSeen or 0,
			sessions    = data.sessions or 0,
			playtime    = data.playtime or 0,
		})
		::continue::
	end
	return filtered
end

---Compute summary statistics from the registry
---@return table
function ComputeStatsSummary()
	local totalUnique = 0
	local totalSessions = 0
	local totalPlaytime = 0
	local newPlayers = 0
	local returningPlayers = 0
	local allSessionLengths = {}

	for _, data in ipairs(playerRegistry) do
		totalUnique = totalUnique + 1

		if (data.sessions or 0) > 1 then
			returningPlayers = returningPlayers + 1
		end

		totalSessions = totalSessions + (data.sessions or 0)
		totalPlaytime = totalPlaytime + (data.playtime or 0)

		if data.sessionLengths and #data.sessionLengths > 0 then
			for _, sl in ipairs(data.sessionLengths) do
				table.insert(allSessionLengths, sl)
			end
		end
	end

	local retentionRate = totalUnique > 0 and (returningPlayers / totalUnique) * 100 or 0

	local avgSession = 0
	if #allSessionLengths > 0 then
		local sum = 0
		for _, sl in ipairs(allSessionLengths) do
			sum = sum + sl
		end
		avgSession = sum / #allSessionLengths
	end

	table.sort(allSessionLengths)
	local medianSession = 0
	if #allSessionLengths > 0 then
		local mid = math.ceil(#allSessionLengths / 2)
		if #allSessionLengths % 2 == 1 then
			medianSession = allSessionLengths[mid]
		else
			medianSession = (allSessionLengths[mid] + allSessionLengths[mid + 1]) / 2
		end
	end

	local shortestSession = #allSessionLengths > 0 and allSessionLengths[1] or 0
	local longestSession = #allSessionLengths > 0 and allSessionLengths[#allSessionLengths] or 0

	return {
		totalUnique         = totalUnique,
		newPlayers          = newPlayers,
		returningPlayers    = returningPlayers,
		retentionRate       = math.floor(retentionRate * 10) / 10,
		avgSessionLength    = math.floor(avgSession),
		medianSessionLength = math.floor(medianSession),
		shortestSession     = math.floor(shortestSession),
		longestSession      = math.floor(longestSession),
		totalSessions       = totalSessions,
		totalPlaytime       = totalPlaytime,
	}
end

---Resolve identifiers for a player (online or cached)
---@param playerId number
---@return table
function ResolvePlayerIdentifiers(playerId)
	local identifiers = GetPlayerIdentifiers(playerId)
	if #identifiers == 0 then
		identifiers = (getCachedPlayerIdentifiers and getCachedPlayerIdentifiers(playerId)) or {}
	end
	return identifiers
end

-- ============================================================
-- Startup
-- ============================================================

load()
migrateNameHistory()
