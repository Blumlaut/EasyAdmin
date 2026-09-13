# Map

The Map page shows live player positions on the GTA V world map, letting you see where everyone is at a glance and act on them (spectate, teleport, open their details) without leaving the map.

## Map Styles

Three tile styles are available, switchable from the toolbar:

| Style | Description |
|-------|-------------|
| Render | Satellite-style imagery (default) |
| Game | In-game render with labels |
| Print | Muted print-style map |

Tiles are served from Rockstar's Social Club tile CDN (`s.rsg.sc`) — no API key required.

## Player Markers

| Marker | Meaning |
|--------|---------|
| Yellow with ring | You |
| Blue | Normal player |
| Green with shield | Admin |
| Red with lock | Frozen player |

A legend explaining the markers is shown in the corner of the map.

The server streams positions at ~2 Hz while the menu is open and the Map page is showing. Collection happens server-side because the server holds authoritative (OneSync) positions for every player — a client only sees peds within its own streaming range and routing bucket, so a client-side read would miss or zero out players the client cannot stream.

Clicking a marker opens a popup with the player's name, ID, and coordinates, plus actions available to you:

- **Spectate** — requires `player.spectate`
- **Teleport** — requires `player.teleport.single`
- **Details** — opens the player's detail page

## RedM

RedM has no tile source, so positions are rendered on a coordinate grid instead (1 unit = 2 m, north is up). The grid auto-scales to the players' positions and shows per-player coordinates on hover.

## Notes

- The map is a flat orthographic projection of the game world, fitted against the tile imagery (landmark residuals < 30 m).
- The deepest zoom with full island coverage is used as the maximum zoom.
- The stream starts when the Map page opens and stops when the page closes or the menu is hidden.
- Players who are still loading in are skipped until their ped exists.
- The page shows an "awaiting positions" state until the first update arrives.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.map.view` | Access the Map page |
