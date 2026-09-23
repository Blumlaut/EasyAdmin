# Server Status

EasyAdmin's Discord bot can keep a live status message in a Discord channel. Staff and players can see how busy the server is without having to join it.

## Setup

1. Create a dedicated channel for the status display. The bot keeps a single status message in this channel and removes other messages posted there, so don't pick a channel you need for anything else.
2. Make sure the bot can view the channel, send messages, embed links, read message history and manage messages. The recommended bot invite already covers this.
3. Copy the channel ID: enable **Developer Mode** in Discord's settings, then right-click the channel and choose **Copy Channel ID**.
4. Add it to your `server.cfg`:

```
set ea_botStatusChannel "123456789012345678"
```

The status message is off by default and is only shown once you set a valid channel ID. Restart the server after adding the convar.

## Displayed Information

The status message shows:

- Server name
- Players online (current / maximum)
- Admins online
- Reports, including how many are already claimed
- Active vehicles, peds and objects
- Uptime, which resets when EasyAdmin is restarted

If your server is hosted through Cfx.re, so that its base URL is a cfx.re address, the message also links to your server page, adds a **Join Server** button, and shows your upvotes and bursts.

## Updating

The bot posts the message about 10 seconds after starting and refreshes it every 3 minutes. Anything posted in the status channel is deleted and triggers an immediate refresh, so you can force an update by sending a message there — the message is then marked as a manual update.
