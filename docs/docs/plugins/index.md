# Plugins

EasyAdmin's plugin system lets **external FiveM resources** extend the UI at
runtime — no code is compiled into EasyAdmin.

## How It Works

1. Your resource calls `exports['easyadmin']:RegisterPlugin(config)` from Lua
2. EasyAdmin stores the registration and syncs it to the NUI (React frontend)
3. When an admin opens your plugin's page/tab/widget, the NUI calls the
   `renderAction` you registered
4. Your Lua handler returns a **schema tree** — a declarative description of
   the UI using EasyAdmin's built-in components
5. EasyAdmin renders the schema. When a button is clicked, the NUI calls the
   button's `action` handler, which can return a new schema to re-render

Plugins **never ship React components or TypeScript**. They compose UI from
EasyAdmin's existing component palette (cards, stat cards, buttons, tables,
charts, alerts, badges, icons, etc.).

## Where to Start

- [Creating a Plugin](creating-plugins) — Step-by-step guide with a full example
- [Plugin API](plugin-api) — Lua exports, handlers, and events
- [NUI Plugins (advanced)](../nui-plugins) — Schema component reference and internals

## What You Can Build

| Contribution | Where it appears |
|---|---|
| **Nav items** | Sidebar entries that open a plugin page |
| **Pages** | Full-page views in the main content area |
| **Player tabs** | Tabs injected into the player detail page |
| **Dashboard widgets** | Cards on the dashboard |

## Permissions

Plugins can define custom permissions and gate their contributions:

```lua
-- Register a permission in your resource's shared script
Citizen.CreateThread(function()
  permissions["plugin.my-plugin"] = false
end)
```

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should see it.
Gate individual tabs or the entire plugin via the `permission` field.

See [Creating a Plugin](creating-plugins) for the full permission pattern.
