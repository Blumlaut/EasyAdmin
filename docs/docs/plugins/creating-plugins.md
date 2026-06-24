# Creating a Plugin

Plugins are standalone FiveM resources that extend EasyAdmin's UI. They
register at runtime and provide declarative schema trees that EasyAdmin
renders using its built-in components.

## Prerequisites

- Your resource must start **after** EasyAdmin. Add it as a dependency:

```lua
-- fxmanifest.lua (in YOUR resource)
fx_version 'cerulean'
game 'gta5'

dependencies { 'easyadmin' }

shared_scripts { 'shared.lua' }
client_scripts { 'client.lua' }
server_scripts { 'server.lua' }
```

## Registration

From your resource's client or server script, call:

```lua
exports['easyadmin']:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  icon = 'box',

  navItems = {
    { id = 'plugin:my-plugin', label = 'My Plugin', icon = 'box' },
  },
  pages = {
    { view = 'plugin:my-plugin', renderAction = 'renderPage' },
  },
})
```

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique plugin id |
| `name` | Yes | Display name |
| `version` | Yes | Version string |
| `icon` | No | Default icon for nav items |
| `permission` | No | Hides everything if admin lacks this permission |
| `navItems` | No | Sidebar entries |
| `pages` | No | Full-page views |
| `playerDetailTabs` | No | Tabs in the player detail page |
| `dashboardWidgets` | No | Cards on the dashboard |

### Nav items

```lua
navItems = {
  { id = 'plugin:my-plugin', label = 'My Plugin', icon = 'box' },
  -- Multi-page:
  { id = 'plugin:my-plugin:settings', label = 'Settings', icon = 'settings' },
},
```

Each `id` must match a page's `view`.

### Pages

```lua
pages = {
  { view = 'plugin:my-plugin', renderAction = 'renderPage' },
  { view = 'plugin:my-plugin:settings', renderAction = 'renderSettings' },
},
```

`renderAction` is the action name the NUI calls to fetch the schema tree.

### Player detail tabs

```lua
playerDetailTabs = {
  { id = 'notes', label = 'Notes', icon = 'book-open', renderAction = 'renderTab' },
  { id = 'admin', label = 'Admin', permission = 'plugin.my-plugin.admin', renderAction = 'renderAdminTab' },
},
```

### Dashboard widgets

```lua
dashboardWidgets = {
  { id = 'status', renderAction = 'renderWidget', order = 150 },
},
```

`order` controls sort position (lower = first, default 100).

## Render handlers

Each `renderAction` needs a Lua handler that returns a schema tree:

```lua
-- Client handler
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderPage', function(data)
  return {
    { type = 'heading', text = 'My Plugin', level = 2 },
    { type = 'text', text = 'Hello from Lua!', variant = 'muted' },
  }
end)
```

The handler receives `data.context`:

| Field | Value |
|---|---|
| `target` | `'page'`, `'widget'`, or `'player-tab'` |
| `playerId` | Player server ID (only for player tabs) |

Return either:
- An array of schema nodes (the schema tree)
- `{ schema = [...] }` (alternative format)

See the [schema component reference](../nui-plugins#schema-components) for all available components.

## Button actions

Buttons in the schema have an `action` field. When clicked, the NUI calls
that action's handler:

```lua
-- In your schema:
-- { type = 'button', label = 'Refresh', action = 'refresh', icon = 'refresh' }

exports['easyadmin']:RegisterPluginHandler('my-plugin', 'refresh', function(data)
  -- Return a new schema to re-render the view:
  return {
    { type = 'heading', text = 'My Plugin', level = 2 },
    { type = 'badge', text = 'Refreshed!', variant = 'online' },
  }
end)
```

If the handler returns no schema (e.g. `{ ok = true }`), the NUI re-fetches
the original `renderAction`.

### Server-side actions

Add `server = true` to a button to route it to a server handler:

```lua
-- In schema:
-- { type = 'button', label = 'Get Count', action = 'getCount', server = true }

-- Server handler:
exports['easyadmin']:RegisterPluginServerHandler('my-plugin', 'getCount', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.view') then
    return { ok = false, error = 'permission denied' }
  end
  return { ok = true, count = #GetPlayers() }
end)
```

> **Always permission-guard server handlers.** The bridge does not check
> permissions automatically.

## Permissions

Register a permission in your resource's shared script:

```lua
Citizen.CreateThread(function()
  permissions["plugin.my-plugin"] = false
end)
```

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should see the plugin.

Gate the entire plugin:

```lua
exports['easyadmin']:RegisterPlugin({
  id = 'my-plugin',
  permission = 'plugin.my-plugin',
  -- ...
})
```

Gate a single player tab:

```lua
playerDetailTabs = {
  { id = 'admin', label = 'Admin', permission = 'plugin.my-plugin.admin', renderAction = 'renderAdmin' },
},
```

## Live updates

Push a schema refresh from Lua at any time:

```lua
SendNUIMessage({ action = 'plugin:my-plugin:update' })
```

The NUI re-fetches the current view's schema.

## Full example

### `shared.lua`

```lua
-- Register a custom permission
Citizen.CreateThread(function()
  permissions["plugin.my-plugin"] = false
end)
```

### `client.lua`

```lua
-- Register the plugin
exports['easyadmin']:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  icon = 'box',

  navItems = {
    { id = 'plugin:my-plugin', label = 'My Plugin', icon = 'box' },
  },
  pages = {
    { view = 'plugin:my-plugin', renderAction = 'renderPage' },
  },
  dashboardWidgets = {
    { id = 'status', renderAction = 'renderWidget', order = 150 },
  },
})

-- Page render handler
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderPage', function(data)
  local players = GetActivePlayers and #GetActivePlayers() or 0
  return {
    { type = 'heading', text = 'My Plugin', level = 2 },
    {
      type = 'row', gap = 3, children = {
        { type = 'stat-card', label = 'Players', value = tostring(players),
          icon = 'users', iconColor = 'var(--accent-green)', bgColor = 'var(--bg-green)' },
        { type = 'stat-card', label = 'FPS', value = tostring(math.floor(1.0 / GetFrameTime())),
          icon = 'gauge', iconColor = 'var(--accent-orange)', bgColor = 'var(--bg-orange)' },
      },
    },
    {
      type = 'card', children = {
        { type = 'heading', text = 'Actions', level = 4 },
        {
          type = 'row', gap = 2, children = {
            { type = 'button', label = 'Refresh', action = 'refresh',
              icon = 'refresh', variant = 'ghost', size = 'sm' },
            { type = 'button', label = 'Get Count', action = 'getCount',
              server = true, variant = 'secondary', size = 'sm' },
          },
        },
      },
    },
  }
end)

-- Dashboard widget
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderWidget', function(data)
  return {
    {
      type = 'card', children = {
        {
          type = 'row', gap = 2, children = {
            { type = 'icon', name = 'check-circle', size = 'md' },
            { type = 'col', gap = 0, children = {
              { type = 'text', text = 'My Plugin', variant = 'small' },
              { type = 'text', text = 'Online', variant = 'muted' },
            }},
          },
        },
      },
    },
  }
end)

-- Button action — returns new schema
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'refresh', function(data)
  return {
    { type = 'heading', text = 'My Plugin', level = 2 },
    { type = 'badge', text = 'Refreshed!', variant = 'online' },
  }
end)
```

### `server.lua`

```lua
-- Server-side handler (reached by button with server = true)
exports['easyadmin']:RegisterPluginServerHandler('my-plugin', 'getCount', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.view') then
    return { ok = false, error = 'permission denied' }
  end
  return { ok = true, count = #GetPlayers() }
end)
```
