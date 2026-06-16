# NUI Plugin System — Design Document

**Status:** Draft  
**Target:** EasyAdmin 8.x (React NUI)

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
│  │                  │         │                  │                 │  │  NUI     ││
│  │  EasyAdmin.      │action   │  forward to      │callLua()        │  │  (React) ││
│  │  onPluginAction()│◀────────│  plugin handler  │◀────────────────│  │  App.tsx ││
│  │                  │result   │                  │                 │  │          ││
│  └──────────────────┘         └──────────────────┘                 │  └──────────┘│
│                                                                     │              │
└─────────────────────────────────────────────────────────────────────┘              │
                                                                                     │
                              Plugin updates UI via:                                 │
                              EasyAdmin.updatePluginPage() ──▶ SendNUIMessage ──▶ NUI│
```

### Data Flow

1. **Registration** — Plugin calls `EasyAdmin.registerPlugin(config)` from its client Lua. EasyAdmin stores the config and pushes it to the NUI via `SendNUIMessage`.

2. **Rendering** — The NUI receives the plugin config and renders a `PluginPage` using EasyAdmin's component library. Nav items appear in the sidebar.

3. **Actions** — User clicks a button on a plugin page. The NUI calls `callLua('pluginAction', { resource, action, data })`. EasyAdmin's Lua forwards this to the plugin's registered callback.

4. **Updates** — Plugin calls `EasyAdmin.updatePluginPage(resource, update)` to push new data. The NUI receives it via `SendNUIMessage` and re-renders the affected sections.

---

## Plugin API (Lua)

Plugins interact with EasyAdmin through three functions exposed on a global `EasyAdmin` table.

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
--- @field badge fun(): (string|number|nil)?    Function called to get badge value

--- @class PluginPageConfig
--- @field id string                            Unique page ID (e.g. "my-plugin-main")
--- @field title string                         Page title shown in topbar
--- @field permission string?                   Permission required to see this page
--- @field sections PluginSectionConfig[]       Page content sections

--- @class PluginSectionConfig
--- @field id string                            Unique section ID (for targeted updates)
--- @field title string?                        Section heading
--- @field component PluginComponent            Component definition

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
            onConfirm = "confirm_reset",  -- action to call when confirmed
        })
    elseif action == "confirm_reset" then
        TriggerServerEvent("combat:reset")
        respond({ success = true })
    end
end)
```

### `EasyAdmin.updatePluginPage(resourceName, update)`

Push updated content to a plugin's page. Used for live data (timers, event logs, etc.).

```lua
--- @param resourceName string   The resource name
--- @param update table          Update payload
--- @field.pageId string?        Target page (default: first page)
--- @field.sections PluginSectionConfig[]?  Replace all sections
--- @field.sectionId string?     Target a specific section by ID
--- @field.component PluginComponent?      New component for targeted section

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
```

---

## Component Registry

Plugins can only use components from this registry. EasyAdmin renders them using its own component library and design system. This is the contract between plugins and the host.

### `info-table`

Key-value pairs displayed in a clean table layout. Uses the existing `KeyValueTable` component.

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

A row of action buttons. Uses EasyAdmin's `btn` classes.

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

**`ConfirmConfig`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Dialog title |
| `message` | `string` | Yes | Dialog body text |

---

### `list`

A vertical list of items. Uses EasyAdmin's `.list` / `.list-item` classes.

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

A simple form with text inputs and a submit button. Renders using EasyAdmin's `InputPrompt` pattern.

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

When submitted, the action handler receives `data = { message = "hello", duration = "30" }` (field keys mapped to values).

---

### `status-bar`

A progress/percentage bar. Good for timers, health bars, resource usage, etc.

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

---

### `divider`

A horizontal rule between sections. No props.

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

## NUI Integration

### New Files

| File | Purpose |
|------|---------|
| `nui/src/types/plugin.ts` | TypeScript types for plugin configs |
| `nui/src/components/PluginPage.tsx` | Renders plugin page from config data |
| `nui/src/components/PluginComponents.tsx` | Individual renderers for each component type |
| `nui/src/hooks/usePlugins.ts` | Manages plugin registry state and updates |

### App.tsx Changes

1. **Plugin state** — `usePlugins()` hook manages the registered plugin registry
2. **Nav items** — Plugin nav items are merged into `NAV_ITEMS` with proper ordering
3. **Routing** — Plugin page IDs are added to the `View` type and routing logic
4. **Listeners** — `on('pluginRegistered', ...)` and `on('pluginPageUpdate', ...)` handlers

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

Permission gating works the same as built-in items: if `nav.permission` is set and the user lacks it, the nav item is hidden.

### Rendering Pipeline

```
PluginPage (page config)
  └─ Section wrapper (card with title)
       └─ PluginComponents.tsx (dispatch on component.type)
            ├─ InfoTableRenderer    → KeyValueTable
            ├─ ButtonGroupRenderer  → <button className="btn ...">
            ├─ ListRenderer         → <div className="list">
            ├─ FormRenderer         → <form> with inputs
            ├─ StatusBarRenderer    → progress bar
            ├─ DividerRenderer      → <hr>
            └─ HeadingRenderer      → <h{level}>
```

