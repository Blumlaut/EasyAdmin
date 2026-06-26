# Chat Bridge

The chat bridge syncs messages between the FiveM in-game chat and a Discord channel.

## Requirements

- The latest version of the `chat` resource from [cfx-server-data](https://github.com/citizenfx/cfx-server-data)
- The bot must be configured and running

## Setup

1. Create a Discord channel for the chat bridge.
2. Copy the channel ID (right-click the channel, **Copy Channel ID**).
3. Add the channel ID to your `server.cfg`:

```
set ea_botChatBridge "123456789012345678"
```

## Behavior

- Messages sent in the configured Discord channel appear in FiveM chat for all players.
- Messages sent in FiveM chat appear in the Discord channel.
- The chat bridge uses the `chat` resource's message hooks for filtering and formatting.

## Admin Chat

EasyAdmin also provides an admin-only chat channel. This is separate from the chat bridge.

Enable it with:

```
set ea_enableChat "true"
```

Default: `true`

Players without the `easyadmin.server.chat` permission cannot see or send messages in the admin chat channel.
