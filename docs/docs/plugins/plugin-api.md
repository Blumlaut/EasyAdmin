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

Register a plugin from your resource. Can be called on the client or server.
Server registrations are networked to all clients automatically.

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  icon = 'box',
  navItems = { ... },
  pages = { ... },
  playerDetailTabs = { ... },
  dashboardWidgets = { ... },
})
```

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
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return cb({ ok = false, error = 'permission denied' })
  end
  cb({ ok = true, result = 'done' })
end)
```

| Parameter | Type | Description |
|---|---|---|
| `source` | `number` | Player server ID (set globally by FiveM) |
| `data` | `table` | Payload from the NUI |
| `cb` | `function(result)` | Callback — call with response table |

> **Server handlers must always be permission-guarded.** The bridge does
> not perform automatic permission checks.

## NUI Messages

### `plugin:<id>:update`

Push a schema refresh to the NUI:

```lua
SendNUIMessage({ action = 'plugin:my-plugin:update' })
```

The NUI re-fetches the current view's `renderAction`.

## Other EasyAdmin Exports

These exports exist independently of the plugin system and can be used by
any external resource:

### Ban Management

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:addBan` | `playerId, reason, expires, banner` | Add a new ban |
| `EasyAdmin:unbanPlayer` | `banId` | Remove a ban by ID |
| `EasyAdmin:fetchBan` | `banId` | Fetch a ban entry |
| `EasyAdmin:GetFreshBanId` | (none) | Get the next available ban ID |
| `EasyAdmin:IsIdentifierBanned` | `identifier` | Check if an identifier is banned |

### Action History

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:getActionHistory` | `identifiers` | Get action history for identifiers |

### Screenshots

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:isScreenshotInProgress` | (none) | Check if a screenshot is in progress |

### Reports

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:getAllReports` | (none) | Get all active reports |

## Events

Listen for these events in your resource:

| Event | Description |
|-------|-------------|
| `EasyAdmin:reportAdded` | Triggered when a report is filed |
| `EasyAdmin:reportClaimed` | Triggered when a report is claimed |
| `EasyAdmin:reportRemoved` | Triggered when a report is closed |
| `EasyAdmin:addBan` | Triggered when a ban is added |
| `EasyAdmin:LogAction` | Triggered when an action is logged |

## Example

```lua
-- Listen for new bans
AddEventHandler('EasyAdmin:addBan', function(banData)
  print('New ban: ' .. banData.reason)
end)

-- Add a ban programmatically
exports.EasyAdmin:addBan(playerId, 'Cheating detected', os.time() + 3600, 'AdminName')
```
