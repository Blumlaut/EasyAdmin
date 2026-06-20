# Shortcuts, Reminders, and Allowlist

## Reason Shortcuts

Reason shortcuts are text replacements for commonly used moderation reasons. When a player types a shortcut keyword in any reason field (ban, kick, warn, etc.), it expands to the full configured text.

Shortcuts are added via the `ea_addShortcut` command. They are not persisted to disk — they must be re-added after each server restart, or added in `server.cfg` after EasyAdmin starts.

```
ea_addShortcut rdm "RDMing is not allowed, please read our Rules! (/rules)"
ea_addShortcut vdm "VDMing is not allowed, please read our Rules! (/rules)"
ea_addShortcut stfu "Please be respectful in Voice and Text Chat! (/rules)"
```

Format: `ea_addShortcut [keyword] [full text]`

The keyword can be any short string. The full text is everything after the keyword.

Shortcuts are pushed to all online admins' NUI instances when added.

## Chat Reminders

Chat reminders are periodic messages sent to all players' chat. A random reminder is selected from the configured list at each interval.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_chatReminderTime` | `0` | Interval in minutes between reminders. Set to `0` to disable |

Add reminders using the `ea_addReminder` command:

```
ea_addReminder "Online Admins: @admins"
ea_addReminder "Current time: @time"
ea_addReminder "Our banlist has @bancount entries"
```

### Placeholders

| Placeholder | Replaced With |
|-------------|---------------|
| `@admins` | Comma-separated list of online admin names, or `@admins` if none are online |
| `@bancount` | Total number of entries in the banlist |
| `@time` | Current time (Lua `%X` format) |
| `@date` | Current date (Lua `%x` format) |

Color codes (`^1` through `^9`) can be used in reminder text for formatting.

Reminders are sent as chat messages from "EasyAdmin".

## Allowlist

The allowlist system restricts server access to players with the `player.allowlist` permission only.

```
set ea_enableAllowlist "true"
```

When enabled, players without the `easyadmin.player.allowlist` permission are denied connection with a message. Players with the permission (typically admins and whitelisted community members) can connect normally.

This is checked during the player connection deferral, after the banlist check.

### Adding to the Allowlist

Grant the permission to a player's group or identifier:

```
add_ace identifier.steam:1100001018c7433 easyadmin.player.allowlist allow
```

Or add them to a group that has the permission:

```
add_principal identifier.steam:1100001018c7433 group.whitelisted
add_ace group.whitelisted easyadmin.player.allowlist allow
```
