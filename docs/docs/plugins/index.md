# Plugins

EasyAdmin's plugin system lets **external FiveM resources** extend the UI at
runtime — no code is compiled into EasyAdmin.

A plugin is a normal resource that loads **after** EasyAdmin. Declare EasyAdmin
as a dependency in your fxmanifest:

```lua
dependencies { 'EasyAdmin' }
```

## How It Works

1. Your resource's **server script** calls `exports.EasyAdmin:RegisterPlugin(config)`
2. EasyAdmin stores the registration and broadcasts it to every client, which
   pushes it to the NUI (React frontend)
3. When an admin opens your plugin's page/tab/widget, the NUI triggers an
   event that your plugin listens for via `AddEventHandler`
4. Your handler calls the `cb` callback with a **schema tree** — a declarative
   description of the UI using EasyAdmin's built-in components
5. EasyAdmin renders the schema. When a button is clicked, the NUI routes to
   the matching event handler, which can return a new schema to re-render

Registration happens on the server only. The server is the source of truth and
syncs plugins to every client, so calling the export from a client script does
nothing. Handler functions, by contrast, are registered on the client (and the
server, for server actions).

> **Why events?** FiveM exports cannot pass functions between resources.
> The config table works through exports, but handler functions must be
> registered via `AddEventHandler` so they stay in the plugin's own scope.

Plugins **never ship React components or TypeScript**. They compose UI from
EasyAdmin's existing component palette (cards, stat cards, buttons, tables,
charts, alerts, badges, icons, etc.).

## Where to Start

- **Working example:** `examples/ea-plugin-demo` — a complete plugin with
  pages, a player tab, a dashboard widget and permission gating
- [Creating a Plugin](creating-plugins) — Step-by-step guide with a full example
- [Plugin API](plugin-api) — Lua exports, handlers, and events
- [Custom Permissions](custom-permissions) — Declaring and gating permissions
- [NUI Plugins (advanced)](../../nui-plugins) — Schema component reference and internals

Upgrading from 7.x? The old `plugins` folder system has been removed. See
[Updating EasyAdmin](../updates/updating#new-plugin-system) for what changed.

## What You Can Build

| Contribution | Where it appears |
|---|---|
| **Nav items** | Sidebar entries that open a plugin page |
| **Pages** | Full-page views in the main content area |
| **Player tabs** | Tabs injected into the player detail page |
| **Dashboard widgets** | Cards on the dashboard |

## Permissions

Plugins declare permissions in the `RegisterPlugin` config. EasyAdmin
registers them server-side, so `DoesPlayerHavePermission()` accepts them
and the menu can gate your contributions on them:

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  permissions = { 'plugin.my-plugin', 'plugin.my-plugin.advanced' },
  -- ...
})
```

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should see it.

Gate individual tabs, nav items, or the entire plugin via the `permission`
field. Every permission used as a gate must also appear in the plugin's
`permissions` array — a gate on an undeclared permission hides that
contribution from every admin, with no warning.

See [Custom Permissions](custom-permissions) for the full reference.
