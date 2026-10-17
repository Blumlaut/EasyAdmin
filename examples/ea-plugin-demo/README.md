# ea-plugin-demo — EasyAdmin Plugin Example

A fully standalone FiveM resource that demonstrates **every feature** of the
EasyAdmin runtime plugin system.

## Features demonstrated

| Feature | Where |
|---|---|
| Plugin registration | `server.lua` — `exports.EasyAdmin:RegisterPlugin()` |
| Nav items (multi-page) | `server.lua` — a nav item plus a matching page; `client.lua` — the render actions |
| Pages with render actions | `server.lua` — `renderMainPage`, `renderStatsPage`, `renderActionsPage`; `client.lua` — their handlers |
| Player detail tabs | `server.lua` — public + permission-gated tab; `client.lua` — `renderPlayerTab` |
| Dashboard widgets | `server.lua` — `renderWidget` registration; `client.lua` — the handler |
| Client handlers (event-based) | `client.lua` — `AddEventHandler('EasyAdmin:Plugin:action:...')` |
| Server handlers (event-based) | `server.lua` — `AddEventHandler('EasyAdmin:Plugin:serverAction:...')` |
| Permission guarding | `server.lua` — `exports.EasyAdmin:DoesPlayerHavePermission` checks |
| Permissions | `server.lua` — declared in the registration: `plugin.demo`, `plugin.demo.advanced` |
| Re-fetching a view | `client.lua` — action handlers return a non-schema result to re-run the view's render action |
| The schema palette | `client.lua` `renderMainPage` — rows, cards, stat cards, buttons, modals |
| Form modals | `client.lua` — the `Open Form Modal` button, six field types |
| Notifications | `client.lua` — the `submitModal` handler returns a `notification` node |

## Why event-based handlers?

FiveM exports **cannot pass functions between resources**. When you call
`exports['resource'].someExport(fn)`, the function `fn` becomes `nil` on
the receiving end. This is a fundamental FiveM limitation.

The plugin system works around this by using **events** for handler registration:

1. **Plugin registration** (`RegisterPlugin`) passes only a config **table** — this works fine through exports
2. **Handler registration** uses `AddEventHandler` — the handler function stays in the plugin's own script environment
3. **Dispatch** — EasyAdmin triggers an event, the plugin's handler fires, and responds via a callback

## Schema components exercised

The main page (`renderMainPage`) demonstrates **every** available component:

- **Layout**: `card`, `row`, `col`, `divider`
- **Text**: `heading`, `text`
- **Interactive**: `button`, `copy-button`
- **Data display**: `stat-card`, `key-value-table`, `alert`, `badge`, `icon`, `tooltip`, `timeline-entry`
- **Charts**: `bar-chart` (stats page)
- **Loading**: `skeleton`

## Installation

1. Copy the `ea-plugin-demo` folder into your FiveM server's `resources/` directory
2. Add `ensure ea-plugin-demo` to your `server.cfg` **after** `ensure EasyAdmin`
3. Grant the permission to your admin group:

```cfg
add_ace group.admin easyadmin.plugin.demo allow
add_ace group.admin easyadmin.plugin.demo.advanced allow
```

4. Restart the server

## Testing

Open EasyAdmin and verify:

1. **Sidebar** — "Demo" and "Stats" and "Actions" nav items appear
2. **Demo page** — All components render correctly:
   - Stat cards (players, FPS, uptime)
   - Alert banner
   - Key-value table with a clickable "Copy" row
   - Buttons (Refresh, Toggle Badge, Push Update, Get Server Data)
   - Badges (default, online, offline, admin, warning)
   - Icons (users, shield, server, gauge, box)
   - Tooltip (hover over "Hover Me" stat card)
   - Timeline entry
   - Skeleton loading placeholders
   - Copy button
3. **Stats page** — Bar charts render
4. **Actions page** — Nested layout with separated client/server actions
5. **Player detail** — Open any player, see "Demo" and "Advanced" tabs
6. **Dashboard** — "Plugin Demo — Online" widget appears
7. **Buttons**:
   - "Re-fetch Page" — re-fetches the main page schema
   - "Toggle Counter" — increments a counter, re-fetches page
   - "Get Server Data" — calls the server handler (requires `plugin.demo.advanced` perm)
   - "Replace Page" — returns a full schema array, replaces the page
   - "Open Form Modal" — opens a modal with 6 field types (text, slider, select, number, checkbox, textarea). Submitting sends a native notification and shows the form values on the page

## Adapting for your plugin

1. **Rename** the folder and all occurrences of `ea-plugin-demo` to your plugin ID
2. **Edit `fxmanifest.lua`** — change `dependencies`, `author`, `description`
3. **Edit `shared.lua`** — change permission names
4. **Edit `client.lua`** — change `RegisterPlugin()` config and event handler names
5. **Edit `server.lua`** — change server event handler names and logic

## Key patterns

