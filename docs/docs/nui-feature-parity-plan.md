# NUI Feature Parity Plan

Complete roadmap to match the existing NativeUI frontend. Organized by priority and dependency.

## Current State

**Done:**
- Main menu / Dashboard
- Player list (search, status badges)
- Player detail (kick, ban, warn, slap, spectate, teleport, freeze, mute, screenshot)
- Confirm dialog, toast notifications
- Convar toggle (`ea_useNUI`)
- Browser dev mode (`?dev`)
- Design system (tokens, glassmorphism, linting)
- Test suite (30 tests)

**Missing:**
- Ban list viewer (paginated, searchable, editable, unban)
- Report viewer (claim, close, close similar, reporter/reported links)
- Server management (announcement, resources, convars, gametype, mapname, cleanup)
- Cached players (offline ban)
- Settings (TTS, anonymous, refresh, orientation)
- Player search (global search across online + cached)
- "All Players" actions (teleport everyone to me)
- Reason prompts for kick/ban/warn (keyboard input dialogs)
- Ban duration picker (preset + custom time builder)
- Teleport sub-options (player to me, me back, player back, into vehicle)
- Routing bucket (join / force)
- Copy Discord to clipboard
- Plugin menu hooks
- RedM-specific handling (infinity mode, cleanup disabled)
- Easter eggs / alternative branding
- Screen reader / TTS integration

---

## Architecture Plan

### Folder Structure

```
nui/src/
  main.tsx                    # entry, mock loader
  App.tsx                     # state, routing, navigation
  fivem.ts                    # callLua, on (NUI bridge)
  types.ts                    # shared TS types
  mock.ts                     # browser dev mock

  styles/
    index.css                 # design tokens + global styles

  components/                 # shared UI primitives
    icons.tsx                 # SVG icon library
    Navigation.tsx            # sidebar nav
    ConfirmDialog.tsx         # modal confirmation
    Toast.tsx                 # toast notifications
    InputPrompt.tsx           # NEW: text input modal (reason prompts)
    BanDurationPicker.tsx     # NEW: ban length selector
    Pagination.tsx            # NEW: page controls
    KeyValueTable.tsx         # NEW: key-value display rows
    SearchBar.tsx             # NEW: reusable search input

  pages/                      # NEW: top-level views
    Dashboard/
      Dashboard.tsx           # main landing, quick actions
      ComingSoonCard.tsx      # disabled feature placeholder
    Players/
      PlayerListPage.tsx      # player list + search bar
      PlayerDetailPage.tsx    # orchestrator (info + actions)
      PlayerInfoPanel.tsx     # identifiers, IP, Discord, badges
      PlayerActionsGrid.tsx   # action buttons
      PlayerTeleportMenu.tsx  # teleport sub-options
      AllPlayersActions.tsx   # teleport everyone
      CachedPlayersPage.tsx   # offline player list
    Bans/
      BanListPage.tsx         # paginated ban list + search
      BanDetailPage.tsx       # ban overview + edit + unban
    Reports/
      ReportListPage.tsx      # open reports list
      ReportDetailPage.tsx    # report info + actions
    Server/
      ServerPage.tsx          # orchestrator
      ServerAnnouncements.tsx # announcement prompt
      ServerInfo.tsx          # gametype, mapname
      ServerResources.tsx     # start/stop resource
      ServerConvars.tsx       # set convar (name + value modal)
      ServerCleanup.tsx       # clean area config
    Settings/
      SettingsPage.tsx        # orchestrator
      SettingsData.tsx        # refresh actions
      SettingsDisplay.tsx     # ban list type, orientation
      SettingsPrivacy.tsx     # anonymous mode
      SettingsAccessibility.tsx # TTS toggle + speed
      SettingsAppearance.tsx  # easter eggs (FiveM only)

  hooks/                      # NEW: custom React hooks
    useDebounce.ts            # debounced search
    usePagination.ts          # pagination state
    usePlayerSearch.ts        # search across online + cached
```

### Design Principles

