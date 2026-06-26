# Action History

Action history tracks all moderation actions taken against a player, including bans, kicks, warnings, and manual entries.

## Tracking

All moderation actions performed through EasyAdmin are automatically logged to the action history. This includes:

- Bans (temporary and permanent)
- Kicks
- Warnings
- Mutes
- Freezes
- Slaps
- Teleports
- Screenshots

Actions are stored per player identifier and persist across server restarts.

## Configuration

Enable or disable action history:

```
set ea_enableActionHistory "true"
```

Default: `true`

Set the number of days to retain action history entries:

```
set ea_actionHistoryExpiry 30
```

Default: `30` days. Expired entries are automatically cleaned up.

## Viewing History

Players with `easyadmin.player.actionhistory.view` permission can view a player's action history through the NUI player detail page.

## Adding Entries

Admins with `easyadmin.player.actionhistory.add` permission can add manual entries to a player's action history through the NUI.

## Deleting Entries

Admins with `easyadmin.player.actionhistory.delete` permission can delete individual action history entries.

## Storage

Action history is stored in `resources/EasyAdmin/action_history.json`. Each entry contains:

| Field | Description |
|-------|-------------|
| `id` | Unique action ID |
| `action` | Type of action (BAN, KICK, WARN, etc.) |
| `identifiers` | Player identifiers at time of action |
| `reason` | Reason or description |
| `moderator` | Name of the admin who performed the action |
| `moderatorIdentifiers` | Identifiers of the admin |
| `banId` | Associated ban ID (if applicable) |
| `timestamp` | Unix timestamp of the action |

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:getActionHistory(identifiers)` | Get action history for a set of identifiers |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:LogAction(action)` | Log an action to the history |

The `action` table must contain:
- `action` — Action type string (required)
- `identifiers` — Player identifiers table (optional)
- `reason` — Reason string (optional)
- `moderator` — Moderator name (optional)
- `moderatorIdents` — Moderator identifiers table (optional)
- `banId` — Associated ban ID (optional)
