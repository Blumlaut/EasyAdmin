# Plugin API

The plugin API lets external FiveM resources extend EasyAdmin's UI at runtime.
Plugins register via exports and provide schema trees that EasyAdmin renders
using its built-in components.

## Why Events, Not Exports?

FiveM exports **cannot pass functions between resources**. When you call
`exports['resource'].someExport(fn)`, the function `fn` becomes `nil` on
the receiving end.

The plugin system works around this by using **events** for handler
registration:

1. **Plugin registration** (`RegisterPlugin`) passes only a config **table** — this works fine through exports
2. **Handler registration** uses `AddEventHandler` — the handler function stays in the plugin's own script environment
3. **Dispatch** — EasyAdmin triggers an event, the plugin's handler fires, and responds via a callback

## Registration

### `exports.EasyAdmin:RegisterPlugin(config)`

Register a plugin from your resource's **server script** only. The server is
the source of truth — it stores the plugin and broadcasts it to all clients.

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  icon = 'box',
  permissions = { 'plugin.my-plugin', 'plugin.my-plugin.admin' },
  navItems = { ... },
  pages = { ... },
  playerDetailTabs = { ... },
  dashboardWidgets = { ... },
})
```

Declare every permission you gate UI on in `permissions`. A gate that uses an
undeclared permission hides that nav item, tab or page from every admin. The
ACE name of a permission is always `easyadmin.<permission>`.

See [Creating a Plugin](../creating-plugins) for the full config shape.

## Client Handlers

### `EasyAdmin:Plugin:action:<pluginId>:<actionName>`

Register a **client-side** handler for render actions and button clicks:

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  -- data.context = { target = 'page'|'widget'|'player-tab', playerId? = number }
  cb({
    { type = 'heading', text = 'Hello', level = 2 },
    { type = 'text', text = 'World', variant = 'muted' },
  })
end)
```

| Parameter | Type | Description |
|---|---|---|
| `data` | `table` | Payload from the NUI (may contain `context`) |
| `cb` | `function(result)` | Callback — call with a schema array or response table |

**Return behaviour:**
- Call `cb({ schema array })` → replaces the current page with the new schema
- Call `cb({ ok = true, ... })` → triggers a re-fetch of the original `renderAction`

## Server Handlers

### `EasyAdmin:Plugin:serverAction:<pluginId>:<actionName>`

Register a **server-side** handler. Reached by buttons with `server = true`:

```lua
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:doAction', function(source, data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return cb({ ok = false, error = 'permission denied' })
  end
  cb({ ok = true, result = 'done' })
end)
```

| Parameter | Type | Description |
|---|---|---|
| `source` | `number` | Player server ID — passed as the handler's first argument |
| `data` | `table` | Payload from the NUI |
| `cb` | `function(result)` | Callback — call with a response table |

Read the `source` argument. Do not rely on the global `source` variable, which
is not set for this event.

> **Server handlers must always be permission-guarded.** The bridge does
> not perform automatic permission checks.

### Handler Constraints

Handlers must call `cb` within about 500 ms. Dispatch falls back after 500 ms
and the NUI waits 600 ms for server actions, so a slower handler is reported as
`no handler registered` / `no server handler`. `cb` is single-shot: further calls
from the same request are ignored.

Long-running work must be finished before the request (for example cached).
There is no supported way for a plugin to push a refresh to the NUI: the view
re-fetches when it is opened, and whenever an action returns a non-schema result.

## Other EasyAdmin Exports

These exports exist independently of the plugin system. The tables below are a
curated subset for plugin authors, not the full export list.

### Permissions and Admin State

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:DoesPlayerHavePermission` | `player, permission` | Server: pass a player server ID. Client: pass `-1` for the local player |
| `EasyAdmin:DoesPlayerHavePermissionForCategory` | `player, prefix` | True if any permission starting with `prefix` is held |
| `EasyAdmin:IsPlayerAdmin` | `playerId` | True if the player is a known online admin |
| `EasyAdmin:GetOnlineAdmins` | (none) | Table of online admins keyed by server ID |
| `EasyAdmin:CanTargetPlayerForModeration` | `src, target, immuneMessage?` | `false` when the target is immune to `src` |
| `EasyAdmin:announce` | `message, sender?` | Send a global announcement. Returns `false` for an empty message |
| `EasyAdmin:getName` | `playerId, anonymousDisabled?, identifierEnabled?` | Player name, resolved from cache when possible |
| `EasyAdmin:isPlayerOnline` | `playerId` | Cache-backed online check |

### Player Actions

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:mutePlayer` | `playerId, toggle, source` | Mute or unmute a player |
| `EasyAdmin:warnPlayer` | `source, playerId, reason` | Warn a player (moderator first) |
| `EasyAdmin:getPlayerWarnings` | `playerId` | Number of warnings on record |