1. **One page per file** -- each top-level view is its own `pages/` subdirectory
2. **Modals for prompts** -- any action requiring input (reason, name, value) uses a reusable `InputPrompt` modal, not inline keyboard
3. **Lua as source of truth** -- frontend never computes business logic; all actions go through `callLua`
4. **Raw permissions (Lua format)** -- `Record<string, boolean>` passed from Lua. Permission keys match Lua exactly (e.g. `player.kick`, `player.ban.temporary`, `server.announce`). NEVER change or prefix the keys defined in the Lua code.
5. **Clean state architecture** -- if `App.tsx` grows beyond a reasonable size, restructure with `useReducer` or context. No monolithic files with many concerns.
6. **Lazy loading** -- data is requested when a page is opened, not on menu init. Each page owns its own data fetch.
7. **Type safety** -- all Lua callbacks typed with `callLua<T>(action, data)`
8. **Permission-gated UI** -- components check `permissions[key]` and hide/disable accordingly
9. **Error feedback** -- when a Lua callback returns `{error: "..."}`, show a toast notification
10. **Plugin hooks are deferred** -- the plugin integration strategy is undecided and will be addressed after feature parity is reached

---

## Implementation Phases

### Phase 1: Shared Components (foundation)

Build the reusable primitives needed across all pages.

**Deliverables:**
- `InputPrompt` -- modal with label, placeholder, max length, submit/cancel. Used for all reason/name/value inputs.
- `BanDurationPicker` -- dropdown of preset durations + "custom" option that opens a sub-modal with hours/days/weeks/months pickers.
- `Pagination` -- prev/next/first/last buttons with page info.
- `KeyValueTable` -- display rows of key-value pairs (ban details, player info). Clickable rows open `InputPrompt` for editing.
- `SearchBar` -- reusable search input with debounce support. Used as a standard website search bar within pages.
- `Skeleton` -- loading placeholder component (pulsing grey blocks) for async data.
- `useDebounce` hook -- debounce search queries.
- `usePagination` hook -- manage page state, items per page, total.

**Lua changes:** None.

**Testing:** Unit tests for `InputPrompt`, `Pagination`, `BanDurationPicker`, `SearchBar`.

---

### Phase 2: Ban List Viewer

The ban list is a complex, self-contained feature. Good second step because it exercises pagination, search, detail views, and editing.

**Deliverables:**
- `pages/Bans/BanListPage.tsx` -- paginated list of bans (10 per page), client-side search/filter by ban ID/name/reason/identifier. Data fetched lazily when page is first opened.
- `pages/Bans/BanDetailPage.tsx` -- ban overview: ban ID, reason, name, banner, expire, identifiers. Editable fields (when `player.ban.edit`) open `InputPrompt` modals. Save changes button.
- Unban button when `player.ban.remove`.
- Toggle between "show reasons" and "show licenses" (settings).
- IP privacy filter (respects `ea_IpPrivacy` convar, passed from Lua).
- `Skeleton` loading state while ban list is fetching.

**Lua callbacks:**
- `requestBanList` -- fetch ban list from server (called when page opens, not on menu init).
- `editBan` -- send edited ban data to server.
- `unbanPlayer` -- remove ban by ban ID.
- Event: `updateBanList` -- push updated ban list to frontend (e.g. after unban).

**Types:**
```typescript
interface BanEntry {
  banid: string
  reason: string
  name?: string
  banner?: string
  expire?: number
  expireString?: string
  identifiers: string[]
}
```

**Testing:** Pagination logic, search filtering, detail view rendering.

---

### Phase 3: Report Viewer

**Deliverables:**
- `pages/Reports/ReportListPage.tsx` -- list of open reports with color coding (yellow = normal, red = emergency, green = claimed). Data fetched lazily when page opens.
- `pages/Reports/ReportDetailPage.tsx` -- report info: ID, type, reporter, reported, reason, time, claim status.
- Actions: claim report, open reporter/reported in player detail, close report, close similar reports.
- Refresh button.
- `Skeleton` loading state while reports are fetching.

**Lua callbacks:**
- `requestReports` -- fetch reports from server (called when page opens, not on menu init).
- `claimReport` -- claim a report.
- `closeReport` -- close a report.
- `closeSimilarReports` -- close similar reports.
- Event: `updateReports` -- push updated reports.

**Types:**
```typescript
interface Report {
  id: number
  type: 0 | 1          // 0 = normal, 1 = emergency
  reporter: number
  reporterName: string
  reported?: number
  reportedName?: string
  reason: string
  reportTimeFormatted: string
  claimed?: boolean
  claimedName?: string
}
```

**Testing:** Report list filtering, detail view, action callbacks.

---

### Phase 4: Player Management Enhancements

Improve the existing player pages to match NativeUI feature set.

