# NUI React Rewrite

Replace the NativeUI-based menu system with a React-based NUI frontend.

## Status

**Branch:** `nui-react-poc`
**Toggle:** `set ea_useNUI true` (default: false, NativeUI unchanged)

## What Is Built

### React Frontend (`nui/`)

- React 18 + Vite 6 + TypeScript, strict mode
- `fivem.ts` - NUI communication layer (`callLua` for callbacks, `on` for push messages)
- `types.ts` - Shared types (Player, Permissions as `Record<string, boolean>`, NUI messages)
- `App.tsx` - Root component with state management, navigation stack, view routing
- `Navigation.tsx` - Sidebar with player count badge, active state, disabled future sections
- `PlayerList.tsx` - Searchable player table (name, ID, identifier, license, discord), status badges (frozen, muted, dev, contrib)
- `PlayerActions.tsx` - Per-player action panel with info card and action cards:
  - Quick actions: Spectate, Teleport To, Teleport Here, Screenshot, Freeze/Unfreeze, Mute/Unmute
  - Kick with reason input
  - Ban with reason input and duration selector (6h, 12h, 1d, 3d, 1w, 2w, 1m, permanent)
  - Warn with reason input
  - Slap with damage slider (10-500)
  - All destructive actions gated by confirmation dialog
- `ConfirmDialog.tsx` - Modal with backdrop blur
- `Toast.tsx` - Toast notifications (info, success, error)
- `styles/index.css` - Dark theme with CSS variables, custom scrollbar, animations
- Production build: 165KB total, ~53KB gzipped

### Lua Backend (`client/gui_nui.lua`)

- `buildPlayerList()` - Reuses existing `playerlist`, builds clean JSON for frontend
- `buildPermissions()` - Passes raw `permissions` table (no hardcoded lists)
- `toggleNui()` - Visibility/focus toggle with data refresh
- 11 `RegisterNUICallback` handlers: requestPlayers, closeMenu, kickPlayer, banPlayer, warnPlayer, slapPlayer, spectatePlayer, teleportToPlayer, teleportPlayerToMe, toggleFreeze, toggleMute, takeScreenshot
- Event listeners for `GetInfinityPlayerList`, `SetPlayerFrozen`, `SetPlayerMuted` - pushes live updates to frontend
- `/ea_nui` command always available, `/easyadmin` intercepted when `ea_useNUI` is true
- All actions reuse existing `TriggerServerEvent` calls from `gui_c.lua` / `admin_client.lua`

### Config

- `fxmanifest.lua` updated - `ui_page` points to `nui/dist/index.html`, dist files included
- `nui/.gitignore` - excludes `node_modules/`

## What Is Left

### Remaining Menus (from `gui_c.lua`)

| Menu | Complexity | Notes |
|------|-----------|-------|
| Ban list viewer | Medium | Paginated list, search, detail view, edit, offline ban |
| Report viewer | Medium | Paginated, claim/close actions, links to player menus, similar report removal |
| Server management | Medium | Resource start/stop, announce, set game type, set map name, cleanup (cars/peds/props) |
| Settings | Low | TTS toggle/speed, menu orientation/width, screenshot config, alternative title/logo |
| Cached players | Medium | Offline ban, search, detail view |

### Polish and Features

- Animations and transitions (menu open/close, view changes, list items)
- Keyboard navigation (arrow keys to select players, enter to open, escape to close)
- Virtualized player list for 100+ players (react-window or tanstack-virtual)
- RedM theming (detect game via Lua, apply theme variant in CSS)
- Accessibility (ARIA labels, focus management, screen reader support)
- Inline error states on action cards (currently only toast notifications)
- Player count badge update on join/leave (currently only updates on full list refresh)

### Plugin System

- New plugin API for NUI (replace NativeUI hooks: `mainMenu`, `playerMenu`, `serverMenu`, `settingsMenu`, `cachedMenu`, `menuRemoved`)
- Migration utility for existing plugins
- Documentation with before/after examples
- Deprecation warnings for old NativeUI-based plugin hooks

### Cleanup

- Remove NativeUI dependency from `fxmanifest.lua` (when NUI is the only UI)
- Remove `gui_c.lua` and NativeUI dependencies
- Remove old `dependencies/nui/index.html` (replaced by `nui/dist/`)
- Remove `ea_useNUI` convar toggle

## Architecture

### Directory Structure

```
EasyAdmin/
├── nui/                          # React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html                # NUI entry point
│   └── src/
│       ├── main.tsx              # React entry
│       ├── App.tsx               # Root component + state
│       ├── fivem.ts              # NUI communication layer
│       ├── types.ts              # Shared TypeScript types
│       ├── components/
│       │   ├── Navigation.tsx
│       │   ├── PlayerList.tsx
│       │   ├── PlayerActions.tsx
│       │   ├── ConfirmDialog.tsx
│       │   └── Toast.tsx
│       └── styles/
│           └── index.css
├── client/
│   ├── gui_nui.lua               # NUI menu controller
│   ├── gui_c.lua                 # Existing NativeUI (to be removed)
│   └── ...
└── fxmanifest.lua
```

### State Flow

```
Lua (source of truth)
  |
  | SendNUIMessage (push on change)
  | RegisterNUICallback (pull on request)
  v
React (UI only, no business logic)
  |
  | fetch to resource endpoint
  | window.addEventListener('message')
  v
Lua (execute action, return result)
```

### Technical Decisions

- **Vite over Next.js** - Static build, no server requirements, standard for FiveM NUI
- **TypeScript** - Catches Lua/frontend message shape mismatches early
- **Raw permissions table** - No hardcoded permission lists, Lua sends what it has, frontend checks `permissions['key']`
- **Reuse existing Lua logic** - NUI is a pure presentation layer, all business logic stays in Lua
- **Convar toggle** - `ea_useNUI` for parallel testing, removed when NativeUI is dropped

## Success Criteria

### Done
- [x] Main menu renders with navigation sidebar
- [x] Player list populates from live Lua data
- [x] Search/filter works client-side (name, ID, identifier, license, discord)
- [x] Selecting a player shows action panel
- [x] All player actions work end-to-end (kick, ban, warn, slap, spectate, teleport, freeze, mute, screenshot)
- [x] Confirmation dialogs for destructive actions
- [x] Toast notifications for action results
- [x] Toggle between NativeUI and NUI via convar
- [x] No regressions in existing NativeUI menu when NUI is disabled
- [x] No hardcoded permission lists

### Remaining
- [ ] Ban list viewer
- [ ] Report viewer
- [ ] Server management menu
- [ ] Settings menu
- [ ] Cached players / offline ban
- [ ] Animations and transitions
- [ ] Keyboard navigation
- [ ] Virtualized player list
- [ ] RedM theming
- [ ] New plugin API
- [ ] Plugin migration utility
- [ ] NativeUI removal
