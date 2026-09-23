# In-Game Commands and Warnings

Configure the `/calladmin` and `/report` commands, and set up automatic actions when a player reaches the maximum warning count.

## Calladmin Command

Players use this command to request admin assistance. They must give a reason.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableCallAdminCommand` | `true` | Enable or disable the calladmin command |
| `ea_callAdminCommandName` | `calladmin` | The command name players type (e.g., `calladmin`, `help`) |
| `ea_callAdminCooldown` | `60` | Seconds a player must wait before calling an admin again |

Example:

```
set ea_enableCallAdminCommand "true"
set ea_callAdminCommandName "help"
set ea_callAdminCooldown 30
```

Usage by players:

```
/calladmin [reason]
```

Online admins receive a notification with the player's name, reason, and a report ID. Notifications go to the report webhook (`ea_reportNotification`), or to the moderation webhook (`ea_moderationNotification`) if no report webhook is set.

## Report Command

Players use this command to report other players. Once enough players have reported the same player, that player is automatically banned.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableReportCommand` | `true` | Enable or disable the report command |
| `ea_reportCommandName` | `report` | The command name players type (e.g., `report`, `suspect`) |
| `ea_defaultMinReports` | `3` | Minimum number of reports needed to auto-ban a player |
| `ea_ReportBanTime` | `86400` | Duration of the auto-ban in seconds (default: 24 hours) |
| `ea_enableReportScreenshots` | `true` | Automatically take a screenshot when a player is reported |

Example:

```
set ea_enableReportCommand "true"
set ea_reportCommandName "suspect"
set ea_defaultMinReports 5
set ea_ReportBanTime 604800
```

Usage by players:

```
/report [player name or ID] [reason]
```

Each player can report the same target only once.

### Report Modifier

Busy servers usually need more reports before an auto-ban, which makes mass-report abuse harder.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_MinReportModifierEnabled` | `true` | Enable the player-count-based report modifier |
| `ea_MinReportPlayers` | `12` | Player count the modifier activates above |
| `ea_MinReportModifier` | `4` | Whole number to divide the player count by |

How it works: once more than `ea_MinReportPlayers` players are online, the minimum report count is recalculated by dividing the player count by `ea_MinReportModifier` and rounding to the nearest whole number (halves round up). With 24 players online and a divisor of 4, the minimum becomes 6 reports instead of 3; with 26 players it becomes 7.

To disable the modifier (use a fixed minimum regardless of player count):

```
set ea_MinReportModifierEnabled "false"
```

## Warning System

Track warnings per player and trigger automatic actions when the limit is reached.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_maxWarnings` | `3` | Maximum warnings before automatic action |
| `ea_warnAction` | `kick` | Action after max warnings: `kick` or `ban` |
| `ea_warningBanTime` | `604800` | Ban duration in seconds if `ea_warnAction` is `ban` (default: 7 days) |

Example:

```
set ea_maxWarnings 3
set ea_warnAction "ban"
set ea_warningBanTime 2592000
```

When a player is warned, they receive an in-game warning message showing the reason, current warning count, and maximum. When the limit is reached, the configured action (kick or ban) is executed automatically.

Warnings are kept in memory only. They are not saved to the banlist, and restarting the server clears them.
