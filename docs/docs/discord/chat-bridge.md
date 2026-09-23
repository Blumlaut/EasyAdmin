# Chat Bridge

The chat bridge connects the in-game FiveM chat with a Discord channel, so messages written in one place also show up in the other.

## Requirements

- The `chat` resource from [cfx-server-data](https://github.com/citizenfx/cfx-server-data), kept up to date. Older versions do not support the bridge.
- A configured and running EasyAdmin Discord bot — see [Bot Setup](../bot-setup).

## Setup

1. Create a Discord channel for the chat bridge.
2. Copy the channel ID (right-click the channel and choose **Copy Channel ID**).
3. Add the channel ID to your `server.cfg`:

```
set ea_botChatBridge "123456789012345678"
```

The bridge stays off until this is set. Leave it empty to disable the bridge again.

## Behavior

- Messages posted in the configured Discord channel appear in in-game chat for every player, shown as the Discord username followed by the message.
- Chat messages written by players in game are posted to the Discord channel as an embed, with the player's in-game name and their CFX forum profile picture if they have one linked.

Only player chat is sent to Discord. Console output and other non-player chat entries are not bridged.

## Admin Chat

EasyAdmin also adds an in-game admin chat mode. This is separate from the Discord bridge and nothing written there is sent to Discord.

The **Admin Chat** mode is only available while the `chat` resource is running. Players need the `easyadmin.server.chat` permission to see and use it. Turn the mode on or off with:

```
set ea_enableChat "true"
```

Default: `true`
