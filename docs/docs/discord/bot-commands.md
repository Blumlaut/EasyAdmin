# Bot Commands

The Discord bot provides slash commands for server management. Every command needs its own permission, `easyadmin.bot.<command>`. Granting `easyadmin.bot` covers all of them. See [Bot Permissions](../../permissions/bot-permissions) for how to grant them.

The owner of the Discord server the bot runs on has every permission automatically.

## User Actions

### /ban

Ban a player from the server.

Parameters:
- `user` — Username or ID (required)
- `reason` — Reason text (required)
- `timeframe` — Duration such as `30 mins`, `1 hour`, `2 weeks` or `permanent` (required)

Permission: `easyadmin.bot.ban`, plus `easyadmin.player.ban.temporary` for a timed ban or `easyadmin.player.ban.permanent` for a permanent ban.

### /unban

Unban a player by ban ID.

Parameters:
- `banid` — Ban ID number (required)

Permission: `easyadmin.bot.unban`

### /kick

Kick a player from the server.

Parameters:
- `user` — Username or ID (required)
- `reason` — Reason text (required)

Permission: `easyadmin.bot.kick`

### /mute

Mute a player in chat.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.mute`

### /unmute

Unmute a player in chat.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.unmute`

### /freeze

Freeze a player in place.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.freeze`

### /unfreeze

Unfreeze a player.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.unfreeze`

### /slap

Slap a player, removing health.

Parameters:
- `user` — Username or ID (required)
- `amount` — Amount of HP to remove (required, integer)

Permission: `easyadmin.bot.slap`

### /warn

Issue a warning to a player.

Parameters:
- `user` — Username or ID (required)
- `reason` — Reason text (required)

Permission: `easyadmin.bot.warn`

### /screenshot

Take a screenshot of a player's screen.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.screenshot`

## Information

### /playerinfo

View information about a player, including identifiers.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.playerinfo`

### /playerlist

Show a paginated list of all players on the server.

Permission: `easyadmin.bot.playerlist`

### /history

View the action history for a player (bans, kicks, warnings, etc.).

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.history`

### /notes

View admin notes for a player.

Parameters:
- `user` — Username or ID (required)

Permission: `easyadmin.bot.notes`

### /baninfo

View details of a specific ban entry.

Parameters:
- `banid` — Ban ID number (required)

Permission: `easyadmin.bot.baninfo`

### /announce

Send an announcement to all players on the server.

Parameters:
- `reason` — Announcement text (required)

Permission: `easyadmin.bot.announce`

## Server Management

### /cleanup

Clean up entities in the server world.

Parameters:
- `type` — Type of entity to clean up (required). Choices: `cars`, `peds`, `props`

Permission: `easyadmin.bot.cleanup`

### /refreshperms

Refresh your EasyAdmin permissions.

Parameters:
- `user` — Discord user to refresh permissions for (optional)

Permission: none for a self-refresh. Refreshing another user, or using the `user` option at all, needs `easyadmin.bot.refreshperms`.

## Permission Reference

| Permission | Commands |
|------------|----------|
| `easyadmin.bot.announce` | `/announce` |
| `easyadmin.bot.ban` | `/ban` (see below) |
| `easyadmin.bot.baninfo` | `/baninfo` |
| `easyadmin.bot.cleanup` | `/cleanup` |
| `easyadmin.bot.freeze` | `/freeze` |
| `easyadmin.bot.history` | `/history` |
| `easyadmin.bot.kick` | `/kick` |
| `easyadmin.bot.mute` | `/mute` |
| `easyadmin.bot.notes` | `/notes` |
| `easyadmin.bot.playerinfo` | `/playerinfo` |
| `easyadmin.bot.playerlist` | `/playerlist` |
| `easyadmin.bot.refreshperms` | `/refreshperms` for another user |
| `easyadmin.bot.screenshot` | `/screenshot` |
| `easyadmin.bot.slap` | `/slap` |
| `easyadmin.bot.unban` | `/unban` |
| `easyadmin.bot.unfreeze` | `/unfreeze` |
| `easyadmin.bot.unmute` | `/unmute` |
| `easyadmin.bot.warn` | `/warn` |

Two commands need more than their own bot permission:

- `/ban` also needs `easyadmin.player.ban.temporary` for a timed ban, or `easyadmin.player.ban.permanent` for a permanent ban.
- `/refreshperms` with no options needs no permission. Using the `user` option, even on yourself, needs `easyadmin.bot.refreshperms`.
