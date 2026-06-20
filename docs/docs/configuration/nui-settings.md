# NUI Settings

EasyAdmin's graphical interface stores per-admin settings in FiveM's Key-Value Persistence (KVP) system. Settings are saved per-player and persist across sessions.

## Accessibility

### Font Size

Adjust the base font size of the NUI interface.

- Range: 10 to 20 pixels
- Default: 12

Set via the Settings page in the NUI (no convar available).

### High Contrast

Enable high contrast mode for improved readability. This increases color contrast throughout the interface.

Set via the Settings page in the NUI (no convar available).

## Layout

### Sidebar Mode

Choose between vertical (sidebar on the side) or horizontal (sidebar on top/bottom) layout.

- `vertical` — Sidebar appears on the left or right side (default)
- `horizontal` — Sidebar appears at the top or bottom

Default: `vertical`

### Sidebar Direction

Controls the sidebar position within the chosen mode.

- `vertical` mode: `left` (sidebar on right side of window) or `right` (sidebar on left side of window)
- `horizontal` mode: `up` (sidebar at bottom) or `down` (sidebar at top)

Defaults depend on sidebar mode:
- `vertical` → `right`
- `horizontal` → `down`

### Window Position and Size

The window position and size are saved automatically when moved or resized. Defaults:

- Width: 1210 pixels
- Height: 750 pixels

Position is centered on first use if no saved position exists.

## Data Refresh

The Settings page includes buttons to manually refresh data without closing and reopening the menu:

- **Refresh ban list** — Reloads the current banlist from disk
- **Refresh cached players** — Reloads the cached player list
- **Refresh permissions** — Re-fetches the admin's permissions from the server

## Anonymous Mode

Toggle anonymous mode to hide your admin username in logs and webhook notifications. This is a per-session setting (not persisted).

Requires the `easyadmin.anon` permission.
