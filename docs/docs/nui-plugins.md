# NUI Plugin System — Schema Reference

This is the technical reference for the runtime plugin system. For a
step-by-step guide, see [Creating a Plugin](../plugins/creating-plugins).

## Architecture

Plugins are **external FiveM resources**. They register at runtime via Lua
exports and provide declarative schema trees that EasyAdmin renders using
its built-in React components. No plugin code is ever compiled into EasyAdmin.

```
External resource
  │  exports['easyadmin']:RegisterPlugin(config)
  ▼
EasyAdmin (server)
  │  stores the registration, sends it to clients
  ▼
EasyAdmin menu
  │  renders your nav items, dashboard widgets and player tabs
  │
  │  user opens a plugin page:
  │  pluginCall(pluginId, renderAction) → schema tree
  ▼
EasyAdmin renders the schema with its own components
  │  button click → pluginCall(pluginId, action, data)
```

Rendering is pull-based. A refresh only happens when one of the plugin's own
actions runs — a page, widget or tab cannot be updated from a plugin resource
while it is open.

---

## Schema components

A render handler returns an array of nodes:

```json
[ { "type": "heading", "text": "My Page" } ]
```

An object with a `schema` array is accepted as well:

```json
{ "schema": [ { "type": "heading", "text": "My Page" } ] }
```

Every node has a `type`. These fields are shared:

| Field | Type | Applies to | Description |
|---|---|---|---|
| `type` | `string` | all nodes | Node type |
| `key` | `string` | all nodes | Optional node id, kept stable between re-renders |
| `children` | `schema[]` | `card`, `row`, `col`, `alert`, `tooltip`, `timeline-entry` | Child nodes |
| `className` | `string` | `card`, `row`, `col` | Extra EasyAdmin design-system class(es) |

### Layout

#### `card`

A styled card container.

```json
{ "type": "card", "children": [ { "type": "text", "text": "Inside a card" } ] }
```

#### `row`

Horizontal flex layout.

```json
{ "type": "row", "gap": 3, "wrap": true, "children": [ ... ] }
```

| Field | Type | Description |
|---|---|---|
| `gap` | `0\|1\|2\|3\|4` | Space between children; omitted means none |
| `wrap` | `boolean` | Allow children to wrap to the next line (default `false`) |

#### `col`

Vertical flex layout.

```json
{ "type": "col", "gap": 2, "children": [ ... ] }
```

| Field | Type | Description |
|---|---|---|
| `gap` | `0\|1\|2\|3\|4` | Space between children; omitted means none |

#### `divider`

Horizontal rule. No fields.

```json
{ "type": "divider" }
```

### Text

#### `heading`

```json
{ "type": "heading", "text": "My Page", "level": 2 }
```

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Heading text (required) |
| `level` | `1\|2\|3\|4` | Heading size (default `3`) |

#### `text`

```json
{ "type": "text", "text": "Some text", "variant": "muted" }
```

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Text content (required) |
| `variant` | `string` | `default`, `muted`, `small`, `large`, `mono` (default `default`) |

### Interactive

#### `button`

Calls a Lua handler when clicked. If the handler returns a schema, the view
re-renders with it. Otherwise the original `renderAction` is re-fetched.

```json
{ "type": "button", "label": "Refresh", "action": "refresh", "icon": "refresh", "variant": "ghost", "size": "sm" }
```

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Button text (required) |
| `action` | `string` | Handler action name (required) |
| `data` | `any` | Payload sent to handler |
| `server` | `boolean` | Route to server-side handler (default `false`) |
| `modal` | `object` | Open a form modal instead — see below |
| `icon` | `string` | Icon name |
| `variant` | `string` | `primary`, `secondary`, `ghost`, `danger` (default `ghost`) |
| `size` | `string` | `xs`, `sm`, `md` (default `md`) |
| `disabled` | `boolean` | Disabled state (default `false`) |

##### Form-modal buttons

Add a `modal` object to open a form dialog instead of calling the action
right away:

