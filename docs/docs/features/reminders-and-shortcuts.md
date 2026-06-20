# Reminders and Shortcuts

EasyAdmin provides reason text shortcuts and periodic chat reminders for admins.

## Reason Shortcuts

Shortcuts replace abbreviated text with full reason strings when submitting bans, kicks, or warnings.

### Adding Shortcuts

Add shortcuts via the NUI Shortcuts page or the `/ea_addShortcut` command:

```
/ea_addShortcut grief "Griefing: Deliberately disrupting gameplay"
```

Shortcuts added via command are not persisted across server restarts. To make shortcuts persistent, add them via the NUI.

### Using Shortcuts

Type the shortcut keyword in the reason text field. EasyAdmin automatically replaces it with the full text.

### Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.shortcut.add` | Use the `/ea_addShortcut` command |

## Chat Reminders

Periodic reminders are sent to the chat at configurable intervals. Reminders are selected randomly from the list of active shortcuts.

### Configuration

Set the reminder interval in minutes:

```
set ea_chatReminderTime 30
```

Default: `0` (disabled)

Set to `0` to disable reminders.

### Placeholder Variables

Reminders support dynamic placeholders:

| Placeholder | Replaced With |
|-------------|---------------|
| `@admins` | Comma-separated list of online admin names |
| `@bancount` | Current number of bans on the server |
| `@time` | Current server time (HH:MM:SS) |
| `@date` | Current server date (locale-dependent) |

Example reminder:

```
Server status: @bancount bans active. Online admins: @admins
```

### Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.reminder.add` | Use the `/ea_addReminder` command |

## Adding Reminders

Add a non-persistent reminder via command:

```
/ea_addReminder "Remember to check the banlist regularly"
```

Reminders added via command are cleared on server restart.
