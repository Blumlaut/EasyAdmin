# Command Reference

All EasyAdmin commands are server-side and can be run from the server console or in-game by players with the appropriate permissions.

## Ban and Kick

### /ban

Ban a player.

Usage: `/ban [playerID] [reason]`

Requires: `easyadmin.player.ban.temporary` or `easyadmin.player.ban.permanent`

### /unban

Unban a player by ban ID.

Usage: `/unban [banID]`

Requires: `easyadmin.player.ban.remove`

## Player Actions

### /kick

Kick a player.

Usage: `/kick [playerID] [reason]`

Requires: `easyadmin.player.kick`

### /slap

Slap a player (remove health).

Usage: `/slap [playerID] [amount]`

Requires: `easyadmin.player.slap`

### /freeze

Freeze or unfreeze a player.

Usage: `/freeze [playerID]`

Requires: `easyadmin.player.freeze`

### /mute

Mute or unmute a player.

Usage: `/mute [playerID]`

Requires: `easyadmin.player.mute`

### /warn

Warn a player.

Usage: `/warn [playerID] [reason]`

Requires: `easyadmin.player.warn`

### /screenshot

Take a screenshot of a player's screen.

Usage: `/screenshot [playerID]`

Requires: `easyadmin.player.screenshot`

### /spectate

Spectate a player.

Usage: `/spectate [playerID]`

Requires: `easyadmin.player.spectate`

## Teleport

### /tp

Teleport to a player.

Usage: `/tp [playerID]`

Requires: `easyadmin.player.teleport.single`

### /tpp

Teleport a player to you.

Usage: `/tpp [playerID]`

Requires: `easyadmin.player.teleport.single`

### /tpe

Teleport all players to you.

Usage: `/tpe`

Requires: `easyadmin.player.teleport.everyone`

## Server Management

### /cleanup

Clean up entities.

Usage: `/cleanup [cars|peds|props]`

Requires: `easyadmin.server.cleanup.cars`, `easyadmin.server.cleanup.peds`, or `easyadmin.server.cleanup.props`

### /setgametype

Set the server game type.

Usage: `/setgametype [gametype]`

Requires: `easyadmin.server.convars`

### /setmapname

Set the server map name.

Usage: `/setmapname [mapname]`

Requires: `easyadmin.server.convars`

## Information

### /printidentifiers

Print a player's identifiers.

Usage: `/printidentifiers [playerID]`

### /history

View a player's action history.

Usage: `/history [playerID]`

Requires: `easyadmin.player.actionhistory.view`

### /notes

View admin notes for a player.

Usage: `/notes [playerID]`

Requires: `easyadmin.player.adminnotes.view`

## Shortcuts and Reminders

### /ea_addShortcut

Add a reason text shortcut (non-persistent).

Usage: `/ea_addShortcut [keyword] [full text]`

Requires: `easyadmin.server.shortcut.add`

### /ea_addReminder

Add a chat reminder (non-persistent).

Usage: `/ea_addReminder [message text]`

Requires: `easyadmin.server.reminder.add`

## Backups

### /ea_createBackup

Create a banlist backup manually.

### /ea_loadBackup

Load a banlist backup by filename.

Usage: `/ea_loadBackup [filename]`

## Discord Bot

### /ea_addBotLogForwarding

Add a log forwarding rule for the Discord bot.

Usage: `/ea_addBotLogForwarding [feature] [channelID]`

Run without arguments to list current forwarding rules.

### /ea_excludeWebhookFeature

Exclude features from webhook notifications.

Usage: `/ea_excludeWebhookFeature [feature1] [feature2] ...`

Run without arguments to reset exclusions.

### /ea_testWebhook

Test the configured webhook URL.

## See Also

- [Permissions Overview](../../permissions/index) — Permission requirements for commands
- [Configuration](../../configuration/commands) — Command configuration options
- [Reports](../../features/reports) — Report and calladmin commands
- [Shortcuts & Reminders](../../features/reminders-and-shortcuts) — Shortcut and reminder commands
