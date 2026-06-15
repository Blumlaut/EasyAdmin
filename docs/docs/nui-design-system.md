# NUI Design System

All design tokens, component styles, and layout rules live in source code. This doc is a reference guide pointing to the actual definitions.

## Source Files

| What | File |
|------|------|
| **Design tokens** (colors, spacing, typography, radius, shadows, z-index, transitions) | [`nui/src/styles/index.css`](../../nui/src/styles/index.css) — `:root` block |
| **RedM theme overrides** | same file — `.redm` block |
| **Base reset, focus ring, scrollbar, selection** | same file |
| **Layout shell** (sidebar, topbar, main content, window) | same file — `.ea-window`, `.sidebar`, `.topbar`, `.main-content` |
| **Shared types** (Player, Ban, Report, etc.) | [`nui/src/types.ts`](../../nui/src/types.ts) |
| **NUI communication** (callLua, on) | [`nui/src/fivem.ts`](../../nui/src/fivem.ts) |
| **App root, state, navigation** | [`nui/src/App.tsx`](../../nui/src/App.tsx) |
| **Modal context** | [`nui/src/ModalContext.tsx`](../../nui/src/ModalContext.tsx) |
| **Icons** | [`nui/src/components/icons.tsx`](../../nui/src/components/icons.tsx) |

## Component Styles

All components are styled via CSS classes in [`index.css`](../../nui/src/styles/index.css). See the component source for usage patterns.

