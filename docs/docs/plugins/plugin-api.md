# Plugin API

The plugin API lets external FiveM resources extend EasyAdmin's UI at runtime.
Plugins register via exports and provide schema trees that EasyAdmin renders
using its built-in components.

## Registration

### `exports['easyadmin']:RegisterPlugin(config)`

Register a plugin from your resource. Can be called on the client or server.
Server registrations are networked to all clients automatically.

```lua
exports['easyadmin']:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  navItems = { ... },
  pages = { ... },
  playerDetailTabs = { ... },
  dashboardWidgets = { ... },
})
```

See [Creating a Plugin](../creating-plugins) for the full config shape.

## Handlers

### `exports['easyadmin']:RegisterPluginHandler(pluginId, action, fn)`

Register a **client-side** handler. Called when the NUI requests a schema
render or dispatches a button action.

```lua
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderPage', function(data)
  -- data.context = { target = 'page'|'widget'|'player-tab', playerId? = number }
  return { { type = 'heading', text = 'Hello' } }
end)
```

| Parameter | Type | Description |
|---|---|---|
| `pluginId` | `string` | Must match the registered plugin id |
| `action` | `string` | Action name (matches `renderAction` or button `action`) |
| `fn` | `function(data)` | Receives data payload; returns a schema tree or `{ ok = true }` |

### `exports['easyadmin']:RegisterPluginServerHandler(pluginId, action, fn)`

Register a **server-side** handler. Reached by buttons with `server = true`.

```lua
exports['easyadmin']:RegisterPluginServerHandler('my-plugin', 'doAction', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return { ok = false, error = 'permission denied' }
  end
  return { ok = true, result = 'done' }
end)
```

| Parameter | Type | Description |
|---|---|---|
| `pluginId` | `string` | Must match the registered plugin id |
| `action` | `string` | Action name |
| `fn` | `function(source, data)` | `source` = player server ID; return value relayed to NUI |

> **Server handlers must always be permission-guarded.** The bridge does
> not perform automatic permission checks.

### `HasEasyAdminPluginHandler(pluginId, action)`

Check if a client handler is registered. Returns `boolean`.

## NUI messages

### `plugin:<id>:update`

Push a schema refresh to the NUI:

```lua
SendNUIMessage({ action = 'plugin:my-plugin:update' })
```

The NUI re-fetches the current view's `renderAction`.

## Other EasyAdmin exports

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