**Deliverables:**
- Search bar within the Players page (standard website-style search input, filters online players by name/ID/license).
- "All Players" actions section (teleport everyone to me).
- Enhanced `PlayerDetailPage` (split into sub-components):
  - `PlayerInfoPanel.tsx` -- identifiers, IP, Discord, badges (KeyValueTable).
  - `PlayerActionsGrid.tsx` -- action buttons.
  - `PlayerTeleportMenu.tsx` -- teleport sub-options (to player, player to me, me back, player back, into closest vehicle).
  - Kick with `InputPrompt` for reason. Permission: `player.kick`.
  - Ban with `InputPrompt` for reason + `BanDurationPicker`. Permissions: `player.ban.temporary` / `player.ban.permanent`.
  - Warn with `InputPrompt` for reason. Permission: `player.warn`.
  - Slap with slider (1-20x10 damage). Permission: `player.slap`.
  - Routing bucket (join / force) -- conditional on `ea_routingBucketOptions` convar. Permissions: `player.bucket.join` / `player.bucket.force`.
  - Copy Discord to clipboard.
- Cached players page (`pages/Players/CachedPlayersPage.tsx`):
  - List of recently disconnected players. Data fetched lazily when page opens.
  - Per-player: ban with reason + duration (same as online).
- `Skeleton` loading states.

**Permission keys (Lua format, never changed):**
`player.kick`, `player.ban.temporary`, `player.ban.permanent`, `player.warn`, `player.slap`, `player.freeze`, `player.mute`, `player.spectate`, `player.teleport.single`, `player.teleport.everyone`, `player.screenshot`, `player.bucket.join`, `player.bucket.force`

**Lua callbacks:**
- `requestCachedPlayers` -- fetch cached player list.
- `offlineBanPlayer` -- ban a cached player.
- `teleportPlayerToMe` -- teleport player to admin.
- `teleportMeBack` -- teleport admin back to last location.
- `teleportPlayerBack` -- teleport player back.
- `teleportIntoVehicle` -- put player in closest vehicle.
- `joinPlayerBucket` -- join player's routing bucket.
- `forcePlayerBucket` -- force player into admin's bucket.
- `copyToClipboard` -- copy text to clipboard.
- Event: `updateCachedPlayers` -- push cached player updates.

**Types:**
```typescript
interface CachedPlayer {
  id: number
  name: string
  identifier?: string
  droppedTime?: number
  immune?: boolean
}
```

**Testing:** Player detail actions, cached player list, teleport options.

---

### Phase 5: Server Management

