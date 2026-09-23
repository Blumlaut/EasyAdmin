# Command Reference

EasyAdmin commands can be run from in-game chat, the server console, or the NUI menu. Each entry lists where the command can be used, the arguments it takes, and the permission it needs. Server-side commands can always be run from the server console.

## Opening the Menu

### /easyadmin

Open the EasyAdmin menu.

Alias: `/ea`

## Ban and Kick

### /ban

Permanently ban a player. In-game only.

Usage: `/ban [playerID] [reason]`

Requires: `easyadmin.player.ban.permanent`

Temporary bans are issued from the NUI menu.

### /unban

Unban a player by ban ID or by identifier.

Usage: `/unban [banID or identifier]`

Requires: `easyadmin.player.ban.remove`

### /kick

Kick a player. In-game only.

Usage: `/kick [playerID] [reason]`

Requires: `easyadmin.player.kick`

## Player Actions

### /slap

Slap a player, removing the given amount of health.

Usage: `/slap [playerID] [amount]`

Requires: `easyadmin.player.slap`

### /spectate

Spectate a player. In-game only.

Usage: `/spectate [playerID]`

Requires: `easyadmin.player.spectate`

## Reports

### /calladmin

Ask an admin for help. Available to every player.

Usage: `/calladmin [reason]`

### /report

Report a player. Available to every player.

Usage: `/report [player name or ID] [reason]`

Both commands can be renamed or turned off in the server configuration. See [Command Configuration](../../configuration/commands).

## Server Management

### /setgametype

Set the server game type.

Usage: `/setgametype [gametype]`

Requires: `easyadmin.server.convars`

### /setmapname

Set the server map name.

Usage: `/setmapname [mapname]`

Requires: `easyadmin.server.convars`

## Information

### /ea_printIdentifiers

Print a player's identifiers to the server console. Server console only.

Usage: `/ea_printIdentifiers [playerID]`

## Shortcuts and Reminders

### /ea_addShortcut

Add a reason shortcut.

Usage: `/ea_addShortcut [keyword] [full text]`

Requires: `easyadmin.server.shortcut.add`

Shortcuts are not saved and are lost when the server restarts. See [Shortcuts, Reminders, and Allowlist](../../configuration/shortcuts).

### /ea_addReminder

Add a chat reminder.

Usage: `/ea_addReminder [message text]`

Requires: `easyadmin.server.reminder.add`

Reminders are not saved and are lost when the server restarts.

## Backups

### /ea_createBackup

Create a banlist backup.

Requires: `easyadmin.server`

### /ea_loadBackup

Load a banlist backup by filename.

Usage: `/ea_loadBackup [filename]`

Requires: `easyadmin.server`

## Webhooks

### /ea_testWebhook

Send a test message to the configured webhooks.

Requires: `easyadmin.server`

### /ea_excludeWebhookFeature

Exclude features from webhook notifications.

Usage: `/ea_excludeWebhookFeature [feature1] [feature2] ...`

Run without arguments to reset the exclusions.

Requires: `easyadmin.server`

## Discord Bot

### /ea_addBotLogForwarding

Send a feature's log messages to a Discord channel.

Usage: `/ea_addBotLogForwarding [feature] [channelID]`

Requires: `easyadmin.server`

Forwarding rules are not saved.

## See Also

- [Permissions Overview](../../permissions) — Permission requirements for commands
- [Command Configuration](../../configuration/commands) — Command names and options
- [Reports](../../features/reports) — The calladmin and report features
- [Shortcuts & Reminders](../../features/reminders-and-shortcuts) — Shortcut and reminder options
- [Discord Bot Commands](../../discord/bot-commands) — Slash commands run from Discord
