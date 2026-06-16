# MCP Server — Design Document

**Status:** Draft  
**Target:** EasyAdmin 8.x

---

## FiveM References

All FiveM scripting decisions in this document reference the official documentation. Key references:

| Topic | Documentation |
|-------|---------------|
| Resource model | [Introduction to Resources](https://docs.fivem.net/docs/scripting-manual/introduction/introduction-to-resources/) |
| Resource manifest | [Resource Manifest Reference](https://docs.fivem.net/docs/scripting-reference/resource-manifest/) |
| Server-side JS | [Scripting in JavaScript](https://docs.fivem.net/docs/scripting-manual/runtimes/javascript/) |
| Node.js APIs in FiveM | [Using Node.js APIs](https://docs.fivem.net/docs/scripting-manual/runtimes/javascript/#using-nodejs-apis) |
| Exports | [Using Exports](https://docs.fivem.net/docs/scripting-manual/runtimes/lua/#using-exports) |
| `SetHttpHandler` | [SET_HTTP_HANDLER](https://docs.fivem.net/natives/?_0x25BC98A59C2EA962) |
| `PerformHttpRequest` | [PerformHttpRequest](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/PerformHttpRequest/) |
| Convars | [Convars](https://docs.fivem.net/docs/scripting-reference/convars/) |
| Events | [Triggering Events](https://docs.fivem.net/docs/scripting-manual/working-with-events/triggering-events/) |

### Key FiveM Constraints

- **`SetHttpHandler`** — Registers a handler for HTTP requests made to the executing resource. The endpoint is automatically routed to `http://<server-ip>:<port>/<resource-name>/*`. A request to `http://localhost:30120/easyadmin/mcp` hits EasyAdmin's handler with path `/mcp` ([SET_HTTP_HANDLER](https://docs.fivem.net/natives/?_0x25BC98A59C2EA962)).

- **Request object** — `{ headers: object, method: string, address: string, path: string, setDataHandler(fn), setCancelHandler(fn) }`. The `setDataHandler` callback receives the request body as a string or `Uint8Array` ([ResourceHttpHandler.cpp](https://github.com/citizenfx/fivem/blob/master/code/components/citizen-server-impl/src/ResourceHttpHandler.cpp)).

- **Response object** — `{ write(data), writeHead(statusCode, headers), send(data) }`. The `send` method writes data and ends the response in one call. `writeHead` sets status code and optional headers before `write`/`send`.

- **Rate limiting** — FiveM applies automatic rate limiting per resource HTTP endpoint (default: 10 req/s burst, 25 req/s sustained) via `KeyedRateLimiter` on `http_<resource>` ([ResourceHttpHandler.cpp](https://github.com/citizenfx/fivem/blob/master/code/components/citizen-server-impl/src/ResourceHttpHandler.cpp)).

- **Thread affinity** — Node.js callbacks run on a separate libuv thread. Any FiveM native calls must be wrapped in `setImmediate()` to return to the main game thread. Error: "No current resource manager" if violated ([Scripting in JavaScript](https://docs.fivem.net/docs/scripting-manual/runtimes/javascript/#thread-affinity)).

- **`fxmanifest.lua` runs in isolation** — The manifest is executed in a separate runtime from any Lua/JS scripts. It cannot access script-level globals or call natives beyond the manifest API ([Resource Manifest](https://docs.fivem.net/docs/scripting-reference/resource-manifest/resource-manifest/)).

- **JS on server only** — JavaScript (`.js` files) runs server-side only. Client-side JS is not supported. The client runtime is Lua-only ([client_script](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#client-script)).

- **FiveM server port** — The HTTP server runs on the same port as the game server (default `30120`). No separate port configuration is needed. The port is determined by `endpoint_add_tcp`/`endpoint_add_udp` in `server.cfg`.

---

## Problem Statement

Server operators and admins need a way to perform EasyAdmin actions from outside the game — from AI-assisted chat interfaces (Cursor, Claude Desktop, Windsurf, etc.). Currently, admin actions require either:

1. Being in-game and using the NUI menu
2. Using the Discord bot (requires Discord infrastructure)
3. Using in-game chat commands (requires being connected)

An MCP (Model Context Protocol) server would expose EasyAdmin's capabilities as structured tools that any MCP-compatible AI application can call. This enables:

- **Remote administration** — Manage the server from any AI chat, anywhere
- **AI-assisted decisions** — "Who has the most warnings?" "Show me recent reports"
- **Natural language actions** — "Kick anyone named 'toxic_player'" (with safety rails)
- **Audit trail** — All MCP actions logged through existing webhook infrastructure

---

## Why Not a Separate HTTP Server?

The initial instinct is to create a standalone `http.createServer()` inside the JS runtime. This works but has downsides:

| Approach | Pros | Cons |
|----------|------|------|
| `http.createServer()` | Full control, separate port | Extra port to expose/firewall, separate lifecycle, thread affinity gotchas |
| `SetHttpHandler` | No extra port, FiveM-managed lifecycle, built-in rate limiting, TLS via FiveM's proxy | Shares game port, limited to FiveM's HTTP API surface |

**Decision: Use `SetHttpHandler`.** It integrates cleanly with FiveM's infrastructure — no extra ports, automatic lifecycle management (handler unregisters when resource stops), and built-in rate limiting. The shared port is not a concern since the game port is already exposed to the internet for players to connect.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AI App (Cursor, Claude, etc.)                 │
│                                                                      │
│  MCP Client                                                          │
│  ┌─────────────────────────┐                                         │
│  │  tools/call             │  POST http://<server>:<port>/           │
│  │  tools/list             │  easyadmin/mcp                          │
│  │  initialize             │                                         │
│  └────────────┬────────────┘                                         │
│               │ JSON-RPC over HTTP                                    │
└───────────────┼──────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FiveM Server                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  EasyAdmin resource                                          │    │
│  │                                                              │    │
│  │  ┌─────────────────────────┐    ┌────────────────────────┐   │    │
│  │  │  dist/mcp.js            │    │  server/*.lua          │   │    │
│  │  │                         │    │                        │   │    │
│  │  │  SetHttpHandler()       │    │  exports('kickPlayer') │   │    │
│  │  │    │                    │    │  exports('addBan')     │   │    │
│  │  │    ▼                    │    │  exports('getCached    │   │    │
│  │  │  MCP Protocol           │    │   Players')            │   │    │
│  │  │  (JSON-RPC)             │    │  exports('announce')   │   │    │
│  │  │                         │    │  ... (34 exports)      │   │    │
│  │  │  tools/list  ──────┐    │    └───────────┬────────────┘   │    │
│  │  │  tools/call  ──► call│                   │                │    │
│  │  │                   │ exports[]            │                │    │
│  │  └────────────────────┘                     │                │    │
│  │                                              │                │    │
│  └──────────────────────────────────────────────┼────────────────┘    │
│                                                 │                     │
└─────────────────────────────────────────────────┼─────────────────────┘
                                                  │
                    Response: JSON-RPC result ◄───┘
```

### Data Flow

1. **AI App** sends a JSON-RPC request to `http://<server>:<port>/easyadmin/mcp`
2. **FiveM HTTP server** routes to EasyAdmin's `SetHttpHandler` with path `/mcp`
3. **MCP handler** (`dist/mcp.js`) parses the JSON-RPC request
4. **Auth check** — Validates `Authorization: Bearer <token>` against token store, resolves admin identity
5. **Tool dispatch** — Routes to the appropriate tool handler, passing admin identity for attribution
6. **EasyAdmin exports** — Tool calls `exports[EasyAdmin].functionName()` (Lua side)
7. **Response** — Result flows back through the same chain as JSON-RPC response

---

## MCP Protocol

MCP supports two transport modes: **stdio** (for local processes) and **HTTP** (for remote servers). We use HTTP transport.

### Endpoint

```
POST http://<server-ip>:<port>/easyadmin/mcp
Content-Type: application/json
X-EasyAdmin-API-Key: <key>
```

### JSON-RPC Methods

| Method | Description |
|--------|-------------|
| `initialize` | Handshake — returns server info, protocol version, capabilities |
| `tools/list` | Returns list of available tools with schemas |
| `tools/call` | Invokes a tool with arguments |

### Request/Response Format

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_players",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"id\":1,\"name\":\"PlayerOne\",\"ping\":45},...]"
      }
    ]
  }
}
```

**Error response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid arguments: 'target' is required"
  }
}
```

---

## Authentication

All requests require a **Bearer token** passed via the standard `Authorization` header. Tokens are generated per-admin through the EasyAdmin NUI Settings page and stored server-side in a data file. Each token is scoped to the admin who created it, carrying their identity and permissions.

| Convar | Type | Default | Description |
|--------|------|---------|-------------|
| `ea_mcpEnabled` | bool | `false` | Enable/disable the MCP endpoint |

### Token Format

Tokens are 64-character hex strings (256-bit), prefixed with `ea_` for identification:

```
Authorization: Bearer ea_a1b2c3d4e5f6...
```

### Token Storage

Tokens are stored in `data/mcp_tokens.json` (created on first token generation):

```json
{
  "ea_a1b2c3d4...": {
    "adminId": 3,
    "adminName": "JohnDoe",
    "adminIdentifiers": ["steam:110000112345678"],
    "createdAt": 1718000000,
    "label": "Cursor"        // user-defined label for identification
  },
  "ea_f6e5d4c3...": {
    "adminId": 7,
    "adminName": "Alice",
    "adminIdentifiers": ["steam:110000119876543"],
    "createdAt": 1718100000,
    "label": "Claude Desktop"
  }
}
```

The file is read/written by server-side Lua (same pattern as banlist backups, player cache, etc.). The JS MCP handler loads the token map on startup and watches for changes.

### Auth Flow

1. Request arrives at `SetHttpHandler`
2. If `ea_mcpEnabled` is `false`, return `404 Not Found` (no information leakage)
3. Parse `Authorization: Bearer <token>` header
4. Look up token in the token map
5. If missing or invalid, return `401 Unauthorized`
6. If valid, the request is attributed to the token's admin for logging/audit
7. Process the request — actions are logged with the admin's name (not "MCP")

### Token Generation (NUI Settings Page)

A new section in the Settings page (under a new "MCP" nav item or within Server settings):

```
┌─────────────────────────────────────────────┐
│  MCP Server                                 │
├─────────────────────────────────────────────┤
│  [✓] Enable MCP Server                      │
│                                             │
│  Your Tokens:                               │
│  ┌───────────────────────────────────────┐  │
│  │ ea_a1b2c3d4...    Cursor             │  │
│  │                     Created: 01.06.25 │  │
│  │                     [Revoke]          │  │
│  ├───────────────────────────────────────┤  │
│  │ ea_f6e5d4c3...    Claude Desktop     │  │
│  │                     Created: 02.06.25 │  │
│  │                     [Revoke]          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Token Label:  [____________]               │
│  [Generate Token]                           │
│                                             │
│  ⚠ Generated tokens are shown only once.    │
│    Store them securely.                     │
└─────────────────────────────────────────────┘
```

**Generation flow:**
1. Admin types a label (e.g. "Cursor", "Claude Desktop") in the input
2. Clicks "Generate Token"
3. NUI calls `callLua('generateMcpToken', { label })`
4. Lua generates a 64-char hex token, stores admin identity + label in `data/mcp_tokens.json`
5. Token is returned to NUI and displayed in a modal (copy-to-clipboard, shown once)
6. Token list refreshes

**Revocation flow:**
1. Admin clicks "Revoke" on a token
2. Confirmation dialog (existing `openConfirm` pattern)
3. NUI calls `callLua('revokeMcpToken', { token })`
4. Lua removes token from `data/mcp_tokens.json`
5. Token list refreshes

### Permission Model

Tokens carry the admin's identity. When an MCP action is executed:

- The action is **attributed to the token's admin** (their name appears in webhooks, logs, ban reasons)
- The admin's **existing ACE permissions apply** — if they can't kick players in-game, their MCP token can't kick either
- This is enforced by the existing EasyAdmin permission system — the Lua exports already check permissions, and the MCP handler passes the admin's source/identifiers through

This means MCP tokens are not "god mode" — they inherit the admin's existing permission level. If an admin is demoted in-game, their MCP token reflects that on the next permission check.

---

## Tool Definitions

Each MCP tool maps to one or more EasyAdmin Lua exports. Tools follow the MCP schema format with `inputSchema` defining required/optional arguments.

### `get_players`

List all online players.

```json
{
  "name": "get_players",
  "description": "Get a list of all online players with their IDs, names, pings, and identifiers.",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

**Maps to:** `exports[EasyAdmin].getCachedPlayers()`

**Returns:** Array of `{ id, name, ping, identifiers[], discord? }`

---

### `get_player_info`

Get detailed information about a specific player.

```json
{
  "name": "get_player_info",
  "description": "Get detailed information about a specific player by ID or name.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      }
    },
    "required": ["target"]
  }
}
```

**Maps to:** `exports[EasyAdmin].getCachedPlayer(target)`

**Returns:** `{ id, name, ping, identifiers[], discord?, dropped }` or error if not found

---

### `kick_player`

Kick a player from the server.

```json
{
  "name": "kick_player",
  "description": "Kick a player from the server. Requires a reason.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "reason": {
        "type": "string",
        "description": "Reason for the kick (shown to the player)"
      }
    },
    "required": ["target", "reason"]
  }
}
```

**Maps to:** `DropPlayer(playerId, reason)` (native, same as Discord bot's kick command)

**Returns:** `{ success: true }` or error if player not found

---

### `ban_player`

Ban a player (temporarily or permanently).

```json
{
  "name": "ban_player",
  "description": "Ban a player. Use duration (seconds) for temp bans, omit for permanent.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "reason": {
        "type": "string",
        "description": "Reason for the ban"
      },
      "duration": {
        "type": "number",
        "description": "Ban duration in seconds. Omit or 0 for permanent ban."
      }
    },
    "required": ["target", "reason"]
  }
}
```

**Maps to:** `exports[EasyAdmin].addBan(target, reason, duration, "MCP")`

**Returns:** `{ success: true, banId: number }` or error

---

### `unban_player`

Remove a ban from the banlist.

```json
{
  "name": "unban_player",
  "description": "Remove a ban from the banlist by ban ID.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "banId": {
        "type": "number",
        "description": "The ban ID to remove"
      }
    },
    "required": ["banId"]
  }
}
```

**Maps to:** `exports[EasyAdmin].unbanPlayer(banId)`

**Returns:** `{ success: true }` or error

---

### `get_banlist`

List all bans or search the banlist.

```json
{
  "name": "get_banlist",
  "description": "Get the banlist. Optionally search by player name or identifier.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "search": {
        "type": "string",
        "description": "Optional search term (name or identifier substring)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of results (default: 100)"
      }
    },
    "required": []
  }
}
```

**Maps to:** Iterates banlist via `exports[EasyAdmin].fetchBan(id)` with `GetFreshBanId()`

**Returns:** Array of `{ banId, name, reason, moderator, date, expires, identifiers[] }`

---

### `warn_player`

Issue a warning to a player.

```json
{
  "name": "warn_player",
  "description": "Issue a warning to a player. After max warnings, automatic action (kick/ban) is triggered based on config.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "reason": {
        "type": "string",
        "description": "Reason for the warning"
      }
    },
    "required": ["target", "reason"]
  }
}
```

**Maps to:** `exports[EasyAdmin].warnPlayer(target, reason, "MCP")`

**Returns:** `{ success: true, warnings: number, maxWarnings: number }` or error

---

### `get_player_warnings`

Get warning count for a player.

```json
{
  "name": "get_player_warnings",
  "description": "Get the number of warnings a player has.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      }
    },
    "required": ["target"]
  }
}
```

**Maps to:** `exports[EasyAdmin].getPlayerWarnings(target)`

**Returns:** `{ warnings: number, maxWarnings: number }`

---

### `mute_player`

Mute a player from chat.

```json
{
  "name": "mute_player",
  "description": "Mute or unmute a player from chat.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "mute": {
        "type": "boolean",
        "description": "True to mute, false to unmute"
      },
      "reason": {
        "type": "string",
        "description": "Reason for the mute"
      }
    },
    "required": ["target", "mute"]
  }
}
```

**Maps to:** `exports[EasyAdmin].mutePlayer(target, mute, reason)`

**Returns:** `{ success: true }` or error

---

### `freeze_player`

Freeze or unfreeze a player.

```json
{
  "name": "freeze_player",
  "description": "Freeze or unfreeze a player (prevents movement).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "freeze": {
        "type": "boolean",
        "description": "True to freeze, false to unfreeze"
      }
    },
    "required": ["target", "freeze"]
  }
}
```

**Maps to:** `exports[EasyAdmin].freezePlayer(target, freeze)`

**Returns:** `{ success: true }` or error

---

### `slap_player`

Slap a player (deal damage).

```json
{
  "name": "slap_player",
  "description": "Slap a player, dealing the specified amount of damage.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "description": "Player server ID (number) or name (string)"
      },
      "damage": {
        "type": "number",
        "description": "Amount of damage to deal"
      }
    },
    "required": ["target", "damage"]
  }
}
```

**Maps to:** `exports[EasyAdmin].slapPlayer(target, damage)`

**Returns:** `{ success: true }` or error

---

### `get_reports`

List admin call/reports.

```json
{
  "name": "get_reports",
  "description": "Get a list of admin calls and player reports.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "number",
        "description": "Maximum number of reports (default: 50)"
      }
    },
    "required": []
  }
}
```

**Maps to:** `exports[EasyAdmin].getAllReports()`

**Returns:** Array of `{ id, reporter, target, reason, date, resolved }`

---

### `announce`

Send a server-wide announcement.

```json
{
  "name": "announce",
  "description": "Send a server-wide announcement notification to all players.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "The announcement message"
      }
    },
    "required": ["message"]
  }
}
```

**Maps to:** `exports[EasyAdmin].announce(message)`

**Returns:** `{ success: true }`

---

### `cleanup`

Clean up spawned entities (vehicles, peds, props).

```json
{
  "name": "cleanup",
  "description": "Clean up spawned entities. Type: 'vehicles', 'peds', 'props', or 'all'.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["vehicles", "peds", "props", "all"],
        "description": "What to clean up"
      }
    },
    "required": ["type"]
  }
}
```

**Maps to:** `exports[EasyAdmin].cleanupArea(type)`

**Returns:** `{ success: true, cleaned: number }`

---

### `server_info`

Get server information.

```json
{
  "name": "server_info",
  "description": "Get server information including version, player count, and online admins.",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

**Maps to:** `exports[EasyAdmin].GetVersion()`, `exports[EasyAdmin].GetOnlineAdmins()`, `GetPlayerCount()` (native)

**Returns:** `{ version, playerCount, maxPlayers, onlineAdmins[] }`

---

### `is_player_banned`

Check if a player/identifier is banned.

```json
{
  "name": "is_player_banned",
  "description": "Check if a player identifier is currently banned.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "identifier": {
        "type": "string",
        "description": "Player identifier (e.g. 'steam:110000112345678')"
      }
    },
    "required": ["identifier"]
  }
}
```

**Maps to:** `exports[EasyAdmin].IsIdentifierBanned(identifier)`

**Returns:** `{ banned: boolean, ban? }` (ban object if banned)

---

## Tool Safety Model

MCP tools are called by AI agents which can hallucinate or make mistakes. The safety model has three layers:

### 1. Bearer Token Gate

Each token is tied to a specific admin. Only admins who have generated a token through the NUI Settings page can use the MCP endpoint. Tokens can be revoked at any time from the Settings page.

### 2. Permission Inheritance

Tokens carry the admin's identity. All actions go through EasyAdmin's existing ACE permission system — if an admin can't kick players in-game, their MCP token can't kick either. This is enforced by the Lua exports which already check permissions.

Actions are attributed to the token's admin (their name appears in webhooks, logs, ban reasons) — not as a generic "MCP" actor. This provides a full audit trail with no new logging infrastructure needed.

### 3. No Confirmation Step

Unlike the Discord bot (which has interactive confirmations), MCP tools execute immediately. The rationale:
- The token holder is a trusted admin with verifiable identity
- AI agents can't interact with confirmation dialogs
- The audit trail (webhooks + admin attribution) provides post-hoc visibility
- Tokens can be revoked instantly from the Settings page if compromised

### What AI Apps Should Do

The MCP tool descriptions include guidance for AI agents:
- Destructive tools (kick, ban, slap) include warnings in their descriptions
- Tools require explicit `reason` parameters — the AI must provide context
- `target` accepts both ID and name, but ID is preferred for accuracy
- The AI should know which admin's token it is using (visible in the MCP config)

---

## Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/mcp/index.js` | `SetHttpHandler` + MCP JSON-RPC protocol handler |
| `src/mcp/tools.js` | Tool definitions and dispatch logic |

### Build Changes (`src/build.js`)

Add `mcp/` as an entry point:

```js
esbuild.build({
    entryPoints: ['bot/**/*.js', 'mcp/**/*.js'],  // add mcp
    // ... rest unchanged
})
```

Output: `dist/mcp/index.js` (already covered by `dist/*.js` in `server_scripts`).

### Convar Changes (`fxmanifest.lua`)

Add to `convar_category`:

```lua
{ "Enable MCP Server", "ea_mcpEnabled", "CV_BOOL", "false" },
```

### Lua Changes

**New file:** `server/mcp_tokens.lua` — Token storage, generation, and validation.

Handles:
- Reading/writing `data/mcp_tokens.json`
- `generateMcpToken(adminSource, label)` — generates a 64-char hex token, stores admin identity
- `revokeMcpToken(token)` — removes a token from the store
- `validateMcpToken(token)` — returns `{ valid, adminId, adminName, adminIdentifiers }` or `{ valid: false }`
- `loadMcpTokens()` — loads token map on resource start (called by JS via export)

**New NUI callbacks** in `client/nui/plugins.lua` (or a new `client/nui/mcp.lua`):

```lua
-- Generate a new MCP token
RegisterNUICallback('generateMcpToken', function(data, cb) 
    -- data = { label: string }
    if not DoesPlayerHavePermission(source, "server.mcp") then
        cb({ success: false, error: "No permission" })
        return
    end
    local token = exports[EasyAdmin].generateMcpToken(source, data.label)
    cb({ success: true, token: token })
end)

-- Revoke an MCP token
RegisterNUICallback('revokeMcpToken', function(data, cb)
    if not DoesPlayerHavePermission(source, "server.mcp") then
        cb({ success: false, error: "No permission" })
        return
    end
    exports[EasyAdmin].revokeMcpToken(data.token)
    cb({ success: true })
end)

-- Get current admin's tokens (for the settings page)
RegisterNUICallback('getMcpTokens', function(_, cb)
    cb(exports[EasyAdmin].getMcpTokens())
end)
```

**New exports** registered from `server/mcp_tokens.lua`:
- `generateMcpToken(adminSource, label)` → returns token string
- `revokeMcpToken(token)` → void
- `getMcpTokens()` → returns array of `{ token (masked), label, createdAt }`
- `validateMcpToken(token)` → returns `{ valid, adminId, adminName }` or `{ valid: false }`
- `loadMcpTokens()` → returns full token map (for JS handler)

**New permission:** `server.mcp` — Required to generate/revoke tokens. Implied by `server` (same pattern as other server-level permissions).

**No changes to existing admin exports needed** — all tools use existing exports.

### JS Implementation (`src/mcp/index.js`)

```js
const { TOOLS } = require('./tools')

let mcpEnabled = false
let tokenMap = {}   // token -> { adminId, adminName, adminIdentifiers }

// Check convars and load tokens on start
function checkConfig() {
    mcpEnabled = GetConvar('ea_mcpEnabled', 'false') === 'true'
    if (mcpEnabled) {
        // Load token map from Lua (reads data/mcp_tokens.json)
        setImmediate(function() {
            tokenMap = exports[EasyAdmin].loadMcpTokens() || {}
        })
    }
}

checkConfig()
on('convarUpdated', () => setImmediate(checkConfig))

// Reload tokens when the NUI revokes/generates one
on('mcpTokensUpdated', () => {
    setImmediate(function() {
        tokenMap = exports[EasyAdmin].loadMcpTokens() || {}
    })
})

if (mcpEnabled) {
    SetHttpHandler(function(request, response) {
        // Only handle /mcp path
        if (request.path !== '/mcp') {
            response.writeHead(404)
            response.send('Not found')
            return
        }

        // Only handle POST
        if (request.method !== 'POST') {
            response.writeHead(405)
            response.send('Method not allowed')
            return
        }

        // Auth check — Bearer token
        const authHeader = request.headers['authorization'] || ''
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : ''

        if (!token || !tokenMap[token]) {
            response.writeHead(401)
            response.send('Unauthorized')
            return
        }

        const adminInfo = tokenMap[token]

        // Read body
        request.setDataHandler(function(body) {
            setImmediate(function() {
                try {
                    const rpc = JSON.parse(body)
                    const result = handleRpc(rpc, adminInfo)
                    response.writeHead(200, { 'Content-Type': 'application/json' })
                    response.send(JSON.stringify(result))
                } catch (e) {
                    response.writeHead(400)
                    response.send(JSON.stringify({
                        jsonrpc: '2.0',
                        id: null,
                        error: { code: -32700, message: 'Parse error' }
                    }))
                }
            })
        })
    })

    console.log('[EasyAdmin] MCP server enabled on /easyadmin/mcp')
}

function handleRpc(rpc, adminInfo) {
    const { method, params, id } = rpc

    switch (method) {
        case 'initialize':
            return {
                jsonrpc: '2.0', id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'EasyAdmin MCP', version: '1.0.0' }
                }
            }

        case 'tools/list':
            return { jsonrpc: '2.0', id, result: { tools: TOOLS } }

        case 'tools/call':
            return { jsonrpc: '2.0', id, result: callTool(params.name, params.arguments, adminInfo) }

        default:
            return {
                jsonrpc: '2.0', id,
                error: { code: -32601, message: `Method not found: ${method}` }
            }
    }
}

async function callTool(name, args, adminInfo) {
    const tool = TOOLS.find(t => t.name === name)
    if (!tool) {
        return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
        }
    }

    try {
        const result = await tool.handler(args, adminInfo)
        return {
            content: [{ type: 'text', text: JSON.stringify(result) }]
        }
    } catch (e) {
        return {
            content: [{ type: 'text', text: e.message }],
            isError: true
        }
    }
}
```

### JS Implementation (`src/mcp/tools.js`)

```js
function findPlayer(args) {
    // Reuse the same pattern as the Discord bot:
    // search by ID (numeric) or name substring
    const target = args.target
    const players = exports[EasyAdmin].getCachedPlayers()

    for (const [id, player] of Object.entries(players)) {
        if (!player.dropped) {
            if (!isNaN(target) && id == target) return { id: parseInt(id), ...player }
            if (typeof target === 'string' && player.name.toLowerCase().includes(target.toLowerCase())) {
                return { id: parseInt(id), ...player }
            }
        }
    }
    throw new Error(`Player not found: ${target}`)
}

exports.TOOLS = [
    {
        name: 'get_players',
        description: 'Get all online players with IDs, names, pings, and identifiers.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        handler: () => {
            const players = exports[EasyAdmin].getCachedPlayers()
            const result = []
            for (const [id, p] of Object.entries(players)) {
                if (!p.dropped) result.push({ id: parseInt(id), name: p.name, ping: p.ping, identifiers: p.identifiers })
            }
            return result
        }
    },
    {
        name: 'kick_player',
        description: 'Kick a player. Requires a reason. This is a destructive action — the player will be disconnected immediately.',
        inputSchema: {
            type: 'object',
            properties: {
                target: { type: 'string', description: 'Player ID (preferred) or name' },
                reason: { type: 'string', description: 'Kick reason (shown to the player)' }
            },
            required: ['target', 'reason']
        },
        handler: async (args, adminInfo) => {
            const player = findPlayer(args)
            // adminInfo.adminName is used for attribution in webhooks/logs
            DropPlayer(player.id, `Kicked by ${adminInfo.adminName}: ${args.reason}`)
            return { success: true, target: player.name, moderator: adminInfo.adminName }
        }
    },
    // ... other tools follow the same pattern, receiving (args, adminInfo)
]
```

---

## AI App Configuration

Users add the MCP server to their AI app's MCP configuration, using the Bearer token generated from the EasyAdmin Settings page:

### Cursor

`.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "easyadmin": {
      "url": "http://<server-ip>:30120/easyadmin/mcp",
      "headers": {
        "Authorization": "Bearer ea_a1b2c3d4e5f6..."
      }
    }
  }
}
```

### Claude Desktop

`claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "easyadmin": {
      "url": "http://<server-ip>:30120/easyadmin/mcp",
      "headers": {
        "Authorization": "Bearer ea_a1b2c3d4e5f6..."
      }
    }
  }
}
```

### VS Code (with MCP extension)

Same format as Cursor.

---

## Limitations

| Limitation | Reason | Impact |
|------------|--------|--------|
| No streaming responses | FiveM's HTTP API is request/response only | MCP streaming not supported (fine for admin tools) |
| No SSE/sampling | FiveM HTTP doesn't support server-push | AI can't push content to the server (not needed) |
| Rate limited by FiveM | Built-in per-resource rate limiter | ~25 req/s sustained (more than enough for admin use) |
| Shares game port | `SetHttpHandler` uses FiveM's HTTP server | Port already exposed; no security concern |
| No TLS by default | FiveM's HTTP server is plain HTTP | Use a reverse proxy (nginx/caddy) for TLS in production |
| Thread affinity | Must use `setImmediate` for native calls | Slight latency overhead; handled in implementation |

---

## Future Extensions

| Feature | Description | Complexity |
|---------|-------------|------------|
| Per-tool permissions | Restrict which tools the API key can access | Low — filter in dispatch |
| Resource management | `start_resource`, `stop_resource`, `restart_resource` | Low — exports exist |
| Convar management | `get_convar`, `set_convar` | Low — `GetConvar`/`SetConvar` natives |
| Screenshot trigger | Trigger a player screenshot via MCP | Medium — needs async URL matching |
| Player teleport | Teleport player to coords or another player | Medium — needs coord parsing |
| Ban screen customization | Update ban screen text/colors via MCP | Low — convar-based |

---

## Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| HTTP transport | `SetHttpHandler` on FiveM's built-in server | No extra port, managed lifecycle, built-in rate limiting |
| Protocol | MCP over HTTP (JSON-RPC) | Standard MCP transport, works with all MCP clients |
| Auth | Per-admin Bearer tokens, generated via NUI Settings | Standard auth pattern, revocable, scoped to admin identity |
| Permissions | Inherited from admin's ACE permissions | MCP token is not "god mode" — respects existing permission system |
| Attribution | Actions logged under the token's admin name | Full audit trail through existing webhook infrastructure |
| Tools | Map directly to existing Lua exports | No new Lua admin code, consistent with Discord bot pattern |
| Token storage | `data/mcp_tokens.json` (server-side file) | Persistent across restarts, managed by Lua (same pattern as banlist) |
| Location | `src/mcp/` bundled with Discord bot | Single repo, shared build pipeline, co-located with other server-side JS |
