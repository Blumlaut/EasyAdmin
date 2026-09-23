# NUI Design System

EasyAdmin's NUI is a React 19 + TypeScript single-page application that runs inside FiveM's Chromium Embedded Framework (CEF). It uses Off-Screen Rendering (OSR) mode and communicates with the Lua side through `callLua` and `on` message handlers.

## Architecture

- **Framework**: React 19 with TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS v4 utilities plus CSS custom properties (design tokens)
- **State**: React hooks, with KVP persistence for user settings
- **Communication**: `callLua` for server events, `on` for event listeners

Stylesheets load in layers: resets and tokens first, then per-component sheets, then per-page sheets, then a few utility classes with no Tailwind equivalent. Component and page styles reference design tokens rather than raw values.

## Window Sizing

The window is sized and positioned in JavaScript and applied as inline styles, not by CSS media queries.

- Default size is 1210x750 pixels
- Resizing is clamped to a minimum of 500x400 pixels
- Maximizing fills the viewport minus a small margin
- Position and size are persisted per user

Write page and layout CSS with relative units (`rem`, `em`, `%`, `vw`, `vh`) so the interface scales from 720p to 4K. Avoid hardcoded pixel sizes for anything larger than a small control.

## Design Tokens

Colours, spacing, typography and radii are defined once as CSS custom properties. Use these tokens instead of raw values.

| Group | Tokens | Purpose |
|-------|--------|---------|
| Backgrounds | `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--bg-card-hover`, `--bg-input`, `--bg-hover`, `--bg-active`, `--bg-elevated` | Panels, cards, inputs, hover and active states |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-heading` | Body copy, labels, secondary and muted text |
| Accents | `--accent-green`, `--accent-red`, `--accent-orange`, `--accent-yellow`, `--accent-blue`, `--accent-purple`, `--accent-magenta` | Status and severity colours |
| Accent backgrounds | `--bg-green`, `--bg-red`, `--bg-orange`, `--bg-blue`, `--bg-purple` | Tinted backgrounds that pair with the accents |
| Borders | `--border-color`, `--border-subtle`, `--border-hover`, `--border-glow` | Dividers, outlines, focus rings |
| Spacing | `--space-1` through `--space-32` | 4px base scale |
| Typography | `--text-xs` through `--text-3xl`, `--text-heading`, `--font-sans`, `--font-mono`, `--leading-tight`, `--leading-normal`, `--leading-relaxed` | Text sizes are in `em`, so they scale with the user's font size setting |
| Radii | `--radius-sm`, `--radius`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full` | Corners |
| Shadows | `--shadow-sm`, `--shadow`, `--shadow-lg` | Elevation |
| Z-index | `--z-topbar`, `--z-sidebar`, `--z-window`, `--z-overlay` | Stacking order |
| Transitions | `--transition-fast`, `--transition`, `--transition-slow` | Hover and open/close timing |

### Tailwind Utilities

Tailwind CSS v4 exposes the same colours, spacing steps and font sizes as utilities, so `text-fg-muted`, `gap-3` and `rounded-lg` line up with the tokens. Use Tailwind utilities for layout and spacing in markup, and the tokens above in component styles.

Tailwind only emits the utilities the NUI source actually uses. When a plugin returns a `className` for a component, prefer the classes the app itself already uses.

### Theming

Three user settings retheme the interface at runtime. They swap classes on the app root, so custom styles that reference the tokens follow along automatically.

| Setting | Effect |
|---------|--------|
| UI density | Scales the `--space-*` tokens. Values are `cramped`, `cozy`, `default`, `spacious` and `airy` |
| High contrast | Brighter text, stronger borders and darker backgrounds |
| Font size | Sets the base font size on the window; every `em`-based text token scales with it |

## Components

Plugins compose from the built-in components rather than shipping their own React components. [NUI Plugins](../../nui-plugins) lists the schema nodes and their props.

### Navigation

Icon-based navigation filtered by user permissions. Four layouts:

- **Vertical** — sidebar on the left or right
- **Horizontal** — taskbar at the top or bottom

### Buttons

| Variant | Usage |
|---------|-------|
| `btn-primary` | Main actions |
| `btn-secondary` | Outlined, less prominent actions |
| `btn-danger` | Destructive actions (ban, kick) |
| `btn-warning` | Actions that need attention |
| `btn-success` | Confirmations |
| `btn-ghost` | Borderless actions in dense layouts |

Size modifiers are `btn-sm` and `btn-lg`, and `btn-icon` drops the label. `server-action-btn` is a separate control for player and server action buttons, not a variant of `btn`.

### Modals

Confirmation dialogs, prompts and warnings render through a modal provider as siblings of the main window, so they are not clipped by it. Form modals support `text`, `textarea`, `number`, `slider`, `select` and `checkbox` fields.

### Notifications

Notifications are native GTA/REDM feed messages with EasyAdmin branding, sent through the Lua backend. There is no in-window toast system and no success/error/warning variants — the message text carries the meaning. A plugin schema can raise one from a button or with a `notification` node.

### Search Bar

A controlled text input. It does not debounce on its own; pages debounce the value themselves before filtering large lists.

### Pagination

First, previous, next and last buttons. There are no numbered page buttons. Used by datasets large enough to page, such as the ban list.

### Skeleton Loaders

Placeholder animations shown while data is loading.

### Charts

Built on Chart.js: bar, doughnut and time-series charts, plus stat cards for headline numbers.

## Keyboard Navigation

The NUI supports keyboard navigation for list interactions:

- Arrow keys — Navigate list items
- Enter — Select item
- Escape — Close an open modal or dropdown; otherwise folds the window (releases focus). The menu is only closed and reopened with the `/easyadmin` (`/ea`) command.

## Accessibility

- High contrast mode increases color contrast throughout the interface
- Font size is adjustable from 10 to 20 pixels
- Tab navigation is supported for all interactive elements
