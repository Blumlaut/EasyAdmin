# NUI Pages

The NUI consists of the following pages, accessible through the sidebar navigation. Pages are dynamically shown or hidden based on user permissions.

## Dashboard

The landing page showing server overview:

- Player count (current / max)
- Admin count (online)
- Pending reports count
- Server uptime
- Resource count (total / started)
- Average server ping

## Players

### Player List

Lists all connected players with:

- Player name
- Player ID
- Ping
- Identifiers (steam, discord, license, etc.)
- IP address (hidden if `ea_IpPrivacy` is enabled)

Click a player to open the Player Detail page.

### Player Detail

Shows detailed information for a selected player:

- Name and ID
- All identifiers
- Action history (if `player.actionhistory.view` permission)
- Admin notes (if `player.adminnotes.view` permission)
- Name history (if `player.namehistory.view` permission)
- Available actions (based on permissions):
  - Kick
  - Ban (temporary/permanent)
  - Mute
  - Freeze
  - Slap
  - Teleport (to/from)
  - Spectate
  - Screenshot
  - Stream (live screen view)
  - Warn

### Cached Players

Shows recently disconnected players whose data is retained for ban matching. Useful for banning players who just left.

## Ban List

### Ban List Page

Paginated list of all bans with:

- Ban ID
- Player name
- Reason
- Expiry date
- Server-side search (by name, ban ID, or identifier)

Click a ban row to open the Ban Detail page.

### Ban Detail

Shows full details for a selected ban:

- Ban ID
- Player name
- All identifiers
- Banner name
- Reason
- Expiry date
- Ban type
- Edit permissions (if `player.ban.edit`)
- Unban action (if `player.ban.remove`)

## Reports

### Report List

Lists all active reports with:

- Report ID
- Reporter name
- Reported player name (if applicable)
- Reason
- Time ago
- Claim status

Actions available:

- Claim report (if `player.reports.claim`)
- Close report (if `player.reports.process`)

### Report Detail

Shows full details for a selected report including screenshot (if captured).

## Server Management

### Server Management

Server controls:

- Announcements (if `server.announce`)
- Convar editing (if `server.convars`)
- Admin chat (if `server.chat`)
- Cleanup actions (if `server.cleanup.*`)

### Resources

Lists all running resources with state information:

- Resource name
- State (started, stopped, etc.)
- Start type
- Memory usage

Actions:

- Start resource (if `server.resources.start`)
- Stop resource (if `server.resources.stop`)
- Restart resource

### Profiler

Real-time performance data for all resources:

- CPU tick usage
- Memory consumption
- Resource state

Requires `server.resources.monitor` permission.

## Statistics

### Player Statistics

Historical player engagement data:

- Daily peak player count
- Join/leave history
- Session data

Requires `server.statistics.view` permission.

### Network Monitor

Real-time and historical network statistics:

- Per-player ping, jitter, packet loss
- Server-wide averages
- Time series charts (1h, 6h, 24h, 7d)

Requires `server.network.monitor` permission.

## Settings

### Accessibility

- Font size slider (10-20px)
- High contrast toggle

### Layout

- Sidebar mode (vertical/horizontal)
- Sidebar direction (left/right/up/down)

### Data

- Refresh ban list
- Refresh cached players
- Refresh permissions

### Anonymous Mode

Toggle anonymous mode to hide your username in logs and webhooks. Requires `easyadmin.anon` permission.

## See Also

- [Design System](design-system) — Architecture, components, CSS variables
- [Known Issues](known-issues) — OSR rendering quirks, CSS limitations
- [NUI Settings](../configuration/nui-settings) — Configuration convars for NUI behavior
