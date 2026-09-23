# Reminders and Shortcuts

EasyAdmin has two helpers for staff: reason shortcuts, which turn a short keyword into a full moderation reason, and chat reminders, which repeat a message in chat on a timer.

Both are set up with commands, and both are lost when the server restarts unless you put the commands in `server.cfg`. For the full command and convar reference, see [Shortcuts and Reminders settings](../../configuration/shortcuts).

## Reason Shortcuts

A shortcut is a keyword that stands for a longer reason. When a ban, kick or warn is submitted with that keyword as the reason, EasyAdmin replaces it with the full text.

### Adding Shortcuts

```
/ea_addShortcut grief "Griefing: Deliberately disrupting gameplay"
```

Format: `/ea_addShortcut [keyword] [full text]`. The full text is everything you type after the keyword.

Shortcuts only last until the server restarts. To keep them, put the `ea_addShortcut` commands in `server.cfg` after EasyAdmin starts.

### Using Shortcuts

Type the keyword into the reason field and submit. The reason must be the keyword on its own — a reason of `rdm because they kept ramming` is not replaced, but `rdm` is.

Capitalisation and spaces do not matter: `RDM`, `rdm` and `r d m` all match a shortcut named `rdm`.

Shortcuts work in the reason fields for bans, kicks and warnings, including when you use the Discord bot.

## Chat Reminders

A reminder is a message EasyAdmin posts in chat. On every tick of the timer one reminder is picked at random from the reminder list and sent to everyone on the server — reminders are not staff-only.

Reminders are separate from reason shortcuts. Adding a reminder does not add a shortcut, and shortcuts are never sent as reminders.

### Adding Reminders

```
/ea_addReminder "Remember to check the banlist regularly"
```

Quotation marks are optional and are removed from the text. Like shortcuts, reminders are kept in memory only and are lost on restart, so put the `ea_addReminder` commands in `server.cfg` after EasyAdmin starts if you want them back every time.

### Reminder Interval

```
set ea_chatReminderTime 30
```

`ea_chatReminderTime` is the number of minutes between reminders. The default is `0`, which disables reminders entirely.

### Placeholder Variables

Reminders support dynamic placeholders:

| Placeholder | Replaced With |
|-------------|---------------|
| `@admins` | Comma-separated list of online admin names, or the literal `@admins` if no admin is online |
| `@bancount` | Number of entries on the banlist |
| `@time` | Current time of day (hours, minutes and seconds) |
| `@date` | Current date as set on the server |

Example reminder:

```
Server status: @bancount bans active. Online admins: @admins
```

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.shortcut.add` | Use the `/ea_addShortcut` command |
| `easyadmin.server.reminder.add` | Use the `/ea_addReminder` command |

If an admin does not have the permission for a command, the command is quietly ignored — no error appears in chat. If nothing happens when you add a shortcut or reminder, check that your group has the matching permission.
