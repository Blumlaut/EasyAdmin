# Shortcuts, Reminders, and Allowlist

## Reason Shortcuts

Reason shortcuts let you type a short keyword instead of the same long moderation reason. When you enter just the keyword as the reason for a ban, kick or warning, EasyAdmin replaces it with the full text before the action is carried out.

Add a shortcut with the `ea_addShortcut` command:

```
ea_addShortcut rdm "RDMing is not allowed, please read our Rules! (/rules)"
ea_addShortcut vdm "VDMing is not allowed, please read our Rules! (/rules)"
ea_addShortcut stfu "Please be respectful in Voice and Text Chat! (/rules)"
```

Format: `ea_addShortcut [keyword] [full text]`

- The keyword is a single word and is matched case-insensitively.
- The full text is everything after the keyword.
- The keyword only expands when it is the whole reason, not part of a longer sentence.

Requires the `easyadmin.server.shortcut.add` permission. The server console can always run the command.

Shortcuts are not saved. They are lost when the server restarts, so add them again after a restart or list them in `server.cfg` after EasyAdmin starts. Admins who are online see new shortcuts straight away, and admins who join later get the current list.

## Chat Reminders

Chat reminders are periodic messages sent to all players' chat. A random reminder is selected from the list at each interval. Nothing is sent until at least one reminder has been added.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_chatReminderTime` | `0` | Interval in minutes between reminders. Set to `0` to disable |

Add reminders using the `ea_addReminder` command:

```
ea_addReminder "Online Admins: @admins"
ea_addReminder "Current time: @time"
ea_addReminder "Our banlist has @bancount entries"
```

Requires the `easyadmin.server.reminder.add` permission. The server console can always run the command.

Reminders are not saved. Add them again after a restart, or list them in `server.cfg` after EasyAdmin starts.

### Placeholders

| Placeholder | Replaced With |
|-------------|---------------|
| `@admins` | Names of the admins who are online, or the text `@admins` if none are online |
| `@bancount` | Number of entries in the banlist |
| `@time` | Current time |
| `@date` | Today's date |

Color codes (`^1` through `^9`) can be used in reminder text.

Reminders are sent as chat messages from "EasyAdmin".

## Allowlist

The allowlist restricts server access to players with the `easyadmin.player.allowlist` permission only.

```
set ea_enableAllowlist "true"
```

When enabled, players without the `easyadmin.player.allowlist` permission are denied connection with a message. Players with the permission (typically admins and whitelisted community members) can connect normally.

This is checked during the player connection deferral, after the banlist check, so banned players are still shown their ban message.

### Adding to the Allowlist

Grant the permission with an ACE in `server.cfg`, the same way as any other EasyAdmin permission.

Grant it to a player's identifier:

```
add_ace identifier.steam:1100001018c7433 easyadmin.player.allowlist allow
```

Or add them to a group that has the permission:

```
add_principal identifier.steam:1100001018c7433 group.whitelisted
add_ace group.whitelisted easyadmin.player.allowlist allow
```