**Deliverables:**
- `pages/Server/ServerPage.tsx` -- organized into sub-components:
  - `ServerAnnouncements.tsx` -- `InputPrompt` for message text. Permission: `server.announce`.
  - `ServerInfo.tsx` -- set gametype, set mapname (each with `InputPrompt`). Permission: `server.convars`.
  - `ServerResources.tsx` -- start resource, stop resource (with self-protection: can't stop EasyAdmin itself). Permissions: `server.resources.start` / `server.resources.stop`.
  - `ServerConvars.tsx` -- set convar via single `InputPrompt` modal with two fields (name + value). Permission: `server.convars`.
  - `ServerCleanup.tsx` -- `CleanupModal` with type selector (cars/peds/props), radius selector, deep clean toggle. Permissions: `server.cleanup.cars` / `server.cleanup.peds` / `server.cleanup.props`. Hidden on RedM (matches NativeUI behavior).
- All sections gated by respective permissions.

**Lua callbacks:**
- `announce` -- send announcement.
- `setGameType` -- set gametype convar.
- `setMapName` -- set mapname convar.
- `startResource` -- start a resource by name.
- `stopResource` -- stop a resource (with self-check).
- `setConvar` -- set a convar name/value.
- `requestCleanup` -- request area cleanup.

**Testing:** Server action callbacks, convar two-step flow, cleanup modal.

---

### Phase 6: Settings

**Deliverables:**
- `pages/Settings/SettingsPage.tsx` -- organized into sub-components:
  - `SettingsData.tsx` -- refresh ban list, refresh cached players, refresh permissions.
  - `SettingsDisplay.tsx` -- ban list show type (reasons vs licenses), menu orientation (left/middle/right).
  - `SettingsPrivacy.tsx` -- anonymous mode toggle. Permission: `anon`.
  - `SettingsAccessibility.tsx` -- screen reader / TTS toggle + speed selector.
  - `SettingsAppearance.tsx` -- force easter egg (FiveM only, hidden on RedM).
- Settings persisted via `setResourceKvp` Lua callback.

**Lua callbacks:**
- `refreshBanList` -- request fresh ban list.
- `refreshCachedPlayers` -- request fresh cached players.
- `refreshPermissions` -- re-check admin status.
- `setResourceKvp` -- persist setting.
- `setAnonymous` -- toggle anonymous mode.
- `setTtsEnabled` -- toggle text-to-speech.
- `setTtsSpeed` -- set TTS speed.

**Testing:** Settings persistence, toggle state, refresh actions.

---

### Phase 7: Polish & Edge Cases

**Deliverables:**
- Virtualized player list for 100+ players (react-window or custom).
- Keyboard shortcuts (ESC to close modals, arrow keys in lists).
- Error boundaries per page.
- RedM-specific UI adjustments (hide cleanup, adjust player list for non-infinity mode -- behavior matches existing Lua `RedM` and `settings.infinity` checks in `gui_c.lua`).
- Easter egg / alternative branding support (passed from Lua via `MenuState`).
- TTS integration (listen for `speak` NUI messages, use Web Speech API).
- Responsive layout adjustments for different resolution/aspect ratios.

---

## Lua Controller Plan (modular)

The NUI controller must NOT be a single monolithic file like `gui_c.lua`. Each domain gets its own file. `gui_nui.lua` is only the bootstrap that requires them all.

### Structure

```
client/
  gui_nui.lua                 # bootstrap: toggle, focus, require all modules
  nui/
    core.lua                  # visibility, focus, menuToggle, closeMenu
    players.lua               # player list build, requestPlayers, player actions
    bans.lua                  # ban list, edit, unban
    reports.lua               # reports, claim, close, close similar
    server.lua                # announce, resources, convars, cleanup
    settings.lua              # refresh, kvp, anonymous, tts
    events.lua                # net event listeners, state sync to frontend
    utils.lua                 # shared helpers (buildPlayerList, sendToNui, checkPerm)
```

### fxmanifest.lua

Add a glob so FiveM loads the new modules:
```
client_scripts {
    'client/nui/*.lua',
    'client/gui_nui.lua',
}
```

### Rules

1. **One file per domain** -- players, bans, reports, server, settings each own their callbacks and events
2. **`gui_nui.lua` is thin** -- only toggles visibility, sets focus, and `require`s the modules
3. **Shared state via module table** -- each module exports a table with its callbacks; `gui_nui.lua` calls `require('nui.'..module)` and iterates
4. **No cross-module coupling** -- modules share only globals from `gui_c.lua` (playerlist, permissions, etc.), not each other
5. **Callbacks follow the same pattern** -- validate permission, execute, notify frontend via toast, return result
6. **Events centralized in `events.lua`** -- all `RegisterNetEvent` handlers live here, they call `sendToNui()` from utils
7. **Lua tracks `lastLocation`** -- teleport back state is managed in Lua, not the frontend

### Bootstrap Pattern

```lua
-- gui_nui.lua (skeleton)
local nuiVisible = false

local core = require('nui.core')
local players = require('nui.players')
local bans = require('nui.bans')
local reports = require('nui.reports')
local server = require('nui.server')
local settings = require('nui.settings')
local events = require('nui.events')

-- Register all callbacks
for _, mod in ipairs{core, players, bans, reports, server, settings} do
  for name, handler in pairs(mod.callbacks or {}) do
    RegisterNUICallback(name, handler)
  end
end

-- Toggle command
RegisterCommand('ea_nui', function()
  core.toggle()
end, false)
```

This keeps each file under ~200 lines, easy to find, easy to test.

---

## Migration Checklist

When all phases are complete:

- [ ] All NativeUI menus have NUI equivalents
- [ ] All permissions are respected
- [ ] All server events are wired up
- [ ] All settings are configurable
- [ ] Plugin hooks work (mainMenu, playerMenu, serverMenu, settingsMenu, cachedMenu)
- [ ] RedM mode fully supported
- [ ] TTS / screen reader working
- [ ] Keyboard navigation complete
- [ ] Performance tested at 100+ players
- [ ] All tests passing
- [ ] Lint clean
- [ ] Build successful

After checklist is complete:
- [ ] Deprecate NativeUI dependency
- [ ] Remove `gui_c.lua` menu generation
- [ ] Make `ea_useNUI` default to `true`
- [ ] Update documentation