### Ban Management

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:addBan` | `playerId, reason, expires, banner` | Add a new ban. `playerId` may be a server ID or a table of identifiers |
| `EasyAdmin:unbanPlayer` | `banId` | Remove a ban by ID |
| `EasyAdmin:fetchBan` | `banId` | Fetch a ban entry |
| `EasyAdmin:GetFreshBanId` | (none) | Get the next available ban ID |
| `EasyAdmin:IsIdentifierBanned` | `identifier` | Check if an identifier is banned |

`addBan` fires the `EasyAdmin:addBan` event (see below). Called from your own
resource there is no invoking player, so `banner` is what is recorded as the
moderator.

### History, Notes, Reports and Screenshots

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:getActionHistory` | `identifiers` | Get action history for identifiers |
| `EasyAdmin:getAdminNotes` | `identifiers` | Get admin notes for identifiers |
| `EasyAdmin:getAllReports` | (none) | Get all active reports |
| `EasyAdmin:isScreenshotInProgress` | (none) | Check if a screenshot is in progress |

### Webhooks

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:sendWebhook` | `message, options?` | Send a Discord webhook message (see below) |
| `EasyAdmin:SendWebhookMessage` | `webhook, message, feature?, colour?, title?, image?` | Direct access to internal webhook function |
| `EasyAdmin:isWebhookFeatureExcluded` | `feature` | Check if a feature is excluded from webhooks |

#### `sendWebhook(message, options)`

The recommended entry-point for logging moderation actions from plugins.
Resolves a named webhook convar to its URL and posts a formatted Discord
embed. When `ea_botLogChannel` is configured, messages are routed through
the Discord bot automatically.

```lua
-- Simple usage (uses ea_moderationNotification by default):
exports.EasyAdmin:sendWebhook(
  string.format("**%s** gave **%s** $%s.", adminName, targetName, amount),
  { feature = "esx" }
)

-- Full control:
exports.EasyAdmin:sendWebhook("Action logged", {
  webhook = "detail",   -- "moderation" (default), "detail", "report", or a direct URL
  feature = "qb",       -- feature tag for exclusion filtering
  colour = 65280,        -- embed colour as decimal (default: 16777214 / red)
  title = "QB-Core",     -- embed title (default: "EasyAdmin")
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `webhook` | `string` | `"moderation"` | Named convar (`"moderation"`, `"detail"`, `"report"`) or a direct webhook URL |
| `feature` | `string` | `nil` | Feature tag for `ea_excludeWebhookFeature` filtering |
| `colour` | `number` | `16777214` | Embed colour as decimal |
| `title` | `string` | `"EasyAdmin"` | Embed title |
| `image` | `string` | `nil` | Image URL for the embed |

## Events

### Listen for these events

| Event | Arguments | Description |
|-------|-----------|-------------|
| `EasyAdmin:Plugin:registered` | `config` | A plugin was registered — use it to initialise client-side state |
| `EasyAdmin:Plugin:unregistered` | `pluginId` | A plugin was removed, usually because its resource stopped |
| `EasyAdmin:AnnouncementSent` | `message`, `sender?` | An announcement was sent. `sender` is `{ name: string, id: number }` when available, or `nil` for external callers (e.g. Discord bot, direct export call) |
| `EasyAdmin:reportAdded` | `report` | A report was filed |
| `EasyAdmin:reportClaimed` | `report` | A report was claimed |
| `EasyAdmin:reportRemoved` | `report` | A report was closed |
| `EasyAdmin:addBan` | `playerId`, `reason`, `expires`, `banner?` | A ban was added |

`EasyAdmin:addBan` passes positional arguments, not a table. `banner` is absent
for bans raised automatically from player reports.

### `EasyAdmin:AnnouncementSent` — Forward to other systems

Use this event to relay EasyAdmin announcements to other resources (phone apps, logging systems, audit trails, etc.):

```lua
-- In your resource's server script:
AddEventHandler('EasyAdmin:AnnouncementSent', function(message, sender) 
  local senderName = sender and sender.name or 'Unknown'
  -- Forward to your own system
  TriggerEvent('my-phone-app:pushAnnouncement', message, senderName)
end)
```

### `EasyAdmin:LogAction` — Log an action

This is a server-side event you **trigger**, not one you listen to. It is not a
net event, so fire it from server code with `TriggerEvent`:

```lua
TriggerEvent('EasyAdmin:LogAction', {
  action = 'CUSTOM',
  identifiers = { 'license:1100001123456789' },
  reason = 'Example entry',
  moderator = 'Console',
  moderatorIdents = {},
  banid = '1234',
}, playerId)
```

| Key | Required | Description |
|-----|----------|-------------|
| `action` | Yes | Action type string, stored as-is |
| `identifiers` | No | Identifiers to attach the entry to. When omitted, the identifiers of `playerId` are used |
| `reason` | No | Reason or description |
| `moderator` | No | Moderator name. Defaults to `Console` |
| `moderatorIdents` | No | Moderator identifiers. Defaults to an empty table |
| `banid` | No | Associated ban ID |

The second argument (`playerId`) is only needed when `identifiers` is omitted.

## Example

```lua
-- Listen for new bans
AddEventHandler('EasyAdmin:addBan', function(playerId, reason, expires, banner)
  print('New ban: ' .. tostring(reason))
end)

-- Add a ban programmatically
exports.EasyAdmin:addBan(playerId, 'Cheating detected', os.time() + 3600, 'AdminName')
```
