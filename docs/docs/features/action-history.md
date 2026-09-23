# Action History

Action history records the moderation actions taken against a player, so moderators can see an account's record at a glance.

## Tracking

EasyAdmin records these actions automatically:

- **Bans** (`BAN`), including temporary bans and bans applied while the player is offline (`OFFLINE BAN`)
- **Kicks** (`KICK`)
- **Warnings** (`WARN`)

When a player reaches the maximum warning threshold (`ea_maxWarnings`), the resulting auto-kick or auto-ban is recorded as well.

Other actions — mutes, freezes, slaps, teleports, screenshots and report handling — are **not** recorded; they are only sent to the webhook log. Server-side code and plugins can record additional action types with the [`EasyAdmin:LogAction` event](#events).

## Configuration

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableActionHistory` | `true` | Record new action history entries |
| `ea_actionHistoryExpiry` | `120` | Days to keep entries before automatic cleanup |

```
set ea_enableActionHistory "true"
set ea_actionHistoryExpiry 120
```

Setting `ea_enableActionHistory` to `false` only stops **new** entries being recorded — existing entries remain stored and visible. Expired entries are pruned on resource start and then hourly.

## Viewing History

The action history for a player is shown on the player detail page in the NUI, gated by the `easyadmin.player.actionhistory.view` permission. It is also available from Discord with `/history`, which requires the `easyadmin.bot.history` permission.

Entries are matched to a player by **any** shared identifier — one match is enough — so history follows a player across name changes and reconnects.

## Adding Entries

There is no way to add an action history entry from the NUI. Entries are only created by the actions listed above, or by server-side code and plugins (see [Events](#events)).

The `easyadmin.player.actionhistory.add` permission is declared but **not enforced anywhere**, so it currently has no effect.

## Deleting Entries

Admins with `easyadmin.player.actionhistory.delete` can delete individual entries from the player detail page in the NUI.

## Storage

Entries are stored in `resources/EasyAdmin/data/actions.json`. On first load, a legacy `actions.json` in the resource root is migrated to the new path automatically.

Each entry contains:

| Field | Description |
|-------|-------------|
| `time` | Unix timestamp (seconds) of the action |
| `id` | Unique action ID |
| `action` | Type of action (`BAN`, `OFFLINE BAN`, `KICK`, `WARN`, or a plugin-supplied type) |
| `idents` | Player identifiers at the time of the action |
| `reason` | Reason or description |
| `moderator` | Name of the admin who performed the action |
| `moderatorIdents` | Identifiers of the admin |
| `banid` | Associated ban ID (if applicable) |

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:getActionHistory(identifiers)` | Get action history for a set of identifiers |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:LogAction` | Record an action in the history |

`EasyAdmin:LogAction` is a server-side event only — it is not a net event, so it cannot be triggered from the client or the NUI. Fire it from server-side code or a plugin with `TriggerEvent`:

```lua
TriggerEvent("EasyAdmin:LogAction", {
    action = "CUSTOM",
    identifiers = { "license:1100001123456789" },
    reason = "Example entry",
    moderator = "Console",
    moderatorIdents = {},
    banid = "1234",
})
```

| Key | Required | Description |
|-----|----------|-------------|
| `action` | Yes | Action type string, stored as-is |
| `identifiers` | No | Identifiers to attach the entry to. When omitted, the identifiers of the player passed as the event's second argument are used, resolved from the player cache first |
| `reason` | No | Reason or description |
| `moderator` | No | Moderator name. Defaults to `Console` |
| `moderatorIdents` | No | Moderator identifiers. Defaults to an empty table |
| `banid` | No | Associated ban ID |

An entry with no identifiers or a resolvable player cannot be matched to any player, so it will never be shown.

## See Also

- [Admin Notes](../admin-notes) — Persistent notes on player profiles
- [Action History and Admin Notes](../../configuration/action-history) — Convar and permission reference
- [Ban List](../ban-list) — Ban management and custom banlist events
- [Discord Bot Commands](../../discord/bot-commands) — `/history` and `/notes`
