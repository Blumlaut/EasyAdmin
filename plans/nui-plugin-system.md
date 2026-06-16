# NUI Plugin System — Design Document

**Status:** Draft  
**Target:** EasyAdmin 8.x (React NUI)

---

## FiveM References

All FiveM scripting decisions in this document reference the official documentation. Key references:

| Topic | Documentation |
|-------|---------------|
| Resource model | [Introduction to Resources](https://docs.fivem.net/docs/scripting-manual/introduction/introduction-to-resources/) |
| Resource manifest | [Resource Manifest Reference](https://docs.fivem.net/docs/scripting-reference/resource-manifest/) |
| NUI (fullscreen) | [Fullscreen NUI](https://docs.fivem.net/docs/scripting-manual/nui-development/full-screen-nui/) |
| NUI callbacks | [NUI Callbacks](https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/) |
| SendNUIMessage | [SendNUIMessage](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/) |
| RegisterNUICallback | [RegisterNUICallback](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/RegisterNUICallback/) |
| Triggering events | [Triggering Events](https://docs.fivem.net/docs/scripting-manual/working-with-events/triggering-events/) |
| Listening for events | [Listening for Events](https://docs.fivem.net/docs/scripting-manual/working-with-events/listening-for-events/) |
| Lua scripting | [Scripting in Lua](https://docs.fivem.net/docs/scripting-manual/runtimes/lua/) |
| Exports | [Using Exports](https://docs.fivem.net/docs/scripting-manual/runtimes/lua/#using-exports) |
| `provide` keyword | [provide](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#provide) |
| `ui_page` | [ui_page](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#ui_page) |
| NUI focus | [SET_NUI_FOCUS](https://docs.fivem.net/natives/?_0x5B98AE30) |
| Resource lifecycle | `onClientResourceStop` (see [AddEventHandler](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/AddEventHandler/)) |

### Key FiveM Constraints

- **Resource isolation** — Each resource has its own `ui_page`. There is no mechanism for one resource's NUI to load another resource's JavaScript ([ui_page](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#ui_page)).
- **NUI callbacks** — The NUI communicates back to Lua via `fetch('https://' .. GetParentResourceName() .. '/callbackName')`. The resource that registered the callback must be the parent resource (EasyAdmin) ([NUI Callbacks](https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/)).
- **SendNUIMessage** — Only the resource that owns the NUI (EasyAdmin, via `ui_page`) can send messages to it via `SendNUIMessage()` ([SendNUIMessage](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/)).
- **`provide` keyword** — EasyAdmin's `fxmanifest.lua` uses `provide 'EasyAdmin'`, which means other resources that depend on `EasyAdmin` will receive this resource instead. This allows the `EasyAdmin` global table to be shared across resources ([provide](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#provide)).
- **`onClientResourceStop`** — Fires when any client-side resource stops. Used to detect when plugin resources are stopped so their UI can be cleaned up. Already used in `client/nui/events.lua` for focus cleanup.
- **Callback must always be called** — Per FiveM docs: "To prevent requests from stalling, you **have to** return the callback at all times" ([NUI Callbacks](https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/)).

---

## Problem Statement

EasyAdmin's legacy NativeUI plugin system (`addPlugin()`) injects menu items directly into NativeUI's Lua-side menu tree. The new React NUI has no NativeUI — it's a compiled React SPA running in FiveM's CEF browser. We need a plugin system that:

1. Allows **standalone resources** (outside EasyAdmin's folder) to contribute UI to the EasyAdmin panel
2. Produces UI that is **visually consistent** with EasyAdmin's design system
3. Does **not** require plugins to be bundled inside EasyAdmin (escrowable, independently versionable)
4. Works within FiveM's resource isolation model (no cross-resource JS loading)

---

## Why React Component Injection Is Not Possible

The most natural desire is: *plugins provide React components, EasyAdmin renders them.* This doesn't work for fundamental reasons:

### 1. Separate bundles, no injection path

EasyAdmin's NUI is compiled by Vite into a single JS bundle (`nui/dist/`). External resources have their own files and there is **no mechanism** in FiveM for one resource's NUI to load another resource's JavaScript. Each resource has its own `ui_page` and they are isolated.

### 2. React instance isolation

Even if a plugin could somehow load JS into EasyAdmin's NUI (e.g. via a dynamically injected `<script>` tag), it would need its own copy of React. **React does not support multiple instances** — components created with one React instance cannot be rendered inside a tree owned by another React instance. The fiber reconciler will reject foreign elements.

To share a React instance, the plugin would need to be compiled as an external dependency of EasyAdmin's bundle, which requires:
- Matching React versions exactly
- Matching TypeScript configurations
- Access to EasyAdmin's build pipeline (Vite config, Tailwind, path aliases)
- Being listed in EasyAdmin's `package.json`

This creates the **exact tight coupling** we're trying to avoid.

### 3. CSS / design system coupling

EasyAdmin uses a token-based CSS system (Tailwind + custom tokens in `tokens.css`). A plugin rendering its own DOM would need to either:
- Ship its own CSS (risking visual inconsistency)
- Depend on EasyAdmin's CSS classes (fragile, version-coupled)
- Inline styles (bypasses the design system entirely)

### Conclusion

React component injection is not viable. The plugin system must use a different paradigm.

---

## Chosen Approach: Data-Driven Plugin Pages

Plugins define **structured data describing what they want to render**, using component types that EasyAdmin provides. EasyAdmin's NUI renders this data using its own components and design system.

**Analogy:** The legacy NativeUI plugin system was already data-driven in spirit — plugins called `NativeUI.CreateItem()` with label/description text, and NativeUI rendered the actual UI. Plugins couldn't inject custom NativeUI subclasses. The new system follows the same pattern: plugins describe *what* they want, EasyAdmin decides *how* it looks.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FiveM Server                                │
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │  my-plugin       │         │  EasyAdmin       │                 │
│  │  (standalone)    │         │  (host resource) │                 │
│  │                  │         │                  │                 │
│  │  EasyAdmin.      │register │  pluginRegistry  │push config      │
│  │  registerPlugin()│────────▶│                  │────────────────▶│  ┌──────────┐│
│  │                  │         │                  │SendNUIMessage() │  │  NUI     ││
│  │  EasyAdmin.      │action   │  forward to      │callLua()        │  │  (React) ││
│  │  onPluginAction()│◀────────│  plugin handler  │◀────────────────│  │  App.tsx ││
│  │                  │result   │                  │                 │  │          ││
│  └──────────────────┘         └──────────────────┘                 │  └──────────┘│
│                                                                     │              │
└─────────────────────────────────────────────────────────────────────┘              │
                                                                                     │
                              Plugin updates UI via:                                 │
                              EasyAdmin.updatePluginPage() ──▶ SendNUIMessage() ──▶ NUI│
```

### Data Flow

1. **Registration** — Plugin calls `EasyAdmin.registerPlugin(config)` from its client Lua. EasyAdmin stores the config and pushes it to the NUI via `SendNUIMessage()`.

2. **Initial load** — When the NUI menu opens, it calls `callLua('getPlugins')` to fetch all currently registered plugins. This ensures plugins registered before the menu opened are included. (Matches the pattern used by `callLua('requestPlayers')`, `callLua('requestReports')`, etc.)

3. **Rendering** — The NUI receives plugin configs and renders `PluginPage` components using EasyAdmin's component library. Nav items appear in the sidebar.

4. **Actions** — User clicks a button on a plugin page. The NUI calls `callLua('pluginAction', { resource, action, data })`. EasyAdmin's Lua forwards this to the plugin's registered callback via the handler stored in `pluginActionHandlers`.

5. **Updates** — Plugin calls `EasyAdmin.updatePluginPage(resource, update)` to push new data. The NUI receives it via `SendNUIMessage()` and re-renders the affected sections using immutable state updates.

6. **Unregistration** — When a plugin resource stops (`onClientResourceStop`), EasyAdmin removes it from the registry and notifies the NUI via `SendNUIMessage({ action = 'pluginUnregistered', data = { resource } })`. The NUI removes the plugin's nav items and pages.

---

## Plugin API (Lua)

Plugins interact with EasyAdmin through three functions exposed on a global `EasyAdmin` table.

The `EasyAdmin` global table is created in `client/nui/plugins.lua` (`if not EasyAdmin then EasyAdmin = {} end`). Because EasyAdmin's `fxmanifest.lua` declares `provide 'EasyAdmin'`, other resources that reference EasyAdmin will receive this resource's globals. Per the [FiveM `provide` documentation](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#provide), the providing resource "will act as if it is said resource if started."

### `EasyAdmin.registerPlugin(config)`

Register a plugin with EasyAdmin. Called once during resource startup.

```lua
--- @class PluginConfig
--- @field name string                          Plugin display name
--- @field version string?                      Semantic version (for debugging)
--- @field nav PluginNavItem                   Sidebar navigation entry
--- @field pages PluginPageConfig[]             One or more pages

--- @class PluginNavItem
--- @field id string                            Unique nav ID (e.g. "my-plugin")
--- @field label string                         Display label in sidebar
--- @field icon string                          Icon name from EasyAdmin's icon set
--- @field order number?                        Sort order (default: 99 — after built-in items)
--- @field permission string?                   Permission required to see this nav item

--- @class PluginPageConfig
--- @field id string                            Unique page ID (e.g. "my-plugin-main")
--- @field title string                         Page title shown in topbar
--- @field permission string?                   Permission required to see this page
--- @field sections PluginSectionConfig[]       Page content sections

--- @class PluginSectionConfig
--- @field id string                            Unique section ID (for targeted updates)
--- @field title string?                        Section heading
--- @field component PluginComponent            Component definition
--- @field loading boolean?                     Show skeleton while data loads (default: false)

--- @class PluginComponent
--- @field type string                          Component type (see registry below)
--- @field props table                          Component-specific properties
```

**Full example:**

```lua
EasyAdmin.registerPlugin({
    name = "Combat System",
    version = "2.1.0",
    nav = {
        id = "combat-system",
        label = "Combat",
        icon = "zap",
        order = 5,
        permission = "combat.admin",
    },
    pages = {
        {
            id = "combat-dashboard",
            title = "Combat Dashboard",
            sections = {
                {
                    id = "status",
                    title = "Current Status",
                    component = {
                        type = "info-table",
                        props = {
                            rows = {
                                { key = "Mode", value = "Combat" },
                                { key = "Wave", value = "12" },
                                { key = "Active Players", value = "8/32" },
                                { key = "Next Wave", value = "In 3:42" },
                            },
                        },
                    },
                },
                {
                    id = "actions",
                    title = "Wave Controls",
                    component = {
                        type = "button-group",
                        props = {
                            buttons = {
                                {
                                    label = "Start Wave",
                                    action = "start_wave",
                                    variant = "primary",
                                },
                                {
                                    label = "Skip Wave",
                                    action = "skip_wave",
                                    variant = "secondary",
                                },
                                {
                                    label = "Reset",
                                    action = "reset",
                                    variant = "danger",
                                },
                            },
                        },
                    },
                },
                {
                    id = "recent-events",
                    title = "Recent Events",
                    component = {
                        type = "list",
                        props = {
                            items = {
                                {
                                    title = "Player JohnDoe eliminated",
                                    subtitle = "2 minutes ago",
                                },
                                {
                                    title = "Wave 11 completed",
                                    subtitle = "5 minutes ago",
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            id = "combat-settings",
            title = "Combat Settings",
            sections = {
                {
                    id = "config",
                    title = "Configuration",
                    component = {
                        type = "form",
                        props = {
                            fields = {
                                {
                                    key = "maxPlayers",
                                    label = "Max Players",
                                    placeholder = "32",
                                    type = "number",
                                },
                            },
                            submit = {
                                label = "Save Settings",
                                action = "save_settings",
                                variant = "primary",
                            },
                        },
                    },
                },
            },
        },
    },
})
```

### `EasyAdmin.onPluginAction(resourceName, handler)`

Register a callback for actions triggered from the NUI.

```lua
--- @param resourceName string   The resource name (use GetCurrentResourceName())
--- @param handler function      handler(action, data, respond)
--- @param action string         The action identifier from the button/item
--- @param data table?           Optional data sent with the action
--- @param respond function      respond(resultTable) — send result back to NUI

EasyAdmin.onPluginAction(GetCurrentResourceName(), function(action, data, respond)
    if action == "start_wave" then
        TriggerServerEvent("combat:startWave")
        respond({ success = true })
    elseif action == "reset" then
        -- Return data for a confirmation dialog
        respond({
            confirm = true,
            title = "Reset Combat System",
            message = "This will reset all wave data. Are you sure?",
            variant = "danger",
            onConfirm = "confirm_reset",  -- action to call when user confirms
        })
    elseif action == "confirm_reset" then
        TriggerServerEvent("combat:reset")
        respond({ success = true })
    elseif action == "save_settings" then
        -- data contains form field values: { maxPlayers = "32" }
        TriggerServerEvent("combat:saveSettings", data)
        respond({ success = true })
    end
end)
```

### `EasyAdmin.updatePluginPage(resourceName, update)`

Push updated content to a plugin's page. Used for live data (timers, event logs, etc.).

```lua
--- @param resourceName string   The resource name
--- @param update table          Update payload

--- Update payload fields:
--- @field pageId string?        Target page (default: first page)
--- @field sections PluginSectionConfig[]?  Replace all sections on page
--- @field sectionId string?     Target a specific section by ID
--- @field component PluginComponent?      New component for targeted section

-- Replace all sections on the first page:
EasyAdmin.updatePluginPage("combat-system", {
    sections = {
        {
            id = "status",
            title = "Current Status",
            component = {
                type = "info-table",
                props = {
                    rows = {
                        { key = "Wave", value = tostring(newWave) },
                    },
                },
            },
        },
    },
})

-- Update just one section:
EasyAdmin.updatePluginPage("combat-system", {
    sectionId = "recent-events",
    component = {
        type = "list",
        props = {
            items = newEventItems,
        },
    },
})

-- Update a specific page by ID:
EasyAdmin.updatePluginPage("combat-system", {
    pageId = "combat-settings",
    sections = {
        {
            id = "config",
            title = "Configuration",
            component = {
                type = "info-table",
                props = { rows = { { key = "Status", value = "Saved" } } },
            },
        },
    },
})
```

---

## Component Registry

Plugins can only use components from this registry. EasyAdmin renders them using its own component library and design system. This is the contract between plugins and the host.

### `info-table`

Key-value pairs displayed in a clean table layout. Uses the existing `KeyValueTable` component (`nui/src/components/KeyValueTable.tsx`).

```lua
{
    type = "info-table",
    props = {
        rows = {
            { key = "Label", value = "Value" },
            { key = "Status", value = "Online", mono = false },  -- mono uses monospace font
            {
                key = "Action",
                value = "Click to copy",
                action = "copy_value",         -- Makes the row clickable
                actionLabel = "Copy",          -- Hint shown on hover
            },
        },
    },
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rows` | `InfoTableRow[]` | Yes | Rows to display |

**`InfoTableRow`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Row label |
| `value` | `string` | Yes | Row value |
| `mono` | `boolean?` | No | Use monospace font for value |
| `action` | `string?` | No | Action ID (makes row clickable) |
| `actionLabel` | `string?` | No | Hint text for clickable rows |

---

### `button-group`

A row of action buttons. Uses EasyAdmin's `.btn` classes (`nui/src/styles/components/buttons.css`).

```lua
{
    type = "button-group",
    props = {
        buttons = {
            {
                label = "Start",
                action = "start",
                variant = "primary",       -- default | primary | secondary | danger | warning | success
                disabled = false,
            },
            {
                label = "Confirm Delete",
                action = "delete",
                variant = "danger",
                confirm = {                 -- Optional confirmation before action
                    title = "Delete Item",
                    message = "This cannot be undone.",
                },
            },
            {
                label = "Settings",
                action = "navigate",
                variant = "secondary",
                navigateTo = "combat-settings",  -- Navigate to another plugin page
            },
        },
    },
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `buttons` | `PluginButton[]` | Yes | Buttons to display |

**`PluginButton`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Button text |
| `action` | `string` | Yes | Action ID sent to plugin handler |
| `variant` | `string?` | No | Button style (default: `default`) |
| `disabled` | `boolean?` | No | Whether button is disabled |
| `confirm` | `ConfirmConfig?` | No | Confirmation dialog config |
| `navigateTo` | `string?` | No | Page ID to navigate to (overrides action) |

**`ConfirmConfig`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Dialog title |
| `message` | `string` | Yes | Dialog body text |

---

### `list`

A vertical list of items. Uses EasyAdmin's `.list` / `.list-item` classes (`nui/src/styles/components/lists.css`).

```lua
{
    type = "list",
    props = {
        items = {
            {
                title = "Player JohnDoe eliminated",
                subtitle = "2 minutes ago",
                action = "view_player",      -- Optional: makes item clickable
                actionData = { playerId = 3 }, -- Data sent with the action
            },
            {
                title = "Wave 11 completed",
                subtitle = "5 minutes ago",
            },
        },
    },
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `ListItem[]` | Yes | List items |

**`ListItem`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Primary text |
| `subtitle` | `string?` | No | Secondary text (muted) |
| `action` | `string?` | No | Action ID (makes item clickable) |
| `actionData` | `table?` | No | Data sent with the action |

---

### `form`

A simple form with text inputs and a submit button. Renders inline within the section card (not as a modal). Uses EasyAdmin's existing input styles (`nui/src/styles/components/inputs.css`) and button variants.

```lua
{
    type = "form",
    props = {
        fields = {
            {
                key = "message",
                label = "Announcement",
                placeholder = "Type your message...",
                required = true,
            },
            {
                key = "duration",
                label = "Duration (seconds)",
                placeholder = "30",
                type = "number",
            },
        },
        submit = {
            label = "Send Announcement",
            action = "send_announcement",
            variant = "primary",
        },
    },
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fields` | `FormField[]` | Yes | Form fields |
| `submit` | `SubmitConfig` | Yes | Submit button config |

**`FormField`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Field key (sent in action data) |
| `label` | `string` | Yes | Field label |
| `placeholder` | `string?` | No | Input placeholder |
| `type` | `string?` | No | Input type: `text` (default) or `number` |
| `required` | `boolean?` | No | Whether field is required |

**`SubmitConfig`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | Yes | Button text |
| `action` | `string` | Yes | Action ID sent on submit |
| `variant` | `string?` | No | Button variant |

**Form submission flow:** When the user submits the form, the `FormRenderer` collects all field values into a table keyed by field `key` and calls `callLua('pluginAction', { resource = pluginResource, action = submit.action, data = { message = "hello", duration = "30" } })`. This follows the same pattern as all other plugin actions — EasyAdmin's `RegisterNUICallback("pluginAction", ...)` forwards the call to the plugin's registered handler. The handler receives `data` as the field values table.

---

### `status-bar`

A progress/percentage bar. Good for timers, health bars, resource usage, etc. Uses the existing `.dashboard-bar-track` / `.dashboard-bar-fill` classes (`nui/src/styles/components/cards.css`).

```lua
{
    type = "status-bar",
    props = {
        label = "Wave Timer",
        value = 75,              -- 0-100
        color = "blue",          -- blue | green | red | orange
    },
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Bar label |
| `value` | `number` | Yes | Percentage (0–100) |
| `color` | `string?` | No | Bar color (default: `blue`) |

**Color mapping** — Maps to EasyAdmin's existing accent tokens from `nui/src/styles/tokens.css`:

| Color Token | CSS Variable | Hex |
|-------------|-------------|-----|
| `blue` | `--accent-blue` | `#58a6ff` |
| `green` | `--accent-green` | `#3fb950` |
| `red` | `--accent-red` | `#f85149` |
| `orange` | `--accent-orange` | `#d29922` |

The `StatusBarRenderer` applies the color via inline `style={{ background: 'var(--accent-<color>)' }}` on the fill element. The track uses `var(--bg-hover)` for the background.

---

### `divider`

A horizontal rule between sections. Renders as `<hr className="section-divider">` using the existing utility class (`nui/src/styles/utilities.css`).

```lua
{
    type = "divider",
    props = {},
}
```

---

### `heading`

A text heading. Useful for section labels without a card wrapper.

```lua
{
    type = "heading",
    props = {
        text = "Server Configuration",
        level = 3,              -- 2, 3, or 4 (maps to h2/h3/h4)
    },
}
```

---

### `error-card` (internal)

Not exposed to plugins. Rendered when a plugin sends an invalid component type or malformed props. Displays a styled error card with the component type that failed and a console warning.

```tsx
// Internal use only — rendered by PluginComponents.tsx for unknown types
<div className="card card-danger-border">
  <div className="card-title">Component Error</div>
  <p className="text-muted text-sm">
    Unknown component type: "{component.type}"
  </p>
</div>
```

When an unknown component type is encountered:
1. `console.warn('[EasyAdmin Plugin] Unknown component type:', component.type, 'from plugin:', resource)` is logged
2. An `error-card` is rendered in place of the unknown component, using the existing `.card-danger-border` class
3. The rest of the page continues to render normally

This provides visibility to both developers (console) and users (error card) without crashing the page.

---

## Multi-Page Plugins and Sub-Navigation

Plugins can define multiple pages in their `pages` array. Only **one nav item** is created per plugin (the one defined in `nav`). Sub-navigation between plugin pages is handled through buttons with the `navigateTo` property.

### How It Works

1. The plugin's nav item always navigates to the **first page** in the `pages` array
2. Buttons with `navigateTo = "some-page-id"` switch to that page within the same plugin context
3. The `View` type includes plugin pages as `plugin-{resourceName}-{pageIndex}` where `pageIndex` is the 0-based index into the plugin's `pages` array
4. The topbar title updates to the target page's `title`
5. The back button in the topbar navigates back through view history (same as built-in pages)

### Example

```lua
-- Two pages, one nav item
EasyAdmin.registerPlugin({
    name = "Combat System",
    nav = { id = "combat-system", label = "Combat", icon = "zap" },
    pages = {
        {
            id = "combat-dashboard",
            title = "Combat Dashboard",
            sections = {
                {
                    id = "nav",
                    component = {
                        type = "button-group",
                        props = {
                            buttons = {
                                {
                                    label = "⚙ Settings",
                                    action = "navigate",
                                    navigateTo = 1,  -- index of the settings page
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            id = "combat-settings",
            title = "Combat Settings",
            sections = {
                {
                    id = "nav-back",
                    component = {
                        type = "button-group",
                        props = {
                            buttons = {
                                {
                                    label = "← Dashboard",
                                    action = "navigate",
                                    navigateTo = 0,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
})
```

---

## NUI Integration

### New Files

| File | Purpose |
|------|---------|
| `nui/src/types/plugin.ts` | TypeScript types for plugin configs |
| `nui/src/components/PluginPage.tsx` | Renders plugin page from config data (wraps in `.page-container`) |
| `nui/src/components/PluginComponents.tsx` | Individual renderers for each component type |
| `nui/src/components/PluginErrorCard.tsx` | Error card for invalid components |
| `nui/src/hooks/usePlugins.ts` | Manages plugin registry state and updates |

### App.tsx Changes

1. **Plugin state** — `usePlugins()` hook manages the registered plugin registry. Called on mount via `callLua('getPlugins')` (same pattern as `fetchPlayers`, `fetchReports`).

2. **Nav items** — Plugin nav items are merged into `NAV_ITEMS` with proper ordering. Permission is resolved in Lua (see below) and sent as a boolean `disabled` flag, matching the existing `visibleNavItems` pattern.

3. **Routing** — Plugin pages use the `View` type extended with `plugin-{resourceName}-{pageIndex}`. The `navigateTo` callback handles these views by looking up the plugin's page config.

4. **Listeners** — Three `on()` handlers:
   - `on('pluginRegistered', ...)` — Add/update a plugin in state
   - `on('pluginPageUpdate', ...)` — Apply partial updates to plugin state (immutable: spread + filter by sectionId)
   - `on('pluginUnregistered', ...)` — Remove a plugin from state and nav items

5. **View history** — Plugin pages participate in the existing `viewHistoryRef` stack. The back button works normally.

### TypeScript Types

```typescript
// nui/src/types/plugin.ts

export interface PluginNavItem {
  id: string
  label: string
  icon: string
  order?: number
  disabled?: boolean  // resolved from permission in Lua
}

export interface PluginSection {
  id: string
  title?: string
  component: PluginComponent
  loading?: boolean
}

export interface PluginPage {
  id: string
  title: string
  sections: PluginSection[]
}

export interface PluginConfig {
  resource: string
  name: string
  version?: string
  nav: PluginNavItem
  pages: PluginPage[]
}

export type PluginView = `plugin-${string}-${number}`

// Component types
export type ComponentType =
  | 'info-table'
  | 'button-group'
  | 'list'
  | 'form'
  | 'status-bar'
  | 'divider'
  | 'heading'

export interface PluginComponent {
  type: ComponentType
  props: Record<string, unknown>
}
```

### Navigation Integration

Plugin nav items are sorted by `order` and injected into the sidebar between built-in items. The default order of 99 places them after all built-in items. Built-in items use orders 1–7:

```
1  Dashboard
2  Players
3  Ban List
4  Reports
5  Server
6  Resources
7  Settings
.. (plugin items with order < 99)
99 (plugin items with default order)
```

Permission gating: The Lua side resolves `nav.permission` using `DoesPlayerHavePermission(-1, permission)` and includes the result as `disabled` in the config pushed to NUI. This matches the existing pattern in `App.tsx` where `visibleNavItems` maps over items and sets `disabled` based on the `permissions` record.

### Rendering Pipeline

```
PluginPage (page config)
  └─ <div className="page-container">  (existing class, matches all other pages)
       └─ Section wrapper (card with title)
            └─ PluginComponents.tsx (dispatch on component.type)
                 ├─ InfoTableRenderer    → KeyValueTable
                 ├─ ButtonGroupRenderer  → <button className="btn ...">
                 ├─ ListRenderer         → <div className="list">
                 ├─ FormRenderer         → <form> with inputs
                 ├─ StatusBarRenderer    → progress bar
                 ├─ DividerRenderer      → <hr className="section-divider">
                 ├─ HeadingRenderer      → <h{level}>
                 └─ ErrorCardRenderer    → error card (internal, unknown types)
```

Each renderer uses EasyAdmin's existing CSS classes and component primitives. Plugins have no control over styling — they control data and structure only.

### Loading States

Plugin sections support a `loading` boolean flag. When `true`, the section renders a skeleton placeholder using the existing `Skeleton` component (`nui/src/components/Skeleton.tsx`), matching the pattern used by built-in pages (`loadingPlayers`, `loadingReports`, `loadingCached`).

```tsx
// In PluginPage.tsx
{section.loading ? (
  <div className="card">
    <Skeleton className="dashboard-skeleton-label" />
    <div className="mt-2 space-y-2">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  </div>
) : (
  <SectionRenderer section={section} />
)}
```

Plugins set `loading: true` in their initial registration and set it to `false` via `updatePluginPage` when data is ready.

---

## Design Standards

Plugin pages must look like they belong in EasyAdmin. The component registry enforces this by construction: every component type maps directly to EasyAdmin's existing component library.

### What Plugins Control

- **Data** — What values are displayed
- **Structure** — Which components, in what order
- **Actions** — What buttons exist and what they do
- **Labels** — Text shown to users (titles, keys, labels)
- **Navigation** — Links between their own pages via `navigateTo`

### What Plugins Cannot Control

- **Colors** — Determined by EasyAdmin's token system (and RedM theme override)
- **Typography** — Font families, sizes, weights are fixed by the design system
- **Spacing** — Uses EasyAdmin's spacing tokens (`--space-*`)
- **Layout** — Cards, grids, and flex layouts are determined by EasyAdmin's renderers
- **Animations** — No custom animations (CEF-safe by default)
- **Custom CSS** — Not possible (plugins can't inject stylesheets)

### Section Wrapping

Every plugin section is rendered inside a `.card` container with the section title as a `.card-title` heading. This ensures consistent padding, borders, and backgrounds regardless of component type.

The `PluginPage` component wraps all sections in a `.page-container` (existing class in `nui/src/styles/utilities.css`, used by all other EasyAdmin pages: Settings, Resources, Server, Reports, Bans, etc.), ensuring consistent padding and scroll behavior.

### CEF Safety

All plugin-rendered content inherits EasyAdmin's CEF-safe CSS:
- No `transform` in `@keyframes`
- No `animation` on modal/overlay elements
- Safe `box-shadow` values
- Relative units for sizing

---

## Confirmation Dialog Flow

Plugin buttons can trigger confirmation dialogs using the `confirm` property. The flow uses EasyAdmin's existing `ModalContext` and `ConfirmDialog` component:

### Flow

1. User clicks a button with `confirm` config
2. The `ButtonGroupRenderer` calls `useModalContext().openConfirm(title, message, action, variant)` where `action` is a `Promise<void>` that re-invokes the plugin action
3. The confirm dialog renders via `ModalContext` (existing pattern, see `ModalContext.tsx` `openConfirm`)
4. On user confirmation, the action calls `callLua('pluginAction', { resource, action: button.action, data })`
5. The plugin handler receives the action and processes it normally

### Implementation

```tsx
// In ButtonGroupRenderer
const handleConfirmButton = useCallback((button: PluginButton) => {
  if (button.confirm) {
    openConfirm(
      button.confirm.title,
      button.confirm.message,
      async () => {
        await callLua('pluginAction', {
          resource: pluginResource,
          action: button.action,
          data: undefined,
        }).catch(() => {})
      },
      'danger',
    )
    return
  }
  // No confirmation — call action directly
  callLua('pluginAction', {
    resource: pluginResource,
    action: button.action,
    data: undefined,
  }).catch(() => {})
}, [])
```

This matches the existing pattern used throughout EasyAdmin (ban confirm, resource stop confirm, etc.) where `openConfirm(title, message, action, variant)` is called with a `() => Promise<void>` action.

---

## EasyAdmin Lua API Implementation

### New File: `client/nui/plugins.lua`

```lua
------------------------------------
-- EasyAdmin NUI: Plugin System
-- Registration, action forwarding, page updates, lifecycle
--
-- FiveM references:
--   SendNUIMessage: https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/
--   RegisterNUICallback: https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/RegisterNUICallback/
--   onClientResourceStop: https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/AddEventHandler/
------------------------------------

local pluginRegistry = {}          -- resource -> PluginConfig
local pluginActionHandlers = {}    -- resource -> handler function

-- Expose API on global EasyAdmin table
if not EasyAdmin then EasyAdmin = {} end

--- Register a plugin with EasyAdmin's NUI
function EasyAdmin.registerPlugin(config)
    local resource = GetCurrentResourceName()

    if pluginRegistry[resource] then
        PrintDebugMessage(("Plugin '%s' already registered by %s"):format(config.name, resource), 2)
        return
    end

    -- Basic validation
    if not config.name or not config.nav or not config.pages then
        print(("^1[EasyAdmin] Invalid plugin config from %s: missing name, nav, or pages^0"):format(resource))
        return
    end

    if type(config.pages) ~= 'table' or #config.pages == 0 then
        print(("^1[EasyAdmin] Invalid plugin config from %s: pages must be a non-empty array^0"):format(resource))
        return
    end

    -- Resolve permission to boolean for NUI
    local resolvedConfig = {
        name = config.name,
        version = config.version,
        nav = {
            id = config.nav.id,
            label = config.nav.label,
            icon = config.nav.icon,
            order = config.nav.order or 99,
            disabled = false,
        },
        pages = {},
    }

    -- Check nav-level permission
    if config.nav.permission then
        resolvedConfig.nav.disabled = not DoesPlayerHavePermission(-1, config.nav.permission)
    end

    -- Copy pages, resolve page-level permissions
    for i, page in ipairs(config.pages) do
        local resolvedPage = {
            id = page.id,
            title = page.title,
            sections = page.sections or {},
        }
        -- Page-level permission check
        if page.permission and not DoesPlayerHavePermission(-1, page.permission) then
            resolvedPage.hidden = true
        end
        table.insert(resolvedConfig.pages, resolvedPage)
    end

    pluginRegistry[resource] = resolvedConfig

    PrintDebugMessage(("Registered plugin '%s' by %s"):format(config.name, resource), 4)

    -- Push to NUI (only if menu is open)
    if IsNuiVisible() then
        SendNUIMessage({
            action = 'pluginRegistered',
            data = { resource = resource, config = resolvedConfig },
        })
    end
end

--- Register an action handler for a plugin
function EasyAdmin.onPluginAction(resourceName, handler)
    if type(handler) ~= 'function' then
        print(("^1[EasyAdmin] onPluginAction: handler must be a function^0"))
        return
    end
    pluginActionHandlers[resourceName] = handler
end

--- Update a plugin's page content dynamically
function EasyAdmin.updatePluginPage(resourceName, update)
    if not pluginRegistry[resourceName] then
        print(("^1[EasyAdmin] updatePluginPage: unknown plugin '%s'^0"):format(resourceName))
        return
    end

    if not IsNuiVisible() then
        return
    end

    SendNUIMessage({
        action = 'pluginPageUpdate',
        data = { resource = resourceName, update = update },
    })
end

--- Unregister a plugin (called on resource stop)
function EasyAdmin.unregisterPlugin(resource)
    if pluginRegistry[resource] then
        pluginRegistry[resource] = nil
        pluginActionHandlers[resource] = nil
        PrintDebugMessage(("Unregistered plugin by %s"):format(resource), 4)

        if IsNuiVisible() then
            SendNUIMessage({
                action = 'pluginUnregistered',
                data = { resource = resource },
            })
        end
    end
end

-- NUI callback: forward actions to plugin handlers
-- Per FiveM docs: "To prevent requests from stalling, you have to return the callback at all times"
-- https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/
RegisterNUICallback('pluginAction', function(data, cb)
    local handler = pluginActionHandlers[data.resource]
    if not handler then
        cb({ success = false, error = ("No action handler for plugin '%s'"):format(data.resource) })
        return
    end

    -- Wrap cb to ensure it's always called
    local function respond(result)
        cb(result or { success = true })
    end

    handler(data.action, data.data, respond)
end)

-- NUI callback: get all registered plugins (for initial load when menu opens)
RegisterNUICallback('getPlugins', function(_, cb)
    cb(pluginRegistry)
end)

-- Handle plugin resource stop
-- https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/AddEventHandler/
AddEventHandler('onClientResourceStop', function(resource)
    if pluginRegistry[resource] then
        EasyAdmin.unregisterPlugin(resource)
    end
end)
```

### fxmanifest.lua Changes

No changes needed — `client/nui/*.lua` glob in `fxmanifest.lua` already picks up the new `plugins.lua` file. The `provide 'EasyAdmin'` declaration ensures the `EasyAdmin` global table is accessible to other resources.

---

## Migration from Legacy Plugins

Legacy NativeUI plugins use `addPlugin()` with functions that mutate NativeUI menu objects. Migration path:

### Legacy Pattern
```lua
local function playerMenuOptions(playerId)
    local item = NativeUI.CreateItem("Kick Player", "Kick this player")
    thisPlayer:AddItem(item)
    item.Activated = function()
        TriggerServerEvent("EasyAdmin:kickPlayer", playerId, "Admin kick")
    end
end

addPlugin({
    name = "MyPlugin",
    functions = {
        playerMenu = playerMenuOptions,
    }
})
```

### New Pattern
```lua
EasyAdmin.registerPlugin({
    name = "MyPlugin",
    nav = {
        id = "myplugin",
        label = "My Plugin",
        icon = "tool",
    },
    pages = {
        {
            id = "myplugin-main",
            title = "My Plugin",
            sections = {
                {
                    id = "actions",
                    component = {
                        type = "button-group",
                        props = {
                            buttons = {
                                { label = "Do Thing", action = "do_thing", variant = "primary" },
                            },
                        },
                    },
                },
            },
        },
    },
})

EasyAdmin.onPluginAction(GetCurrentResourceName(), function(action, data, respond)
    if action == "do_thing" then
        TriggerServerEvent("myplugin:doThing")
        respond({ success = true })
    end
end)
```

### Key Differences

| Legacy | New |
|--------|-----|
| Functions called during menu build | Config registered once at startup |
| State in global variables | State managed by plugin Lua |
| NativeUI components only | EasyAdmin NUI components |
| Menu items injected into existing menus | Dedicated plugin pages in sidebar |
| `menuRemoved` callback for cleanup | Automatic cleanup via `onClientResourceStop` |

### Backward Compatibility

The legacy `addPlugin()` system can coexist with the new system during a transition period. The legacy system only activates when `ea_useNUI` is `false`. When the NUI is enabled, legacy plugins simply won't render anything (no NativeUI menus are built).

Plugins should be updated to use the new API. A deprecation notice should be added to the legacy `addPlugin()` function:

```lua
function addPlugin(data)
    print(("^3[EasyAdmin] DEPRECATED: addPlugin() is legacy NativeUI-only. " ..
           "Use EasyAdmin.registerPlugin() for NUI support. " ..
           "See: https://github.com/Blumlaut/EasyAdmin/blob/master/plans/nui-plugin-system.md^0"))
    -- ... existing implementation ...
end
```

---

## Plugin Documentation

Plugin authors should reference `docs/docs/plugins.md` for:
- Available icon names (listed from `nui/src/components/icons.tsx` `IconName` type)
- Permission system (same as legacy: shared Lua file with `permissions["key"] = false`)
- Component registry reference (all component types and their props)
- Multi-page navigation pattern (`navigateTo` on buttons)
- Form submission pattern (field values sent as `data` in action handler)
- Loading states (`loading: true` on sections, removed via `updatePluginPage`)
- Available button variants: `default`, `primary`, `secondary`, `danger`, `warning`, `success`
- Available status-bar colors: `blue`, `green`, `red`, `orange`

The icon reference will be added as a new section in `docs/docs/plugins.md` listing all `IconName` values from `nui/src/components/icons.tsx`.

---

## Limitations and Trade-offs

### What Plugins Cannot Do

| Limitation | Reason | Workaround |
|------------|--------|------------|
| Custom React components | React instance isolation | Use the component registry |
| Custom CSS | No stylesheet injection | Design system enforces consistency |
| Direct NUI access | Resource isolation ([ui_page](https://docs.fivem.net/docs/scripting-reference/resource-manifest/#ui_page)) | All communication through EasyAdmin API |
| Complex layouts (grids, tabs) | Registry only provides linear sections | File a feature request to extend the registry |
| Real-time animations | CEF safety + no custom CSS | Use `status-bar` for progress indicators |
| Multiple nav items per plugin | Sidebar space, consistency | Use `navigateTo` buttons for sub-pages |

### Why These Limitations Are Acceptable

1. **Consistency over flexibility** — The primary goal is that plugin UI looks like EasyAdmin UI. Restricting the component surface achieves this by construction.

2. **95% use case coverage** — Most admin plugins need: info display, action buttons, lists, and simple forms. The registry covers all of these.

3. **Precedent** — The legacy NativeUI system had the same constraint: plugins could only use NativeUI's built-in item types. They couldn't inject custom rendering.

4. **Extensible** — New component types can be added to the registry as needs arise. Each new type is a pure React component using EasyAdmin's design system.

### For Complex UI Needs

Plugins with complex UI requirements (maps, charts, custom editors) should:
1. Provide their own standalone NUI (`ui_page` in their `fxmanifest.lua`)
2. Register a nav item in EasyAdmin that triggers `ExecuteCommand("myplugin:open")`
3. Manage their own window lifecycle with `SetNuiFocus()` ([SET_NUI_FOCUS](https://docs.fivem.net/natives/?_0x5B98AE30))

This keeps complex tools independent while still being accessible from EasyAdmin's sidebar.

---

## Future Extensions

Component types that could be added to the registry based on demand:

| Component | Use Case | Complexity |
|-----------|----------|------------|
| `table` | Sortable/filterable data tables | Medium — needs column definitions |
| `tabs` | Tabbed content within a page | Low — section grouping |
| `select` | Dropdown selection | Low — maps to existing input patterns |
| `toggle` | On/off switch | Low — boolean state with action on change |
| `chart` | Simple bar/line charts | High — needs canvas/SVG rendering |
| `embed` | Raw HTML string (dangerous) | High — XSS risk, CEF rendering bugs |

Each extension is a new renderer in `PluginComponents.tsx` plus type definitions. No breaking changes to existing plugins.

---

## Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Plugin location | Standalone resources | Escrowable, independently versionable |
| UI model | Data-driven (plugins describe, EasyAdmin renders) | React instance isolation makes component injection impossible |
| Component surface | Curated registry | Guarantees visual consistency and CEF safety |
| Communication | Lua → `SendNUIMessage()` → React | FiveM's standard NUI pattern ([SendNUIMessage](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/)) |
| Actions | `callLua()` → EasyAdmin forward → plugin callback | Clean separation, no direct plugin NUI access. Per [NUI Callbacks](https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/), callback must always be called |
| Dynamic updates | `updatePluginPage()` → `SendNUIMessage()` | Plugins can refresh their UI reactively |
| Initial load | `callLua('getPlugins')` on menu open | Ensures plugins registered before menu open are included |
| Unregistration | `onClientResourceStop` → `pluginUnregistered` NUI message | Clean removal when plugin resource stops |
| Multi-page | One nav item, `navigateTo` buttons for sub-pages | Sidebar consistency, flexible internal navigation |
| Permissions | Same system as legacy (`DoesPlayerHavePermission`) | Resolved in Lua, sent as `disabled` boolean to NUI |
| Confirm dialogs | `ModalContext.openConfirm()` with action callback | Reuses existing dialog infrastructure |
| Form submission | `FormRenderer` → `callLua('pluginAction', data)` | Same flow as all other actions |
| Loading states | `loading` flag on sections, `Skeleton` component | Matches built-in page pattern |
| Error handling | Error card + console warning | Visible to users and developers, non-fatal |
| Legacy support | Deprecation notice, coexistence during transition | Graceful migration path |
