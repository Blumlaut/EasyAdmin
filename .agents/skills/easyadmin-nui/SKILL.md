---
name: easyadmin-nui
description: >
  Build and modify the EasyAdmin NUI (React + TypeScript frontend running in FiveM's CEF browser).
  Covers NUI communication with Lua, component architecture, design system, modal system,
  and CEF rendering quirks. Use when creating or editing NUI pages, components, hooks, styles,
  or anything under nui/src/.
---

# EasyAdmin NUI Development

The NUI is a React + TypeScript app (Vite) running inside FiveM's Chromium Embedded Framework. It communicates with the Lua backend via JSON messages.

## NUI ↔ Lua Communication

All data flow between the NUI frontend and Lua backend goes through a dedicated communication layer (see `nui/src/fivem.ts`):

- **Call Lua callbacks** — POST a JSON request to the Lua backend and await a response
- **Listen for server-pushed messages** — subscribe to named events sent via `SendNUIMessage`
- **Message shape** — all inbound messages carry `{ action: string, data: T }`

Never use raw `fetch` or `window.addEventListener` directly — use the exported helpers.

## Project Structure

```
nui/src/
  components/       # Reusable UI components (one .tsx per component)
  hooks/            # Shared custom hooks
  modals/           # Modal system (builder, types, context)
  pages/            # Feature pages (one directory per feature)
    Players/        #   PlayerListPage, PlayerDetailPage, sections, etc.
    Bans/           #   BanListPage, BanDetailPage
    Reports/        #   ReportListPage, ReportDetailPage
    ...
  styles/           # CSS organized by concern
    tokens.css      # Design tokens — single source of truth for all values
    components/     # One CSS file per component
    pages/          # Page-specific styles only
    utilities.css   # Utility classes (flex, gap, text, etc.)
  types.ts          # Shared TypeScript interfaces
```

## Component Rules

1. **Everything reusable lives in `components/`** — before writing a new UI element, check if an existing component can be configured to fit. If not, create a new generic component (e.g. `Alert` not `EasyAdminUpdateAlert`).
2. **Each component gets its own CSS file** in `styles/components/` and is imported in `styles/index.css`.
3. **Components accept props for variation** — variants, sizes, icons, actions, callbacks. Keep them configurable, not hardcoded.
4. **Pages compose components** — page files in `pages/` should orchestrate reusable components and hooks, not contain standalone UI logic.

## Page Structure

Each feature gets its own directory under `pages/`. Pages are never monolithic — break them into smaller files as soon as a single file would exceed ~150 lines or contain multiple distinct sections.

- **Entry files** are named `*Page.tsx` (e.g. `PlayerListPage`, `PlayerDetailPage`) and serve as the top-level composition point
- **Sections and panels** live alongside the entry file in the same directory (e.g. `PlayerInfoPanel.tsx`, `ActionHistorySection.tsx`)
- **Page-specific sub-components stay in the page directory** — only truly reusable elements (used across multiple features) belong in `components/`

## Hooks

Shared behavior lives in `hooks/`. Common patterns include debounced input, keyboard navigation, focus trapping, click-outside detection, and singleton state stores. Check existing hooks before writing custom logic.

## Design System

- **All values come from CSS custom properties** defined in `styles/tokens.css` — colors, spacing, typography, radius, shadows, z-index, transitions. No raw pixel/hex values in component styles.
- **Utility classes** in `utilities.css` cover common layouts (`flex`, `gap-*`, `text-*`, `truncate`, etc.). Prefer utilities over custom CSS for simple arrangements.
- **Text sizes use `em`** so they scale with the root font size (adjustable via settings).
- **High contrast mode** is supported via a `.high-contrast` class that overrides tokens — component CSS should respect token overrides, not hardcode colors.
- **Never use hardcoded `px` for layout dimensions** — use viewport-relative units (`vw`, `vh`) with `min()` caps, or CSS custom properties.

## Modal System

The app uses a context-driven modal system:

- A provider wraps the app and exposes `openModal()` / `closeModal()`
- **Form modals** are data-driven — pass a definition (title, fields, submit handler) and the builder renders everything
- **Custom modals** accept arbitrary JSX via a render function
- A shared dialog wrapper handles overlay, focus trapping, and backdrop dismissal

Use the modal context from any component — don't build standalone modal stacks.

## CEF Rendering Quirks

The NUI runs in Chromium Embedded Framework, which has critical rendering bugs. **All CSS changes require in-game testing.**

| Rule | Why |
|---|---|
| **Never use `transform` inside `@keyframes`** | Full element invisibility — DOM exists but nothing paints |
| **Avoid `animation` on modal/overlay elements** | Triggers the same compositing bug |
| **Keep `box-shadow` blur small** (`0 4px 16px` max) | Large blur values (`32px+`) render elements invisible |
| **`backdrop-filter: blur()` is safe** | Works reliably at `blur(4-8px)` |
| **Use `transition` instead of `@keyframes` for enter/exit** | Transitions are CEF-safe |

## Testing

Components and hooks ship with Vitest tests (`.test.tsx` / `.test.ts` alongside the source). New components with non-trivial logic should include tests.

## Types

Shared interfaces live in `types.ts`. Add new cross-cutting types there rather than duplicating inline.
