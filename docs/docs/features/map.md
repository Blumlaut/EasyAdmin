# Map

The Map page shows live player positions on the GTA V world map, letting you see where everyone is at a glance and act on them (spectate, teleport, open their details) without leaving the map.

## Map Styles

On GTA V the tiles come in three styles, switchable from the toolbar above the map:

| Style | Description |
|-------|-------------|
| Render | Satellite-style imagery (default) |
| Game | In-game render with labels |
| Print | Muted print-style map |

Tiles are served from Rockstar's Social Club tile CDN, so no API key is required. RedM has no tile styles at all (see [RedM](#redm) below).

## Player Markers

| Marker | Meaning |
|--------|---------|
| Yellow with ring | You |
| Blue | Normal player |
| Green with shield | Admin |
| Red with lock | Frozen player |

A legend explaining the markers is shown in the corner of the map.

Positions are collected by the server and streamed to the page about twice a second while it is open, so players are shown even when they are far away or in another routing bucket.

Clicking a marker opens a popup with the player's name, ID, and coordinates, plus the actions you are allowed to use:

- **Spectate** — watch that player (requires `easyadmin.player.spectate`)
- **Teleport** — move yourself to that player (requires `easyadmin.player.teleport.single`)
- **Details** — open the player's detail page

## Teleporting to a Location

On GTA V you can travel to any spot on the map. Click a part of the map that has no marker on it and a small "Teleport here" popup opens at that spot, showing its coordinates. Pressing **Teleport** moves your character to that area, on the ground.

- This requires `easyadmin.player.teleport.single`. Without it, clicking the map does nothing.
- The target is approximate: you arrive close to the spot you clicked, not exactly on it.
- RedM's coordinate grid does not support click-to-teleport.

## RedM

RedM has no tile source, so positions are drawn on a coordinate grid instead (1 unit = 2 m, north is up). The grid auto-scales to the players' positions and shows each player's coordinates on hover. Click a player's dot to open their detail page.

## Notes

- The map is a flat projection of the game world, so marker positions and teleport targets are approximate.
- Zooming in stops at the deepest level that still covers the whole island.
- The stream starts when the Map page opens and stops when the page closes or the menu is hidden.
- Players who are still loading in are not shown until they exist in the world.
- The page shows an "awaiting positions" message until the first update arrives.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.map.view` | Open the Map page |
| `easyadmin.player.spectate` | Spectate a player from the map |
| `easyadmin.player.teleport.single` | Teleport to a player or to a clicked map location |
