# NUI Design System

EasyAdmin's NUI is a React 18 + TypeScript single-page application that runs inside FiveM's Chromium Embedded Framework (CEF). It uses Off-Screen Rendering (OSR) mode and communicates with the Lua side via `callLua` and `on` message handlers.

## Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS custom properties (CSS variables) for theming
- **State**: React hooks with KVP persistence for user settings
- **Communication**: `callLua` for server events, `on` for event listeners

## Window Sizing

The NUI window uses responsive sizing to scale across different resolutions:

- Width: `min(92vw, 1210px)` — scales with viewport, caps at 1210px
- Height: `min(85vh, 750px)` — scales with viewport, caps at 750px

Default window size is 1210x750 pixels. Users can resize and reposition the window; settings are persisted via KVP.

## CSS Custom Properties

The design system uses CSS custom properties for consistent theming. Key variables:

| Variable | Purpose |
|----------|---------|
| `--color-bg` | Background color |
| `--color-surface` | Card/surface background |
| `--color-text` | Primary text color |
| `--color-muted` | Muted/secondary text |
| `--color-primary` | Primary accent color |
| `--color-danger` | Danger/error color |
| `--color-success` | Success color |
| `--color-warning` | Warning color |
| `--color-modal-border` | Modal/dialog border color |
| `--border-radius-normal` | Standard border radius |
| `--font-size-base` | Base font size (user-adjustable) |

## Components

### Navigation

Left sidebar with icon-based navigation. Supports two modes:

- **Vertical** — Sidebar on the left (default)
- **Horizontal** — Sidebar on top

Navigation items are dynamically filtered based on user permissions.

### Cards

Container components with subtle borders and padding. Used throughout the NUI for grouping related content.

### Buttons

| Type | Usage |
|------|-------|
| Primary | Main actions |
| Server action | Player/server action buttons |
| Danger | Destructive actions (ban, kick) |
| Secondary | Outlined/less prominent actions |

### Toast Notifications

Non-blocking notifications that appear at the bottom-right of the window. Types: success, error, warning, info.

### Modal Dialogs

Full-screen overlay modals for confirmation dialogs and warnings. Rendered via `ModalProvider` as siblings of the main window.

### Search Bar

Debounced search input for filtering lists (ban list, player list, etc.).

### Pagination

Numeric pagination for large data sets (ban list, reports).

### Skeleton Loaders

Placeholder animations shown while data is loading.

## Keyboard Navigation

The NUI supports keyboard navigation for list interactions:

- Arrow keys — Navigate list items
- Enter — Select item
- Escape — Go back / close modal

## Accessibility

- High contrast mode increases color contrast throughout the interface
- Font size is adjustable from 10 to 20 pixels
- Tab navigation is supported for all interactive elements
