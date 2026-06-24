# NUI Plugin System — Schema Reference

This is the technical reference for the runtime plugin system. For a
step-by-step guide, see [Creating a Plugin](plugins/creating-plugins).

## Architecture

Plugins are **external FiveM resources**. They register at runtime via Lua
exports and provide declarative schema trees that EasyAdmin renders using
its built-in React components. No plugin code is ever compiled into EasyAdmin.

```
External resource
  │  exports['easyadmin']:RegisterPlugin(config)
  ▼
EasyAdmin (shared/plugin_api.lua)
  │  stores registration, networks to clients
  ▼
NUI (React)
  │  receives registration via SendNUIMessage
  │  renders nav items, dashboard widgets, player tabs
  │
  │  user opens a plugin page:
  │  pluginCall(pluginId, renderAction) → schema tree
  ▼
SchemaRenderer
  │  maps schema nodes to built-in components
  │  button click → pluginCall(pluginId, action, data)
```

## NUI source files

| File | Purpose |
|---|---|
| `nui/src/plugins/schema.ts` | Schema node type definitions |
| `nui/src/plugins/types.ts` | Runtime plugin registration types |
| `nui/src/plugins/store.ts` | Plugin registry + NUI message listeners |
| `nui/src/plugins/usePlugins.ts` | Hook: collects & permission-filters contributions |
| `nui/src/plugins/usePluginSchema.ts` | Hook: fetches & manages schema from Lua |
| `nui/src/plugins/SchemaRenderer.tsx` | Maps schema nodes → built-in components |
| `nui/src/plugins/hosts.tsx` | Page/widget/tab host components |
| `nui/src/plugins/bridge.ts` | `pluginCall` Lua bridge |

## Lua source files

| File | Purpose |
|---|---|
| `shared/plugin_api.lua` | `RegisterPlugin` export, NUI sync, client networking |
| `client/nui/plugins.lua` | `pluginCall` NUI callback, client handler dispatch |
| `server/_plugin_bridge.lua` | Server handler dispatch |

---

## Schema components

Every render handler returns an array of schema nodes. Each node has a
`type` field that determines which built-in component is rendered.

### Layout

#### `card`

A styled card container.

```json
{ "type": "card", "children": [ ... ] }
```

#### `row`

Horizontal flex layout.

```json
{ "type": "row", "gap": 3, "wrap": true, "children": [ ... ] }
```

| Field | Type | Default | Description |
|---|---|---|---|
| `gap` | `0\|1\|2\|3\|4` | — | Spacing between children |
| `wrap` | `boolean` | `false` | Allow wrapping |

#### `col`

Vertical flex layout.

```json
{ "type": "col", "gap": 2, "children": [ ... ] }
```

#### `divider`

Horizontal rule.

```json
{ "type": "divider" }
```

### Text

#### `heading`

```json
{ "type": "heading", "text": "My Page", "level": 2 }
```

| Field | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Heading text |
| `level` | `1\|2\|3\|4` | `3` | Heading size |

#### `text`

```json
{ "type": "text", "text": "Some text", "variant": "muted" }
```

| Field | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Text content |
| `variant` | `string` | `default` | `default`, `muted`, `small`, `large`, `mono` |

### Interactive

#### `button`

Calls a Lua handler when clicked. If the handler returns a schema, the view
re-renders with it. Otherwise the original `renderAction` is re-fetched.

```json
{ "type": "button", "label": "Refresh", "action": "refresh", "icon": "refresh", "variant": "ghost", "size": "sm" }
```

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Button text |
| `action` | `string` | — | Handler action name |
| `data` | `any` | — | Payload sent to handler |
| `server` | `boolean` | `false` | Route to server-side handler |
| `icon` | `string` | — | Icon name |
| `variant` | `string` | `ghost` | `primary`, `secondary`, `ghost`, `danger` |
| `size` | `string` | `md` | `xs`, `sm`, `md` |
| `disabled` | `boolean` | `false` | Disabled state |

#### `copy-button`

Copy-to-clipboard button.

```json
{ "type": "copy-button", "value": "hello", "label": "Copy" }
```

### Data display

#### `stat-card`

Metric card with icon.

```json
{ "type": "stat-card", "label": "Players", "value": "8", "icon": "users", "iconColor": "var(--accent-green)", "bgColor": "var(--bg-green)" }
```

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Metric label |
| `value` | `string\|number` | Metric value |
| `subValue` | `string?` | Optional sub-text |
| `icon` | `string` | Icon name |
| `iconColor` | `string` | CSS color (use `var(--...)`) |
| `bgColor` | `string` | CSS color (use `var(--...)`) |

#### `key-value-table`

Key-value pairs table. Rows with an `action` are clickable.

```json
{
  "type": "key-value-table",
  "rows": [
    { "key": "Name", "value": "John" },
    { "key": "License", "value": "abc123", "mono": true, "action": "revoke", "actionLabel": "Revoke" }
  ]
}
```

#### `alert`

Alert banner.

```json
{ "type": "alert", "variant": "warning", "title": "Heads up", "children": [ ... ] }
```

`variant`: `info`, `warning`, `success`, `error`.

#### `badge`

Small status badge.

```json
{ "type": "badge", "text": "Online", "variant": "online", "icon": "check-circle" }
```

`variant`: `default`, `online`, `offline`, `admin`, `warning`.

#### `icon`

Standalone icon.

```json
{ "type": "icon", "name": "users", "size": "md" }
```

`size`: `xs`, `sm`, `md`, `lg`.

#### `tooltip`

Wraps children with a hover tooltip.

```json
{ "type": "tooltip", "content": "Help text", "children": [ ... ] }
```

#### `timeline-entry`

Timeline-style entry with title, time, body, and footer.

```json
{ "type": "timeline-entry", "title": "Warning", "time": "2h ago", "footer": "Admin", "children": [ ... ] }
```

### Charts

#### `bar-chart`

Horizontal bar chart.

```json
{
  "type": "bar-chart",
  "items": [
    { "label": "Mon", "value": 12 },
    { "label": "Tue", "value": 8, "color": "var(--accent-orange)" }
  ]
}
```

### Loading

#### `skeleton`

Loading placeholder.

```json
{ "type": "skeleton", "height": 48, "width": "100%" }
```

---

## Available icons

`users` `shield` `settings` `server` `alert-triangle` `x` `search`
`chevron-left` `chevron-right` `chevron-down` `chevron-up`
`chevron-double-left` `chevron-double-right` `chevron-double-up`
`chevron-double-down` `arrow-left` `arrow-right` `zap` `eye` `map-pin`
`snowflake` `volume-x` `volume-2` `camera` `ban` `log-out` `clock`
`calendar` `star` `menu` `home` `archive` `plus` `edit` `trash` `trash-2`
`check` `refresh` `message-square` `globe` `flag` `flag-triangle`
`activity` `gauge` `layers` `box` `user-minus` `external-link`
`arrow-up-circle` `play` `square` `code` `git-branch` `layout-grid`
`compass` `sliders` `mouse-pointer-click` `grip-vertical` `chart-bar`
`maximize` `minimize` `history` `book-open` `info` `check-circle`
`alert-circle` `download` `trending-up` `arrow-down-circle` `hard-drive`
`database` `loader-2` `discord` `github`

---

## Browser dev mode

`npm run dev:browser` runs the NUI outside FiveM. Mock plugin registrations
and schema responses are in `nui/src/mock/domains/plugins.mock.ts`.
