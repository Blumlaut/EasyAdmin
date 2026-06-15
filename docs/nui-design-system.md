# NUI Design System

## Principles

1. **Game-first** -- The UI overlays the game world. Translucent panels with backdrop blur keep context visible.
2. **Consistent building blocks** -- Every page is composed from shared components. No bespoke styling per page.
3. **Token-driven** -- All colors, spacing, typography, and radii come from CSS custom properties. Inline values are prohibited.
4. **Accessible by default** -- Keyboard navigation, focus rings, ARIA labels, and sufficient contrast on all interactive elements.
5. **Fast feedback** -- Optimistic updates, loading skeletons, and toast notifications keep the user informed.

## Layout

```
+---+--------------------------------------------------+
| S |                Top bar (48px)                    |
| i |  [Back]  Page title                          [...]
| d |--------------------------------------------------|
| e |                                                  |
| b |              Content area (scrollable)           |
| a |                                                  |
| r |                                                  |
|   |                                                  |
+---+--------------------------------------------------+
  |                                                       |
  260px                                                  flex:1
```

- **Sidebar** (260px): Fixed width, translucent glass panel. Contains logo, navigation items, and footer.
- **Top bar** (48px): Back button (when not on dashboard), page title, optional actions.
- **Content area**: Scrollable, padded 20px. Composed of Cards, Lists, and Forms from the component library.
- **Overlays**: ConfirmDialog, Toast -- centered or top-right, translucent with blur.

## Design Tokens

All tokens are defined as CSS custom properties in `index.css`. Components must reference tokens, never raw values.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-dark` | `#0a0e1a` | Deepest brand color (logo bg, footer) |
| `--brand-blue` | `#1e56d0` | Primary brand blue |
| `--brand-blue-light` | `#3b82f6` | Interactive blue (links, active states) |
| `--brand-blue-glow` | `rgba(59,130,246,0.25)` | Glow/shadow accent |
| `--bg-primary` | `rgba(10,14,26,0.75)` | Main content background |
| `--bg-secondary` | `rgba(15,20,35,0.65)` | Sidebar, top bar background |
| `--bg-tertiary` | `rgba(30,38,56,0.5)` | Cards, input backgrounds |
| `--bg-hover` | `rgba(50,60,80,0.5)` | Hover state |
| `--bg-active` | `rgba(59,130,246,0.15)` | Active/selected state |
| `--border-color` | `rgba(60,70,90,0.4)` | Default borders |
| `--border-glow` | `rgba(59,130,246,0.3)` | Focused/glowing borders |
| `--text-primary` | `#f0f6fc` | Main text |
| `--text-secondary` | `#9aa5b4` | Secondary text, labels |
| `--text-muted` | `#6b7a8d` | Disabled, placeholder |
| `--accent-green` | `#3fb950` | Success states |
| `--accent-red` | `#ef4444` | Danger, destructive |
| `--accent-orange` | `#f59e0b` | Warning states |
| `--accent-purple` | `#a78bfa` | Special badges (dev, contributor) |

### Spacing (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps, icon-text |
| `--space-2` | `8px` | Small padding, button inner |
| `--space-3` | `12px` | Card padding, form gaps |
| `--space-4` | `16px` | Section gaps, sidebar padding |
| `--space-5` | `20px` | Content area padding |
| `--space-6` | `24px` | Large section gaps |
| `--space-8` | `32px` | Modal padding, hero gaps |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | system stack | Body text, UI |
| `--font-mono` | SF Mono / Cascadia Code | IDs, code, hashes |
| `--text-xs` | `11px` | Badges, timestamps |
| `--text-sm` | `12px` | Labels, secondary info |
| `--text-base` | `14px` | Body text, buttons |
| `--text-lg` | `15px` | Section headers |
| `--text-xl` | `18px` | Page titles |
| `--text-2xl` | `24px` | Dashboard headings |

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Small buttons, badges |
| `--radius` | `8px` | Buttons, inputs, cards |
| `--radius-lg` | `12px` | Panels, modals |
| `--radius-xl` | `16px` | Large cards, hero sections |
| `--radius-full` | `999px` | Avatars, pill badges |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.3)` | Buttons, small cards |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.5)` | Panels, modals |
| `--shadow-glow` | `0 0 20px var(--brand-blue-glow)` | Active/focused elements |

### Z-index

| Token | Value | Usage |
|-------|-------|-------|
| `--z-sidebar` | `10` | Sidebar above content |
| `--z-topbar` | `5` | Top bar |
| `--z-overlay` | `100` | Modals, dialogs |
| `--z-toast` | `200` | Toast notifications |

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `100ms ease` | Hover, toggle |
| `--transition` | `150ms cubic-bezier(0.4,0,0.2,1)` | Default |
| `--transition-slow` | `250ms cubic-bezier(0.4,0,0.2,1)` | Page transitions, modals |

## Component Library

### Button

Variants: `primary`, `secondary`, `danger`, `ghost`, `icon`.
Sizes: `sm`, `md` (default), `lg`.

```tsx
<Button variant="primary" size="md">Kick Player</Button>
<Button variant="danger">Ban</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="icon" aria-label="Close">X</Button>
```

Rules:
- All buttons have visible focus ring (`--border-glow` box-shadow)
- `:disabled` state: `opacity: 0.5`, `cursor: not-allowed`
- `:active` state: `scale(0.97)`
- Icon buttons are square (width = height = padding * 2 + icon size)

### Badge

Variants: `online`, `offline`, `frozen`, `muted`, `dev`, `contributor`, `default`.

```tsx
<Badge variant="online">Online</Badge>
<Badge variant="frozen">Frozen</Badge>
```

