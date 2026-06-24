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

dependencies { 'EasyAdmin' }

shared_scripts { 'shared.lua' }
client_scripts { 'client.lua' }
server_scripts { 'server.lua' }
```

## Registration

From your resource's **server script**, call:

```lua
-- server.lua
exports.EasyAdmin:RegisterPlugin({
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

## Render Handlers

FiveM exports **cannot pass functions between resources**, so handlers are
registered via events. Each `renderAction` maps to an event:

```lua
-- Client handler for renderPage action
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  cb({
    { type = 'heading', text = 'My Plugin', level = 2 },
    { type = 'text', text = 'Hello from Lua!', variant = 'muted' },
  })
end)
```

The event name format is: `EasyAdmin:Plugin:action:<pluginId>:<actionName>`

The handler receives `data.context`:

| Field | Value |
|---|---|
| `target` | `'page'`, `'widget'`, or `'player-tab'` |
| `playerId` | Player server ID (only for player tabs) |

See the [schema component reference](../../nui-plugins#schema-components) for all available components.

## Button Actions

Buttons in the schema have an `action` field. When clicked, the NUI routes
to the matching event handler:

```lua
-- In your schema:
-- { type = 'button', label = 'Refresh', action = 'refresh', icon = 'refresh' }

-- Handler:
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:refresh', function(data, cb)
  -- Return a schema array → replaces the page:
  cb({
    { type = 'heading', text = 'My Plugin', level = 2 },
    { type = 'badge', text = 'Refreshed!', variant = 'online' },
  })
end)
```

**Two return patterns:**

| `cb(...)` returns | NUI behaviour |
|---|---|
| Schema array (`{ { type = ... } }`) | Replaces the current page with the new schema |
| Non-schema (`{ ok = true }`) | Re-fetches the original `renderAction` |

### Server-side Actions

Add `server = true` to a button to route it to a server handler:

```lua
-- In schema:
-- { type = 'button', label = 'Get Count', action = 'getCount', server = true }

-- Server handler:
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:getCount', function(source, data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(source, 'plugin.my-plugin.view') then
    return cb({ ok = false, error = 'permission denied' })
  end
  cb({ ok = true, count = #GetPlayers() })
end)
```

The event name format is: `EasyAdmin:Plugin:serverAction:<pluginId>:<actionName>`

> **Always permission-guard server handlers.** The bridge does not check
> permissions automatically.

## Permissions

Register a permission in your resource's shared script:

```lua
Citizen.CreateThread(function()
  -- Wait for EasyAdmin's permissions table to be available
  while permissions == nil do
    Citizen.Wait(50)
  end
  permissions['plugin.my-plugin'] = false
end)
```

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should see the plugin.

Gate the entire plugin:

```lua
exports.EasyAdmin:RegisterPlugin({
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

## Live Updates

Push a schema refresh from Lua at any time:

```lua
SendNUIMessage({ action = 'plugin:my-plugin:update' })
```

The NUI re-fetches the current view's schema.

## Full Example

### `shared.lua`

```lua
-- Register custom permissions
Citizen.CreateThread(function()
  while permissions == nil do
    Citizen.Wait(50)
  end
  permissions['plugin.my-plugin'] = false
  permissions['plugin.my-plugin.advanced'] = false
end)
```

### `server.lua`

Register the plugin (server-side only — the server is the source of truth
and broadcasts to all clients):

```lua
exports.EasyAdmin:RegisterPlugin({
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

-- Server-side handler (reached by button with server = true)
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:getServerData', function(source, data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(source, 'plugin.my-plugin.advanced') then
    return cb({ ok = false, error = 'Requires permission: plugin.my-plugin.advanced' })
  end

  cb({
    ok = true,
    playerCount = #GetPlayers(),
    maxPlayers = GetConvarInt('sv_maxclients', 32),
  })
end)
```

### `client.lua`

Client scripts only register event handlers for render actions and button
clicks. The plugin config is already known to the client via the server
broadcast:

```lua
-- Page render handler
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  local players = GetActivePlayers()
  local fps = 0
  local ft = GetFrameTime()
  if ft and ft > 0 then fps = math.floor(1.0 / ft) end

  cb({
    { type = 'heading', text = 'My Plugin', level = 2 },
    {
      type = 'row', gap = 3, children = {
        { type = 'stat-card', label = 'Players', value = tostring(#players),
          icon = 'users', iconColor = 'var(--accent-green)', bgColor = 'var(--bg-green)' },
        { type = 'stat-card', label = 'FPS', value = tostring(fps),
          icon = 'gauge', iconColor = 'var(--accent-orange)', bgColor = 'var(--bg-orange)' },
      },
    },
    {
      type = 'card', children = {
        { type = 'heading', text = 'Actions', level = 4 },
        {
          type = 'row', gap = 2, children = {
            { type = 'button', label = 'Re-fetch', action = 'refetchPage',
              icon = 'refresh', variant = 'primary', size = 'sm' },
            { type = 'button', label = 'Get Server Data', action = 'getServerData',
              server = true, icon = 'server', variant = 'danger', size = 'sm' },
          },
        },
      },
    },
  })
end)

-- Dashboard widget
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderWidget', function(data, cb)
  local players = GetActivePlayers()
  cb({
    { type = 'card', children = {
        { type = 'row', gap = 2, children = {
            { type = 'icon', name = 'users', size = 'md' },
            { type = 'col', gap = 0, children = {
                { type = 'text', text = 'Players Online', variant = 'small' },
                { type = 'text', text = tostring(#players), variant = 'muted' },
              }},
          }},
      }},
  })
end)

-- Re-fetch action (returns non-schema → re-fetches renderPage)
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:refetchPage', function(data, cb)
  cb({ ok = true })
end)
```


