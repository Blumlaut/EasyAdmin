# Ban List

The ban list is the core of EasyAdmin's enforcement system. It stores all player bans with identifiers, reasons, and metadata.

## Storage

Bans are stored in `resources/EasyAdmin/banlist.json`. The file is automatically loaded on server start and updated in real time when bans are added, edited, or removed.

## Ban Structure

Each ban entry contains:

| Field | Description |
|-------|-------------|
| `banid` | Unique numeric identifier for the ban |
| `name` | Player name at time of ban |
| `identifiers` | Array of player identifiers (steam, discord, license, etc.) |
| `banner` | Name of the admin who issued the ban |
| `reason` | Ban reason text |
| `expire` | Unix timestamp when the ban expires |
| `expireString` | Human-readable expiry date |
| `type` | Ban type (BAN, OFFLINE BAN, etc.) |
| `time` | Unix timestamp when the ban was issued |

Permanent bans use the timestamp `10444633200` (year 2329). Expired bans are automatically removed on server start.

## Ban Enforcement

When a player connects, EasyAdmin checks their identifiers against the ban list. A player is blocked if they have at least `ea_minIdentifierMatches` (default: 2) matching identifiers with any active ban.

### Connection Deferral

EasyAdmin defers the player connection while checking the banlist. A progress bar is displayed during this check. If another deferral resource causes conflicts, disable EasyAdmin's progress:

```
set ea_presentDeferral "false"
```

## Ban Screen

Banned players see a custom screen with:

- Server name (from `ea_banMessageServerName`)
- Ban reason
- Expiry date
- Banner name (if `ea_banMessageShowStaff` is `true`)
- Footer text (from `ea_banMessageFooter`)
- Watermark image (from `ea_banMessageWatermark`)

The title color is controlled by `ea_banMessageTitleColour`.

## Banning Players

### Online Players

Use the ban action in the NUI player list or the `/ban` command. The ban captures all of the player's identifiers and drops them immediately.

### Offline Players

Use the offline ban action in the NUI to ban a player who is not currently online. This requires at least one known identifier for the target.

### Programmatic Banning

Use the `EasyAdmin:addBan` export:

```lua
exports.EasyAdmin:addBan(playerId, reason, expires, banner)
```

Parameters:
- `playerId` — Player ID (number) or table of identifiers (for offline bans)
- `reason` — Ban reason string
- `expires` — Unix timestamp (or duration in seconds from now)
- `banner` — Name of the banning admin

Returns the ban entry table.

## Editing Bans

Players with `easyadmin.player.ban.edit` permission can edit ban entries through the NUI:

- Change the reason text
- Add or remove identifiers

Changes are persisted to `banlist.json` immediately.

## Unbanning

### By Ban ID

Use the `/unban` command or the NUI ban list to unban by ban ID.

```
/unban 123
```

### By Identifier

Unban all bans matching a specific identifier:

```
/unban steam:1100001018c7433
```

Requires `easyadmin.player.ban.remove` permission.

## API Exports

| Export | Description |
|--------|-------------|
| `EasyAdmin:addBan(playerId, reason, expires, banner)` | Add a new ban |
| `EasyAdmin:unbanPlayer(banId)` | Remove a ban by ID |
| `EasyAdmin:fetchBan(banId)` | Fetch a ban entry by ID |
| `EasyAdmin:GetFreshBanId()` | Get the next available ban ID |
| `EasyAdmin:IsIdentifierBanned(identifier)` | Check if an identifier is banned |

## Custom Banlist Integration

Enable custom banlist events for external systems:

```
set ea_custombanlist "true"
```

When enabled, EasyAdmin triggers these events during ban operations:

- `ea_data:addBan` — Triggered when a ban is added
- `ea_data:updateBan` — Triggered when a ban is edited
- `ea_data:removeBan` — Triggered when a ban is removed

Listen for these events in a plugin or separate resource to sync with external databases.