| Component | Styles (CSS) | Source |
|-----------|-------------|--------|
| **Button** (primary, secondary, danger, warning, ghost, icon, sizes) | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-warning`, `.btn-ghost`, `.btn-sm`, `.btn-lg`, `.btn-icon` | [`components/`](../../nui/src/components/) (used inline) |
| **Input** | `.input`, `.input:focus`, `.search-wrapper`, `.search-input` | [`components/SearchBar.tsx`](../../nui/src/components/SearchBar.tsx), [`components/InputPrompt.tsx`](../../nui/src/components/InputPrompt.tsx) |
| **Badge** (online, offline, frozen, muted, dev, contributor, danger, green) | `.badge`, `.badge-online`, `.badge-frozen`, etc. | Used across pages |
| **Card** | `.card`, `.card-header`, `.card-title`, `.card-body` | Used across pages |
| **List / ListItem** | `.list`, `.list-item`, `.list-item-active`, `.list-item-content`, `.list-item-title`, `.list-item-subtitle`, `.list-item-meta` | Used across pages |
| **Avatar** (xs, sm, md, lg) | `.avatar`, `.avatar-xs`, `.avatar-sm`, `.avatar-md`, `.avatar-lg` | Used across pages |
| **Dialog** | `.dialog-overlay`, `.dialog`, `.dialog-title`, `.dialog-description`, `.dialog-actions` | [`components/ConfirmDialog.tsx`](../../nui/src/components/ConfirmDialog.tsx) |
| **Toast** (info, success, error) | `.toast-container`, `.toast`, `.toast-info`, `.toast-success`, `.toast-error` | [`components/Toast.tsx`](../../nui/src/components/Toast.tsx) |
| **Skeleton** | `.skeleton`, `.skeleton-circle`, `@keyframes shimmer` | [`components/Skeleton.tsx`](../../nui/src/components/Skeleton.tsx) |
| **Navigation** | `.nav-item`, `.nav-item-active`, `.nav-item-label`, `.nav-item-badge` | [`components/Navigation.tsx`](../../nui/src/components/Navigation.tsx) |
| **Slider** | `.slider`, `.slider::-webkit-slider-thumb` | [`components/SliderInput.tsx`](../../nui/src/components/SliderInput.tsx) |
| **Toggle** | `.toggle`, `.toggle-slider`, `.toggle-row` | Used in Settings page |
| **Pagination** | — | [`components/Pagination.tsx`](../../nui/src/components/Pagination.tsx) |
| **KeyValueTable** | `.kv-row-divider`, `.kv-key` | [`components/KeyValueTable.tsx`](../../nui/src/components/KeyValueTable.tsx) |
| **Spinner** | `.spinner`, `@keyframes spin` | Used across pages |
| **Glass panel** | `.glass` | Utility class |
| **Section label** | `.section-label` | Utility class |
| **Empty state** | `.empty-state` | Used across pages |

## Utility Classes

[`index.css`](../../nui/src/styles/index.css) includes utility classes for common patterns:

- **Text**: `.text-primary`, `.text-secondary`, `.text-muted`, `.text-xs`–`.text-2xl`, `.text-mono`, `.font-bold`, `.font-semibold`, `.font-medium`, `.text-gradient`, `.text-green`, `.text-red`, `.text-orange`, `.text-yellow`
- **Flex**: `.flex`, `.flex-col`, `.flex-wrap`, `.items-center`, `.items-start`, `.justify-between`, `.justify-end`, `.justify-center`, `.flex-1`, `.shrink-0`
- **Gap**: `.gap-1`–`.gap-8`
- **Grid**: `.grid`, `.grid-cols-2`–`.grid-cols-4`
- **Dimensions**: `.w-full`, `.h-full`, `.max-w-sm`, `.max-w-md`, `.max-w-lg`, `.min-h-sm`, `.min-w-0`
- **Position**: `.absolute`, `.fixed`, `.inset-0`, `.top-0`, `.left-0`
- **Overflow**: `.overflow-hidden`, `.overflow-auto`, `.overflow-y-auto`
- **Misc**: `.truncate`, `.hidden`, `.self-center`, `.mt-1`–`.mt-3`, `.mb-2`, `.mb-3`, `.ml-auto`

## Pages

Each page is a self-contained component under `nui/src/pages/`:

| Page | Directory | Description |
|------|-----------|-------------|
| Dashboard | [`pages/Dashboard/`](../../nui/src/pages/Dashboard/) | Stats overview, recent activity |
| Players | [`pages/Players/`](../../nui/src/pages/Players/) | Player list, search, actions (kick, ban, warn, slap, etc.) |
| Bans | [`pages/Bans/`](../../nui/src/pages/Bans/) | Ban list, search, pagination, unban |
| Reports | [`pages/Reports/`](../../nui/src/pages/Reports/) | Report list, claim/close, severity colors |
| Server | [`pages/Server/`](../../nui/src/pages/Server/) | Resource management, announce, cleanup |
| Settings | [`pages/Settings/`](../../nui/src/pages/Settings/) | TTS, menu config, screenshot settings |

## Hooks

| Hook | File | Description |
|------|------|-------------|
| `useDebounce` | [`hooks/useDebounce.ts`](../../nui/src/hooks/useDebounce.ts) | Debounced value for search inputs |
| `usePagination` | [`hooks/usePagination.ts`](../../nui/src/hooks/usePagination.ts) | Paginated data with page size controls |

## RedM Support

Apply `.redm` class to `#root` to swap brand tokens. See `.redm` block in [`index.css`](../../nui/src/styles/index.css).

## Accessibility

- **Focus ring**: Global `:focus-visible` rule using `--brand-blue-light` outline
- **Reduced motion**: `@media (prefers-reduced-motion)` resets all animations/transitions
- **ARIA**: Dialogs use `role="dialog"`, interactive elements have labels
- **Color contrast**: All text meets WCAG AA minimums

## Rules

1. **Token-driven** — All values come from CSS custom properties in `:root`. No raw hex/rgb in component styles.
2. **No inline styles** — Use CSS classes or token references. Dynamic values need an eslint-disable comment with justification.
3. **No `transform` in `@keyframes`** — CEF rendering bug causes full element invisibility.
4. **No `animation` on modals/overlays** — Triggers CEF compositing bugs. Use transitions instead.
5. **Viewport-relative dimensions** — Use `vw`/`vh`/`min()` for layout. No hardcoded pixel widths for the main window.
