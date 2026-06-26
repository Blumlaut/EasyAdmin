# Server Status

The Discord bot can display a live-updating server status message in a designated Discord channel.

## Setup

1. Create a Discord channel for the status display. It should be a read-only channel (players don't need to post here).
2. Copy the channel ID.
3. Add it to your `server.cfg`:

```
set ea_botStatusChannel "123456789012345678"
```

Default: `true` (enabled when a channel ID is set)

## Displayed Information

The status message shows:

- Player count (current / max)
- Number of admins online
- Number of pending reports
- Server uptime
- Upvote count (if configured)

The status message updates periodically to reflect current server state.