```json
{
  "type": "button", "label": "Kick Player", "action": "kickPlayer", "server": true,
  "modal": {
    "title": "Kick Player",
    "description": "Optional supporting text",
    "submitLabel": "Kick",
    "submitVariant": "danger",
    "fields": [
      { "type": "text", "key": "reason", "label": "Reason", "placeholder": "Why?", "maxLength": 120, "required": true, "description": "Shown under the field" }
    ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Dialog title (required) |
| `description` | `string` | Text shown under the title |
| `fields` | `field[]` | Form fields (required) |
| `submitLabel` | `string` | Submit button text (default `Submit`) |
| `submitVariant` | `string` | `primary`, `secondary`, `danger`, `warning`, `success` (default `primary`) |

On submit the modal closes and the action runs with the form values as its
`data` payload, keyed by each field's `key`.

##### Modal field types

Every field needs a `key`, and may also set `label`, `description` and
`required`.

| `type` | Extra fields |
|---|---|
| `text` | `placeholder`, `initialValue`, `maxLength` |
| `textarea` | `placeholder`, `initialValue`, `maxLength`, `rows` |
| `number` | `placeholder`, `initialValue`, `min`, `max`, `step` |
| `slider` | `min`, `max` (both required), `initialValue`, `step` |
| `select` | `options` (required), `placeholder`, `initialValue` |
| `checkbox` | `initialValue` |

```json
{ "type": "select", "key": "weapon", "label": "Weapon", "options": [ { "value": "pistol", "label": "Pistol" } ] }
```

#### `copy-button`

Copy-to-clipboard button.

```json
{ "type": "copy-button", "value": "hello", "label": "Copy" }
```

| Field | Type | Description |
|---|---|---|
| `value` | `string` | Text to copy (required) |
| `label` | `string` | Button text |

#### `notification`

Fires a native notification when the node appears or its text changes. The
node itself renders nothing.

```json
{ "type": "notification", "text": "Data reloaded" }
```

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Notification message (required) |

### Data display

#### `stat-card`

Metric card with icon.

```json
{ "type": "stat-card", "label": "Players", "value": "8", "icon": "users", "iconColor": "var(--accent-green)", "bgColor": "var(--bg-green)" }
```

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Metric label (required) |
| `value` | `string\|number` | Metric value (required) |
| `subValue` | `string` | Optional sub-text |
| `icon` | `string` | Icon name (required) |
| `iconColor` | `string` | CSS color, use `var(--...)` (required) |
| `bgColor` | `string` | CSS color, use `var(--...)` (required) |

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

| Row field | Type | Description |
|---|---|---|
| `key` | `string` | Row label (required) |
| `value` | `string` | Row value (required) |
| `mono` | `boolean` | Render the value in a monospace font |
| `action` | `string` | Handler called when the row is clicked. Client-side, with no payload |
| `actionLabel` | `string` | Hint text next to a clickable value |

#### `alert`

Alert banner.

```json
{ "type": "alert", "variant": "warning", "title": "Heads up", "children": [ ... ] }
```

| Field | Type | Description |
|---|---|---|
| `variant` | `string` | `info`, `warning`, `success`, `error` (default `info`) |
| `title` | `string` | Alert title |
| `children` | `schema[]` | Alert body |

#### `badge`

Small status badge.

```json
{ "type": "badge", "text": "Online", "variant": "online", "icon": "check-circle" }
```

| Field | Type | Description |
|---|---|---|
| `text` | `string` | Badge text (required) |
| `variant` | `string` | `default`, `online`, `offline`, `admin`, `warning` (default `default`) |
| `icon` | `string` | Icon name |

`offline` is accepted but currently renders without its own style.

#### `icon`

Standalone icon.

```json
{ "type": "icon", "name": "users", "size": "md" }
```

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Icon name (required) |
| `size` | `string` | `xs`, `sm`, `md`, `lg` (default `md`) |

#### `tooltip`

Wraps children with a hover tooltip.

```json
{ "type": "tooltip", "content": "Help text", "children": [ ... ] }
```

| Field | Type | Description |
|---|---|---|
| `content` | `string` | Tooltip text (required) |
| `children` | `schema[]` | Wrapped nodes (required) |

#### `timeline-entry`

Timeline-style entry with title, time, body, and footer.

```json
{ "type": "timeline-entry", "title": "Warning", "time": "2h ago", "footer": "Admin", "children": [ ... ] }
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Shown at the top left |
| `time` | `string` | Shown at the top right |
| `footer` | `string` | Shown at the bottom left |
| `children` | `schema[]` | Entry body |

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

| Item field | Type | Description |
|---|---|---|
| `label` | `string` | Bar label (required) |
| `value` | `number` | Bar value (required) |
| `color` | `string` | CSS color for the bar |

### Loading

#### `skeleton`

Loading placeholder.

```json
{ "type": "skeleton", "height": 48, "width": "100%" }
```

| Field | Type | Description |
|---|---|---|
| `height` | `number` | Height in pixels |
| `width` | `string\|number` | Width, as a number of pixels or any CSS length |

---

## Available icons

EasyAdmin uses **[lucide-react](https://lucide.dev/icons/)** for icons. Any
lucide icon name from the pinned version can be used as-is (kebab-case) in
schema nodes that accept an `icon` field — no extra registration needed.
Unknown names render nothing.

```json
{ "type": "button", "label": "My Action", "action": "doThing", "icon": "rocket" }
{ "type": "stat-card", "label": "Score", "value": "42", "icon": "trophy" }
{ "type": "icon", "name": "sparkles", "size": "lg" }
```

Just use the icon name as shown on [lucide.dev](https://lucide.dev/icons/) (e.g. `rocket`, `trophy`, `sparkles`, `heart`, `zap`, etc.).

### Name aliases

A few names are aliases and map to a different lucide name. All other names
are passed through unchanged.

| Schema name | lucide name |
|---|---|
| `refresh` | `refresh-cw` |
| `flag-triangle` | `flag-triangle-right` |
| `chevron-double-left` | `chevrons-left` |
| `chevron-double-right` | `chevrons-right` |
| `chevron-double-up` | `chevrons-up` |
| `chevron-double-down` | `chevrons-down` |

### Commonly-used icons

The following icons are used throughout EasyAdmin and are always available:

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

**Note:** `discord` and `github` are custom brand icons (not from lucide) and are included for convenience.

---

## Browser dev mode

`npm run dev:browser` runs the NUI outside FiveM. Mock plugin registrations
and schema responses are in `nui/src/mock/domains/plugins.mock.ts`.
