# ea-plugin-demo — EasyAdmin Plugin Example

A fully standalone FiveM resource that demonstrates **every feature** of the
EasyAdmin runtime plugin system.

## Features demonstrated

| Feature | Where |
|---|---|
| Plugin registration | `client.lua` — `exports['easyadmin']:RegisterPlugin()` |
| Nav items (multi-page) | `client.lua` — three pages, three nav entries |
| Pages with render actions | `client.lua` — `renderMainPage`, `renderStatsPage`, `renderActionsPage` |
| Player detail tabs | `client.lua` — public + permission-gated tab |
| Dashboard widgets | `client.lua` — `renderWidget` |
| Client handlers (render) | `client.lua` — all `render*` handlers |
| Client handlers (actions) | `client.lua` — `refresh`, `toggle`, `pushUpdate` |
| Server handlers | `server.lua` — `getServerData`, `demoServerAction` |
| Permission guarding | `server.lua` — `DoesPlayerHavePermission` checks |
| Permissions | `shared.lua` — `plugin.demo`, `plugin.demo.advanced` |
| Live updates | `client.lua` — `pushUpdate` calls `SendNUIMessage` |
| Every schema component | `client.lua` `renderMainPage` — all 18 types |

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
2. Add `ensure ea-plugin-demo` to your `server.cfg` **after** `ensure easyadmin`
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
   - "Refresh" — re-renders with a fresh timestamp and "Refreshed!" badge
   - "Toggle Badge" — increments a counter, shows even/odd badge
   - "Push Update" — triggers a live `SendNUIMessage` refresh
   - "Get Server Data" — calls the server handler (requires `plugin.demo.advanced` perm)

## Adapting for your plugin

1. **Rename** the folder and all occurrences of `ea-plugin-demo` to your plugin ID
2. **Edit `fxmanifest.lua`** — change `dependencies`, `author`, `description`
3. **Edit `shared.lua`** — change permission names
4. **Edit `client.lua`** — change `RegisterPlugin()` config, handler names, and schema content
5. **Edit `server.lua`** — change server handler names and logic

## Key patterns

### Registering a plugin

```lua
exports['easyadmin']:RegisterPlugin({
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

### Registering a permission

```lua
Citizen.CreateThread(function()
  while permissions == nil do Citizen.Wait(50) end
  permissions['plugin.my-plugin'] = false
end)
```

### Client render handler

```lua
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderPage', function(data)
  return {
    { type = 'heading', text = 'Hello', level = 2 },
    { type = 'text', text = 'World', variant = 'muted' },
  }
end)
```

### Client action handler (returns new schema)

```lua
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'refresh', function(data)
  return { { type = 'badge', text = 'Refreshed!', variant = 'online' } }
end)
```

### Client action handler (side effect only)

```lua
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'notify', function(data)
  SendNUIMessage({ action = 'plugin:my-plugin:update' })
  return { ok = true }
end)
```

### Server handler (permission-guarded)

```lua
exports['easyadmin']:RegisterPluginServerHandler('my-plugin', 'doAction', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return { ok = false, error = 'permission denied' }
  end
  return { ok = true, result = 'done' }
end)
```

### Button with server action

```lua
{ type = 'button', label = 'Server Action', action = 'doAction', server = true }
```

### Live update

```lua
SendNUIMessage({ action = 'plugin:my-plugin:update' })
```
