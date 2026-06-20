# Reports

Reports allow players to flag other players for rule violations. They are displayed in the NUI and can trigger automatic moderation actions.

## Report Types

### Player Reports

Players can report other players using the report command. Reports are visible to admins in the NUI and can be claimed, processed, or closed.

### Calladmin

Players can call for admin assistance using the calladmin command. This creates a report without targeting another player.

## Commands

### /report

Report a player.

Usage: `/report [playerID] [reason]`

Requires `ea_enableReportCommand` to be enabled (default: `true`).

### /calladmin

Call an admin for assistance.

Usage: `/calladmin [reason]`

Requires `ea_enableCallAdminCommand` to be enabled (default: `true`).

Customize the command name:

```
set ea_callAdminCommandName "help"
set ea_reportCommandName "report"
```

## Report Settings

### Minimum Reports

The number of reports required before automatic action is taken.

```
set ea_defaultMinReports 3
```

Default: `3`

### Player Count Modifier

When enabled, the minimum report count scales with the number of online players.

```
set ea_MinReportModifierEnabled "true"
```

Default: `true`

The adjusted minimum is calculated as: `floor(playerCount / ea_MinReportModifier)`

Configuration:

```
set ea_MinReportPlayers 12
set ea_MinReportModifier 4
```

- `ea_MinReportPlayers` — Minimum players online for the modifier to activate (default: `12`)
- `ea_MinReportModifier` — Divisor for the calculation (default: `4`)

### Auto-Ban

When the minimum report count is reached for a player, they are automatically banned.

```
set ea_ReportBanTime 86400
```

Ban duration in seconds. Default: `86400` (24 hours).

### Report Screenshots

Automatically take a screenshot when a player is reported.

```
set ea_enableReportScreenshots "true"
```

Default: `true`

Screenshot capture is built into EasyAdmin — no external resources required.

## Report Lifecycle

1. A player files a report via `/report` or `/calladmin`
2. The report appears in the NUI Reports page and triggers notifications to online admins
3. An admin claims the report (prevents duplicate handling)
4. The admin processes the report (closes it)
5. The report is removed from the list

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.reports.view` | View reports in the NUI |
| `easyadmin.player.reports.claim` | Claim unclaimed reports |
| `easyadmin.player.reports.process` | Close/delete reports |

## Report Data

Each report entry contains:

| Field | Description |
|-------|-------------|
| `id` | Unique report ID |
| `type` | Report type (1 = player report, 0 = calladmin) |
| `reporter` | Player ID of the reporter |
| `reporterName` | Name of the reporter |
| `reported` | Player ID of the reported player (nil for calladmin) |
| `reportedName` | Name of the reported player |
| `reason` | Report reason text |
| `reportTime` | Unix timestamp of the report |
| `reportTimeFormatted` | Human-readable time ago string |
| `claimed` | Whether the report has been claimed |
| `claimedBy` | Admin ID who claimed the report |
| `claimedName` | Name of the claiming admin |

## API Exports

| Export | Description |
|--------|-------------|
| `EasyAdmin:getAllReports()` | Get all active reports |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:reportAdded` | Triggered when a report is filed |
| `EasyAdmin:reportClaimed` | Triggered when a report is claimed |
| `EasyAdmin:reportRemoved` | Triggered when a report is closed |
