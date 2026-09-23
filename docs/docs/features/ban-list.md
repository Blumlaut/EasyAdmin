# Ban List

The ban list is what keeps banned players out of your server. Every ban stores the player's identifiers, the reason for the ban, who issued it, and when it expires.

## Storage

Bans are stored in the `banlist.json` file inside the EasyAdmin resource folder. The file is loaded when the server starts and saved as soon as a ban is added, edited, or removed.

## Ban Structure

Each entry in `banlist.json` contains:

| Field | Description |
|-------|-------------|
| `banid` | Unique numeric ID for the ban |
| `username` | Player name when the ban was issued |
| `identifiers` | The player's identifiers (steam, discord, license, etc.) |
| `banner` | Name of the admin who issued the ban |
| `reason` | Ban reason text |
| `expire` | Unix timestamp when the ban ends |
| `expiryString` | The same expiry date, written out |
| `type` | `BAN` for online bans, `OFFLINE BAN` for offline bans |
| `time` | Unix timestamp when the ban was issued |
| `issuingResource` | Set when another resource created the ban |

Permanent bans use the timestamp `10444633200` (23 December 2300). Expired bans are removed on server start and every five minutes after that.

Ban lists carried over from EasyAdmin 7.x use `name` instead of `username`.

## Ban Enforcement

When a player connects, EasyAdmin compares their identifiers against the ban list. The player is blocked when at least `ea_minIdentifierMatches` identifiers (default: 2) match an active ban.

If a banned player reconnects with an identifier the ban does not list yet, EasyAdmin adds it to the ban, so that identifier is blocked as well.

### Connection Deferral

While the check runs, the player sees a "Checking Banlist" message. If another resource also defers connections and the messages clash, turn EasyAdmin's progress text off:

```
set ea_presentDeferral "false"
```

## Ban Screen

Banned players see a screen showing:

- Server name (from `ea_banMessageServerName`)
- Sub-header (from `ea_banMessageSubHeader`)
- Ban reason
- Expiry date
- Admin name (if `ea_banMessageShowStaff` is `true`)
- Ban ID
- Footer text (from `ea_banMessageFooter`)
- Watermark image (from `ea_banMessageWatermark`)

The title colour comes from `ea_banMessageTitleColour`.

## Banning Players

### Online Players

Ban from the NUI player list or with the `/ban` command. The ban records all of the player's identifiers and disconnects them straight away.

### Offline Players

Use the offline ban action in the NUI to ban someone who is not connected. The player must have at least one known identifier.

### Programmatic Banning

Use the `EasyAdmin:addBan` export:

```lua
exports.EasyAdmin:addBan(playerId, reason, expires, banner)
```

Parameters:

- `playerId` — Player ID (number), or a table of identifiers for an offline ban
- `reason` — Ban reason string
- `expires` — Unix timestamp, or a number of seconds from now; leave empty for a permanent ban
- `banner` — Name of the banning admin

Returns the created ban entry.

## Viewing the Ban List

The Bans page lists bans ten at a time and can be searched by player name, ban ID, or identifier. Click a ban to see its full details, including identifiers. Requires `easyadmin.player.ban.view`.

## Editing Bans

Admins with `easyadmin.player.ban.edit` can edit a ban from its detail page:

- Reason
- Player name
- Banner (admin name to display)
- Expiry date

Identifiers are shown on the detail page but cannot be edited. Changes are saved immediately.

## Unbanning

Use the `/unban` command or the unban button on a ban's detail page:

```
/unban 123
```

You can also remove bans by identifier:

```
/unban steam:1100001018c7433
```

Requires `easyadmin.player.ban.remove`.

## API Exports

| Export | Description |
|--------|-------------|
| `EasyAdmin:addBan(playerId, reason, expires, banner)` | Add a new ban |
| `EasyAdmin:unbanPlayer(banId)` | Remove a ban by ID |
| `EasyAdmin:fetchBan(banId)` | Fetch a ban entry by ID |
| `EasyAdmin:GetFreshBanId()` | Get the next available ban ID |
| `EasyAdmin:IsIdentifierBanned(identifier)` | Check if an identifier is banned |

## Custom Banlist Integration

Turn on `ea_custombanlist` to let other resources react to ban changes:

```
set ea_custombanlist "true"
```

When enabled, EasyAdmin sends these events:

| Event | When it fires |
|-------|---------------|
| `ea_data:updateBan` | A ban is edited, or a banned player reconnects with an identifier that gets added to their ban |
| `ea_data:addBan` | For each ban restored when a backup is loaded |

Both events pass the ban entry with the fields listed in [Ban Structure](#ban-structure). No event is sent when a ban is removed.

```lua
AddEventHandler("ea_data:updateBan", function(ban)
    print("Ban " .. ban.banid .. " was updated")
end)
```

## See Also

- [Backups](../../configuration/backups) — Back up and restore the ban list
- [Basic Configuration](../../configuration/basic) — Ban screen text and appearance
- [Reports](../reports) — Automatic bans from player reports
- [Action History](../action-history) — Review previous moderation actions