### Registering a plugin

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  icon = 'box',
  permission = 'plugin.my-plugin',            -- hides everything without it
  permissions = { 'plugin.my-plugin', 'plugin.my-plugin.admin' },
  navItems = { ... },
  pages = { ... },
  playerDetailTabs = { ... },
  dashboardWidgets = { ... },
})
```

### Registering a permission

Declare it in the registration's `permissions` array — that is the only place
EasyAdmin looks. Every permission used as a gate (including `permission` above)
must be listed there, or the gated UI disappears for everyone.

```lua
permissions = { 'plugin.my-plugin', 'plugin.my-plugin.admin' }
```

Then grant it to a group. The ACE name always carries the `easyadmin.` prefix:

```cfg
add_ace group.admin easyadmin.plugin.my-plugin allow
add_ace group.admin easyadmin.plugin.my-plugin.admin allow
```

Never wait on or write to a `permissions` global: FiveM resources do not share
Lua globals, so the loop below never sees EasyAdmin's table and spins forever.

```lua
-- WRONG, does nothing
while permissions == nil do Citizen.Wait(50) end
permissions['plugin.my-plugin'] = false
```

### Client render handler (event-based)

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  cb({
    { type = 'heading', text = 'Hello', level = 2 },
    { type = 'text', text = 'World', variant = 'muted' },
  })
end)
```

The event name format is: `EasyAdmin:Plugin:action:<pluginId>:<actionName>`

- `data` — the payload from the NUI (may contain `context` with player info, etc.)
- `cb` — callback function. Call `cb(result)` to return a schema or response

### Client action handler (returns new schema)

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:refresh', function(data, cb)
  cb({ { type = 'badge', text = 'Refreshed!', variant = 'online' } })
end)
```

### Client action handler (side effect only)

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:notify', function(data, cb)
  TriggerEvent('EasyAdmin:showNotification', 'Done')
  cb({ ok = true }) -- no schema, so the page re-fetches its render action
end)
```

### Server handler (permission-guarded, event-based)

```lua
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:doAction', function(source, data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return cb({ ok = false, error = 'permission denied' })
  end
  cb({ ok = true, result = 'done' })
end)
```

The event name format is: `EasyAdmin:Plugin:serverAction:<pluginId>:<actionName>`

- `source` — the player server ID, the handler's first argument. Read it; the
global `source` is not set for this event
- `data` — the payload from the NUI
- `cb` — callback function. Call `cb(result)` to send the response back to the client

### Button with server action

```lua
{ type = 'button', label = 'Server Action', action = 'doAction', server = true }
```

### Refreshing the page

Returning a non-schema result re-fetches the page's render action, so there is no
need to ask for a refresh:

```lua
cb({ ok = true })
```

A plugin cannot push to EasyAdmin's NUI: `SendNUIMessage` is delivered to the NUI
page of the resource that calls it, and a plugin resource has none. Keep the data
a render action needs in a client-side cache and let the next render pick it up
(see `renderMainPage` in `client.lua`, which renders from `state.serverData`).

### Button that opens a form modal

```lua
{ type = 'button', label = 'Open Form', action = 'submitForm', icon = 'clipboard', variant = 'secondary',
  modal = {
    title = 'My Form',
    description = 'Fill in the fields below.',
    submitLabel = 'Submit',
    fields = {
      { type = 'text', key = 'name', label = 'Name', required = true },
      { type = 'slider', key = 'volume', label = 'Volume', min = 0, max = 100, initialValue = 50 },
      { type = 'select', key = 'role', label = 'Role', options = {
          { value = 'admin', label = 'Admin' },
          { value = 'user', label = 'User' },
        }},
      { type = 'checkbox', key = 'enabled', label = 'Enabled', initialValue = true },
    },
  },
}
```

The handler receives the form values as `data`:

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:submitForm', function(data, cb)
  -- data = { name = '...', volume = 50, role = 'admin', enabled = true }
  cb({
    { type = 'notification', text = ('Form submitted by %s'):format(data.name) },
    { type = 'alert', variant = 'success', title = 'Done!', children = {
        { type = 'text', text = ('Name: %s, Volume: %s'):format(data.name, data.volume) },
      }},
  })
end)
```

### Available modal field types

| Type | Keys | Description |
|---|---|---|
| `text` | `key`, `label`, `placeholder`, `initialValue`, `maxLength`, `required` | Single-line text input |
| `textarea` | `key`, `label`, `placeholder`, `initialValue`, `maxLength`, `rows`, `required` | Multi-line text area |
| `number` | `key`, `label`, `placeholder`, `initialValue`, `min`, `max`, `step`, `required` | Numeric input |
| `slider` | `key`, `label`, `min`, `max`, `initialValue`, `step`, `required` | Range slider |
| `select` | `key`, `label`, `placeholder`, `initialValue`, `options`, `required` | Dropdown select |
| `checkbox` | `key`, `label`, `initialValue`, `required` | Toggle checkbox |
