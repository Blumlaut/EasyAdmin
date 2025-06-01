# Discord Bot Guide

This document explains how to set up and use the **Discord bot included with EasyAdmin 6.6 and newer**. This bot lets you manage your FiveM server from Discord.

---

## 🚀 What is the Discord Bot?

The **Discord bot is included with EasyAdmin** and does **not require external hosting**. This is especially useful for:

- Containerized FiveM setups
- Hosted servers (e.g., ZAP-Hosting)

---

## 🔧 Features

The bot offers the following functionality:

| Feature | Description |
|--------|-------------|
| **User Actions** | Kick, Ban, Unban, Mute, Unmute, Freeze, Slap, Warn |
| **Principals** | Add/remove Discord users to ACE groups directly from Discord |
| **Live Server Status** | Player count, admins online, reports, uptime, upvotes |
| **Area Cleanup** | Remove vehicles, peds, and objects in an area |
| **Player List** | Full, paginated list (compatible with OneSync) |
| **Player Info** | View identifiers and other details |
| **Discord ACE Permissions** | Assign permissions via Discord roles directly to FiveM ACE groups |
| **Chat Bridge** | Sync chat between Discord and FiveM |
| **Logging** | Log actions in a dedicated channel |

---

## 🤖 Creating the Bot User

1. Go to [Discord Developer Apps](https://discord.com/developers/applications).
2. Create a new application.
3. Under the **Bot** tab, create a bot user.
4. **Enable all Privileged Gateway Intents** (required for the bot to work).

   > ❗ If you don't enable these, you'll get an error like:  
   > `Privileged intent provided is not enabled or whitelisted`

---

## 🔄 Inviting the Bot

Use this link to invite the bot to your server:

```
https://discord.com/oauth2/authorize?scope=applications.commands%20bot&permissions=277562354688&client_id=MY_BOT_ID
```

- Replace `MY_BOT_ID` with your bot's Application ID (found in Discord Developer Portal).
- If you get a **401 error**, kick the bot and invite it again using the link.

---

## ⚙️ Configuring the Bot

Add the following to your `server.cfg` to let EasyAdmin log in using the bot:

```ini
set ea_botToken "your-bot-token-here"
```

- Replace `your-bot-token-here` with the token from the Discord Developer Portal.

Start your server. If the bot logs in successfully, you'll see this in your console:

```
[    script:EasyAdmin] Logged in as BotName#1234!
```

Check your Discord server to confirm the bot is online.

> 🧑‍💼 The **server owner** has all permissions by default. For others, assign permissions manually using `easyadmin.bot`.

---

## 🔐 Configuring Bot Permissions

All bot permissions are grouped under the `easyadmin.bot` category.

Here's a **recommended configuration** for regular admins who should **not modify permissions**:

```ini
add_ace group.admin easyadmin.bot.kick allow
add_ace group.admin easyadmin.bot.mute allow
add_ace group.admin easyadmin.bot.unmute allow
add_ace group.admin easyadmin.bot.freeze allow
add_ace group.admin easyadmin.bot.unfreeze allow
add_ace group.admin easyadmin.bot.slap allow
add_ace group.admin easyadmin.bot.playerinfo allow
add_ace group.admin easyadmin.bot.playerlist allow
```

---

## 🔄 Configuring Features

### 📦 Discord ACE Permissions

You can assign permissions to Discord roles, just like groups in FiveM.

Example:

```ini
add_ace role:604749064436711444 easyadmin allow
add_ace role:604752112227844129 easyadmin.player allow
```

To make a Discord role inherit permissions from a group:

```ini
add_principal role:604749064436711444 group.admin
```

> 🔄 Permissions sync when a player joins or when they run `/refreshperms` in Discord.

#### 🔄 Migrating from Other ACE Resources

If you used a third-party ACE resource like `DiscordAcePerms`, you can replace this:

```json
{655500055000, "group.moderator"},
```

With:

```ini
add_principal role:655500055000 group.moderator
```

Add this to `server.cfg`.

---

### 📜 Bot Logging Channel

To set a logging channel:

1. Copy your Discord channel ID (right-click channel > **Copy Channel ID**).
2. Add this to your `server.cfg`:

```ini
set ea_botLogChannel "ChannelId"
```

> ⚠️ If you set a log channel, the webhook logging will be ignored.

#### 🔄 Log Forwarding

You can forward specific logs to other channels:

```ini
ea_addBotLogForwarding joinleave 604747425512685582
```

Available log types:

```
kick 
ban 
slap 
warn 
teleport 
freeze 
spectate 
settings 
calladmin 
report 
reports 
screenshot 
permissions 
joinleave
```

---

### 📊 Live Server Status

To enable the live server status:

1. Create a **read-only** channel for the bot.
2. Set it in your config:

```ini
set ea_botStatusChannel "ChannelId"
```

The bot will post and update a live status message with server stats.

---

### 💬 Chat Bridge

> ⚠️ Requires the latest `chat` resource from cfx-server-data.

To sync chat between Discord and FiveM:

1. Create a Discord channel for the chat bridge.
2. Add this to your config:

```ini
set ea_botChatBridge "ChannelId"
```

- Messages sent in that Discord channel will appear in FiveM chat.
- Messages sent in FiveM chat will appear in the Discord channel.

---

## ✅ Done!

You're all set! If you need help with anything, check the **EasyAdmin documentation** or reach out in the community.

---

💡 **Tip:** Always test your bot in a test server before deploying to a live one.