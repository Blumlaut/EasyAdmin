# Discord Bot Setup

EasyAdmin includes an integrated Discord bot that allows server management from Discord. The bot is bundled with EasyAdmin and does not require external hosting.

## Prerequisites

- A Discord bot token
- A Discord server to add the bot to
- The bot must have **Privileged Gateway Intents** enabled (required for the bot to function)

## Creating the Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name.
3. Go to the **Bot** tab.
4. Click **Add Bot** if prompted.
5. Under **Privileged Gateway Intents**, enable:
   - **Guild Members Intent**
   - **Message Content Intent**

> Without these intents, the bot will fail to connect with an error about privileged intents.

6. Copy the bot token (click **Reset Token** if you need a new one).

## Inviting the Bot

Generate an invite URL with the required permissions:

```
https://discord.com/oauth2/authorize?scope=applications.commands%20bot&permissions=277562354688&client_id=YOUR_BOT_ID
```

Replace `YOUR_BOT_ID` with your bot's Application ID (found in the Discord Developer Portal under **General Information**).

Click the link and select your server to invite the bot.

## Configuring the Bot

Add the bot token to your `server.cfg`:

```
set ea_botToken "your-bot-token-here"
```

Restart your server. If the bot connects successfully, you will see a message in the console:

```
[    script:EasyAdmin] Logged in as BotName#1234!
```

The bot will appear online in your Discord server.

## Bot Permissions

The bot requires specific Discord channel permissions to function:

- **Send Messages** — For chat bridge and status updates
- **View Channels** — To read messages in the chat bridge channel
- **Embed Links** — For formatted messages
- **Read Message History** — For chat bridge functionality
- **Use Slash Commands** — Required for bot commands

The invite URL above includes the necessary permissions. If you customize the invite, ensure these permissions are granted.

## See Also

- [Bot Commands](../bot-commands) — List of all available bot commands
- [Logging](../logging) — Configure the bot logging channel
- [Chat Bridge](../chat-bridge) — Sync chat between Discord and FiveM
- [Server Status](../server-status) — Live server status display
- [Discord ACE Permissions](../discord-ace) — Map Discord roles to FiveM permissions
- [Webhooks](../../configuration/webhooks) — Set up moderation notifications