Each renderer uses EasyAdmin's existing CSS classes and component primitives. Plugins have no control over styling — they control data and structure only.

---

## Design Standards

Plugin pages must look like they belong in EasyAdmin. The component registry enforces this by construction: every component type maps directly to EasyAdmin's existing component library.

### What Plugins Control

- **Data** — What values are displayed
- **Structure** — Which components, in what order
- **Actions** — What buttons exist and what they do
- **Labels** — Text shown to users (titles, keys, labels)

### What Plugins Cannot Control

- **Colors** — Determined by EasyAdmin's token system (and RedM theme override)
- **Typography** — Font families, sizes, weights are fixed by the design system
- **Spacing** — Uses EasyAdmin's spacing tokens (`--space-*`)
- **Layout** — Cards, grids, and flex layouts are determined by EasyAdmin's renderers
- **Animations** — No custom animations (CEF-safe by default)
- **Custom CSS** — Not possible (plugins can't inject stylesheets)

### Section Wrapping

Every plugin section is rendered inside a `.card` container with the section title as a `.card-title` heading. This ensures consistent padding, borders, and backgrounds regardless of component type.

The `PluginPage` component wraps all sections in a `.page-container` (same as all other EasyAdmin pages), ensuring consistent padding and scroll behavior.

### CEF Safety

All plugin-rendered content inherits EasyAdmin's CEF-safe CSS:
- No `transform` in `@keyframes`
- No `animation` on modal/overlay elements
- Safe `box-shadow` values
- Relative units for sizing

---

## EasyAdmin Lua API Implementation

### New File: `client/nui/plugins.lua`

```lua
------------------------------------
-- EasyAdmin NUI: Plugin System
-- Registration, action forwarding, page updates
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

    pluginRegistry[resource] = config

    PrintDebugMessage(("Registered plugin '%s' by %s"):format(config.name, resource), 4)

    -- Push to NUI
    SendNUIMessage({
        action = "pluginRegistered",
        data = { resource = resource, config = config }
    })
end

--- Register an action handler for a plugin
function EasyAdmin.onPluginAction(resourceName, handler)
    if type(handler) ~= "function" then
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

    SendNUIMessage({
        action = "pluginPageUpdate",
        data = { resource = resourceName, update = update }
    })
end

-- NUI callback: forward actions to plugin handlers
RegisterNUICallback("pluginAction", function(data, cb)
    local handler = pluginActionHandlers[data.resource]
    if not handler then
        cb({ success = false, error = ("No action handler for plugin '%s'"):format(data.resource) })
        return
    end

    -- Wrap cb to handle confirm dialogs
    local function respond(result)
        cb(result or { success = true })
    end

    handler(data.action, data.data, respond)
end)

-- NUI callback: get all registered plugins (for initial load)
RegisterNUICallback("getPlugins", function(_, cb)
    cb(pluginRegistry)
end)
```

### fxmanifest.lua Changes

Add to `client_scripts`:

```lua
client_scripts {
    -- ... existing scripts ...
    "client/nui/*.lua",   -- already includes plugins.lua
}
```

No changes needed — `client/nui/*.lua` glob already picks up the new file.

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
| `menuRemoved` callback for cleanup | No cleanup needed (no global state) |

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

## Limitations and Trade-offs

### What Plugins Cannot Do

| Limitation | Reason | Workaround |
|------------|--------|------------|
| Custom React components | React instance isolation | Use the component registry |
| Custom CSS | No stylesheet injection | Design system enforces consistency |
| Direct NUI access | Resource isolation | All communication through EasyAdmin API |
| Complex layouts (grids, tabs) | Registry only provides linear sections | File a feature request to extend the registry |
| Real-time animations | CEF safety + no custom CSS | Use `status-bar` for progress indicators |

### Why These Limitations Are Acceptable

1. **Consistency over flexibility** — The primary goal is that plugin UI looks like EasyAdmin UI. Restricting the component surface achieves this by construction.

2. **95% use case coverage** — Most admin plugins need: info display, action buttons, lists, and simple forms. The registry covers all of these.

3. **Precedent** — The legacy NativeUI system had the same constraint: plugins could only use NativeUI's built-in item types. They couldn't inject custom rendering.

4. **Extensible** — New component types can be added to the registry as needs arise. Each new type is a pure React component using EasyAdmin's design system.

### For Complex UI Needs

Plugins with complex UI requirements (maps, charts, custom editors) should:
1. Provide their own standalone NUI (`ui_page` in their `fxmanifest.lua`)
2. Register a nav item in EasyAdmin that triggers `ExecuteCommand("myplugin:open")`
3. Manage their own window lifecycle with `SetNuiFocus()`

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
| Communication | Lua → SendNUIMessage → React | FiveM's standard NUI pattern |
| Actions | callLua → EasyAdmin forward → plugin callback | Clean separation, no direct plugin NUI access |
| Dynamic updates | updatePluginPage() → SendNUIMessage | Plugins can refresh their UI reactively |
| Legacy support | Deprecation notice, coexistence during transition | Graceful migration path |
