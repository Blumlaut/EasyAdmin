# In-Game Commands and Warnings

Configure the `/calladmin` and `/report` commands, and set up automatic actions when a player reaches the maximum warning count.

## Calladmin Command

Players use this command to request admin assistance.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableCallAdminCommand` | `true` | Enable or disable the calladmin command |
| `ea_callAdminCommandName` | `calladmin` | The command name players type (e.g., `calladmin`, `help`) |
| `ea_callAdminCooldown` | `60` | Cooldown in seconds between uses per player |

Example:

```
set ea_enableCallAdminCommand "true"
set ea_callAdminCommandName "help"
set ea_callAdminCooldown 30
```

When a player runs the command, admins receive a notification with the player's name, reason, and a report ID. The notification is sent to the report webhook (`ea_reportNotification`) or falls back to the moderation webhook.

## Report Command

Players use this command to report other players. When a player reaches the minimum report threshold, they are automatically banned.

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

### Report Modifier

The report modifier scales the minimum report count based on the number of players online, preventing mass-report abuse on populated servers.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_MinReportModifierEnabled` | `true` | Enable the player-count-based report modifier |
| `ea_MinReportPlayers` | `12` | Minimum number of players online for the modifier to activate |
| `ea_MinReportModifier` | `4` | Divisor for calculating the adjusted minimum (players / divisor = minimum reports) |

How it works: when the player count exceeds `ea_MinReportPlayers`, the minimum report count is recalculated as `floor(playerCount / ea_MinReportModifier)`. For example, with 24 players online and a divisor of 4, the minimum becomes 6 reports instead of the default 3.

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

Warning state is tracked per-player session and is not persisted to the banlist. Resetting the server clears all warnings.
