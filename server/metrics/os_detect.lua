------------------------------------
-- EasyAdmin: OS detection
-- Detects whether the server is running on Windows or Linux.
-- Provides helpers for running shell commands and parsing output.
------------------------------------

-- ============================================================
-- OS Detection
-- ============================================================

---Detect OS by checking environment variables and path conventions.
---Caches result on first call.
---@return string 'windows' | 'linux'
local function detectOS()
	-- Check ProgramFiles (Windows-only env var)
	if os.getenv('ProgramFiles') then
		return 'windows'
	end

	-- Check HOME (Linux convention; Windows has USERPROFILE)
	if os.getenv('HOME') and not os.getenv('USERPROFILE') then
		return 'linux'
	end

	-- Check path separator convention via temp directory
	local temp = os.getenv('TEMP') or os.getenv('TMP')
	if temp and temp:find('\\') then
		return 'windows'
	end

	-- Check if /proc exists (Linux-only)
	local proc = io.open('/proc/version', 'r')
	if proc then
		proc:close()
		return 'linux'
	end

	-- Fallback: check if common Windows paths exist
	local windowsSystem = io.open('C:\\Windows\\System32\\cmd.exe', 'r')
	if windowsSystem then
		windowsSystem:close()
		return 'windows'
	end

	return 'linux' -- default fallback
end

-- Cached OS result
local serverOS = nil

---Get the detected server OS (cached).
---@return string 'windows' | 'linux'
function GetServerOS()
	if serverOS == nil then
		serverOS = detectOS()
		PrintDebugMessage(string.format('Metrics: Detected OS = %s', serverOS), 3)
	end
	return serverOS
end

---Check if server is running on Windows.
---@return boolean
function IsWindows()
	return GetServerOS() == 'windows'
end

---Check if server is running on Linux.
---@return boolean
function IsLinux()
	return GetServerOS() == 'linux'
end

-- ============================================================
-- Shell command helpers
-- ============================================================

---Execute a shell command and capture stdout.
---@param command string
---@return string|nil output
---@return string|nil error
local function execCommand(command)
	local handle = io.popen(command, 'r')
	if not handle then
		return nil, string.format('Failed to execute: %s', command)
	end

	local output = handle:read('*a')
	handle:close()

	return output or '', nil
end

---Execute a command with a timeout (non-blocking via coroutine).
---Returns the output or nil on timeout.
---@param command string
---@param timeoutMs number timeout in milliseconds
---@return string|nil output
function ExecWithTimeout(command, timeoutMs)
	local output = nil
	local done = false

	CreateThread(function()
		output = execCommand(command)
		done = true
	end)

	local elapsed = 0
	while not done and elapsed < timeoutMs do
		Wait(100)
		elapsed = elapsed + 100
	end

	if not done then
		PrintDebugMessage(string.format('Metrics: Command timed out after %dms: %s', timeoutMs, command), 3)
		return nil
	end

	return output
end