Rules:
- Pill shape (`--radius-full`)
- Font size `--text-xs`, weight 600
- Subtle background tint with contrasting text

### Input

```tsx
<Input placeholder="Search players..." value={q} onChange={setQ} />
```

Rules:
- Border `--border-color`, focus border `--border-glow` with glow shadow
- Background `--bg-tertiary`
- Height 36px, padding `--space-2` horizontal

### Card

```tsx
<Card title="Player Info">
  <PlayerDetails player={player} />
</Card>
```

Rules:
- Background `--bg-tertiary` with `--blur`
- Border `1px solid var(--border-color)`
- Border-radius `--radius-lg`
- Padding `--space-4`
- Shadow `--shadow-sm`

### List / ListItem

Used for player lists, ban lists, report lists.

```tsx
<List>
  {players.map(p => (
    <ListItem key={p.id} active={selected === p.id} onClick={() => select(p)}>
      <ListItem.Avatar src={p.avatar} />
      <ListItem.Content>
        <ListItem.Title>{p.name}</ListItem.Title>
        <ListItem.Subtitle>#{p.id} -- {p.job}</ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Badges>
        <Badge variant={p.frozen ? "frozen" : "online"} />
      </ListItem.Badges>
    </ListItem>
  ))}
</List>
```

Rules:
- Hover: `--bg-hover` background
- Active: `--bg-active` background with left blue accent bar (3px solid `--brand-blue-light`)
- Padding `--space-3` vertical, `--space-4` horizontal
- Divider between items: `1px solid var(--border-color)`

### Dialog (ConfirmDialog)

```tsx
<Dialog
  open={open}
  title="Kick Player?"
  description="This will remove Alice from the server."
  confirmLabel="Kick"
  cancelLabel="Cancel"
  variant="danger"
  onConfirm={handleKick}
  onCancel={close}
/>
```

Rules:
- Centered, max-width 420px
- Background `--bg-secondary` with `--blur`
- Border `1px solid var(--border-color)`
- Focus trapped inside when open
- Escape key closes
- Backdrop click closes

### Toast

```tsx
<Toast message="Player kicked" type="success" />
```

Rules:
- Top-right corner, `--space-4` from edges
- Stack vertically with `--space-2` gap
- Auto-dismiss after 3s with fade-out
- Slide-in animation on appear
- Max width 360px

### Avatar

```tsx
<Avatar name="Alice" size="sm" />
```

Rules:
- Circular (`--radius-full`)
- Sizes: `xs` (24px), `sm` (32px), `md` (40px), `lg` (48px)
- Initials if no image, colored from name hash
- Background `--bg-tertiary`, text `--text-secondary`

### Skeleton

Loading placeholder for async content.

```tsx
<Skeleton width="100%" height={40} />
<Skeleton circular size={40} />
```

Rules:
- Background `--bg-tertiary`
- Shimmer animation (left-to-right gradient sweep)
- Same dimensions as the content it replaces

### Icon

Wrapper for inline SVG icons. Uses a shared icon map.

```tsx
<Icon name="user" size="sm" />
<Icon name="shield" />
<Icon name="x" />
```

Rules:
- Sizes: `xs` (14px), `sm` (16px), `md` (20px), `lg` (24px)
- Color inherits from parent `currentColor`
- All icons are inline SVGs in a single `icons.ts` file

## Accessibility

1. **Focus management**: All interactive elements have visible focus ring using `outline: 2px solid var(--brand-blue-light)` with `outline-offset: 2px`.
2. **Keyboard navigation**: Tab order follows visual order. Arrow keys for lists. Escape for modals.
3. **ARIA**: Dialogs use `role="dialog"`, lists use `role="list"`, buttons have `aria-label` when icon-only.
4. **Color contrast**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
5. **Reduced motion**: Respect `prefers-reduced-motion` to disable animations.

## Enforcing Tokens (Linting)

### ESLint: no inline styles

Custom rule `no-inline-styles` prohibits `style={{}}` in JSX. All styling must use CSS classes or token references.

Exceptions: dynamic values that genuinely can't be pre-styled (e.g. `width: ${playerCount}%`). These require a `// eslint-disable-next-line nui/no-inline-styles -- <reason>` comment.

### ESLint: token usage

Custom rule `require-token` ensures CSS values in `.css` files reference `var(--token)` or are defined as tokens themselves. Raw hex/rgb values outside the `:root` block are flagged.

### Build-time check

`npm run check` runs lint + typecheck + test. CI blocks merges if any check fails.

## Page Templates

Every new page follows this pattern:

```tsx
function BanListPage() {
  const [bans, setBans] = useState<Ban[]>([])
  const loading = !bansFetched

  return (
    <PageContainer>
      <SearchBar value={query} onChange={setQuery} placeholder="Search bans..." />
      {loading ? (
        <SkeletonList count={8} />
      ) : (
        <List>
          {bans.map(ban => (
            <BanListItem key={ban.id} ban={ban} />
          ))}
        </List>
      )}
    </PageContainer>
  )
}
```

Rules:
- Page is a single export component
- Uses `PageContainer` (provides padding and scroll)
- Loading state uses `Skeleton` components matching final layout
- Data fetching via `callLua` in `useEffect`
- Search/filter at top of content area

## RedM Support

When `redm: true` is in the menu state, swap brand tokens:

| Token | RedM Value |
|-------|-----------|
| `--brand-dark` | `#1a0a0a` |
| `--brand-blue` | `#8b4513` |
| `--brand-blue-light` | `#cd853f` |
| `--brand-blue-glow` | `rgba(205,133,63,0.25)` |

Implemented via a `.redm` class on `#root` that overrides tokens.
