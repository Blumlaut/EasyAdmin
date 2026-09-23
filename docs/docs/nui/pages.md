# NUI Pages

The NUI consists of the following pages, accessible through the sidebar navigation. Pages are dynamically shown or hidden based on user permissions. Plugins can also add sidebar entries and pages of their own — see [Plugin Contributions](#plugin-contributions).

## Dashboard

The landing page, showing a snapshot of the server:

- Stat cards for Players Online, Peak Today, Average Ping, Resources (started / total), Admins Online, Server Uptime and Pending Reports
- A chart showing how full the server is, based on the current player count and the max player count
- A players-over-time chart with 1h, 6h, 24h and 7d ranges
- Bars counting the vehicles, peds and objects in the world

When relevant, the dashboard also shows a banner for a new EasyAdmin release, a warning when installed resources have updates (with a shortcut to the Resources page), and a countdown when the server is scheduled to restart.

## Players

### Player List

Lists all connected players with:

- Player name
- Player ID and license
- Role badges
- Frozen and Muted badges, when they apply
- Quick action buttons (based on permissions)

Use the search box to filter by name, ID or identifier. Click a player to open the Player Detail page, or use the Cached players button to view recently disconnected players. Admins with the teleport-everyone permission also get a button to teleport all players to their position.

### Player Detail

Shows detailed information for a selected player:

- Name and ID
- Role badges
- Identifiers (IP identifiers are hidden when IP privacy is enabled)
- Name history (if `player.namehistory.view` permission)
- Action history (if `player.actionhistory.view` permission)
- Admin notes (if `player.adminnotes.view` permission)
- Tabs added by plugins

Available actions (based on permissions):

Discipline:

- Warn
- Kick
- Ban (temporary/permanent)

Movement:

- Spectate
- Join bucket
- Force bucket

Control:

- Slap
- Freeze
- Mute
- Screenshot
- Stream (live screen view)

Teleport:

- Teleport to me
- Me to player
- Me back
- Player back
- Into closest vehicle

### Cached Players

Shows recently disconnected players whose data is retained so they can still be banned. Search by name, ID or identifier, and ban a player even while they are offline.

## Ban List

### Ban List Page

Paginated list of all bans with:

- Player name
- Reason
- Expiry badge (Permanent for permanent bans)
- Server-side search (by name, ban ID, or identifier)

Click a ban row to open the Ban Detail page.

### Ban Detail

Shows full details for a selected ban:

- Ban ID
- Reason
- Name
- Banner
- Expires
- Issuing resource (when the ban was issued by another resource)
- All identifiers

With the edit permission (if `player.ban.edit`), fields can be edited and saved from here. The unban action (if `player.ban.remove`) is in the Danger zone.

## Reports

### Report List

Lists all active reports with:

- Report ID
- Reporter name
- Reported player name
- Reason
- Time ago
- Claim badge, showing who claimed it

Search by ID, name or reason. Click a report to open the Report Detail page.

### Report Detail

Shows full details for a selected report:

- ID
- Type (Normal or Emergency)
- Time
- Reporter
- Reported player, when there is one
- Reason
- Claimed by

Reporter and reported names can be clicked to open the player when they are online.

Actions:

- Claim report (if `player.reports.claim`)
- Close report (if `player.reports.process`)
- Close similar reports (if `player.reports.process`)

## Server Management

### Server Management

Server-wide controls. What you see depends on your permissions:

- Emergency Mode — mutes all player chat server-wide so only admins can type (if `server.mute.global`)
- Server Info — hostname, max clients, project name, gametype and map name; gametype and map can be edited here (if `server.convars`)
- Announcements — send a server-wide announcement (if `server.announce`)
- Convar editing — browse and change server convars (if `server.convars`)
- Cleanup — remove cars, peds or props in a radius around you, or globally (if `server.cleanup.*`; not available on RedM)

### Resources

Lists all server resources with:

- Resource name and state
- Version badge, marked when a newer release is available
- Repository URL (copy button)
- Description
- Inline restart and stop buttons

The header has a search box, an Updates button that checks GitHub for newer releases, a Refresh button, and badges counting started and stopped resources.

Actions require `server.resources.start` and/or `server.resources.stop`. EasyAdmin cannot be started or stopped from here. Click a resource to open the Resource Detail page.

### Resource Detail

Opens when you click a resource. Shows the resource's state, version, repository link and description, plus:

- Start, Stop and Ensure (restart) actions, subject to permissions
- An update banner when a newer release is available
- The resource's metadata, such as author, version and description

### Profiler

Runs an on-demand CPU profile. Start a capture and it records server frames for a few seconds, then shows:

- A summary of the capture: frames, average frame time, FPS and total tick time
- Per-resource tick times — how much CPU time each resource spends per server frame, with average, worst and best times and its share of the total
- A per-thread breakdown for each resource
- Hot-line code snippets for the slowest resources

Requires `server.resources.monitor` permission.

## Statistics

### Player Statistics

Long-term player engagement data:

- Summary cards: unique players, new players, returning players, average session, total sessions and total playtime
- A player activity chart with daily peaks (and average ping when available)
- A searchable player registry (first seen, last seen, sessions, playtime, average session)
- Leaderboards for top players by sessions and by playtime

Requires `server.statistics.view` permission.

### Network Monitor

Real-time and historical network statistics:

- Per-player ping, jitter and packet loss
- Server-wide averages and worst values
- Time series charts (1h, 6h, 24h, 7d)

Click a player to open their detailed history.

Requires `server.network.monitor` permission.

## Map

Live player positions on the GTA V world map. Positions stream from the server while the page is open. A legend marks you, players, admins and frozen players, and you can switch between three tile styles (Render, Game and Print). On RedM the map falls back to a coordinate grid (no tile source exists for RedM).

Clicking a player marker opens a popup with Spectate, Teleport and Details actions. On GTA V, clicking empty map space opens a Teleport here popup (if `player.teleport.single`).

Requires `server.map.view` permission.

## Settings

### Links

- GitHub repository link
- Discord server link

Both can be copied to the clipboard.

### Data

- Refresh ban list
- Refresh cached players
- Refresh permissions

### Accessibility

- Font size slider (10-20px)
- High contrast toggle
- UI density (Cramped, Cozy, Default, Spacious, Airy)

### Layout

- Sidebar layout (left sidebar, right sidebar, top taskbar or bottom taskbar)
- Fold opacity slider

### Anonymous Mode

Toggle anonymous mode to hide your username in logs and webhooks. Requires `easyadmin.anon` permission.

## Plugin Contributions

Plugins are external resources that extend EasyAdmin at runtime. They can add sidebar entries and full pages, dashboard widgets, and tabs on the Player Detail page. Plugin pages use the same components as the built-in pages.

- [Creating a Plugin](../../plugins/creating-plugins) — Step-by-step guide
- [NUI Plugin Schema Reference](../../nui-plugins) — Component schema for plugin pages

## See Also

- [Design System](../design-system) — Architecture, components, CSS variables
- [Known Issues](../known-issues) — OSR rendering quirks, CSS limitations
- [NUI Settings](../../configuration/nui-settings) — Configuration convars for NUI behavior
