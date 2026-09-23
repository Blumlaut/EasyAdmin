# Bot Logging

When the Discord bot logging channel is configured, moderation actions are sent to Discord through the bot instead of webhooks. Webhook notifications are disabled while bot logging is active.

## Configuring the Logging Channel

1. In Discord, right-click the channel where you want logs sent and select **Copy Channel ID**.
2. Add the channel ID to your `server.cfg`:

```
set ea_botLogChannel "123456789012345678"
```

All moderation actions (bans, kicks, warns, mutes, etc.) are sent to this channel as embed messages.

## Log Forwarding

Every log type goes to the main logging channel by default. To send one log type to a different channel, use the `ea_addBotLogForwarding` command:

```
ea_addBotLogForwarding joinleave 123456789012345678
ea_addBotLogForwarding ban 123456789012345678
```

Give the log type first, then the channel ID. Both are required — the command does nothing if either is missing.

Run it from the server console, or in-game with the `easyadmin.server` permission. Forwarding only works while the bot is running and `ea_botLogChannel` is set. Forwarding rules are not saved, so set them again after the bot restarts.

Available log types:

- `kick` — Player kick notifications
- `ban` — Player ban notifications
- `slap` — Slap action notifications
- `warn` — Warning notifications
- `teleport` — Teleport notifications
- `freeze` — Freeze and unfreeze notifications
- `spectate` — Spectate notifications
- `settings` — Server setting changes, resource start/stop, announcements
- `calladmin` — Player calladmin reports
- `report` — Player report notifications
- `reports` — Report claim and close notifications
- `screenshot` — Screenshot capture notifications
- `mute` — Mute, unmute and Emergency Mode notifications
- `cleanup` — Cleanup notifications
- `joinleave` — Player join and leave notifications
- `startup` — Bot startup messages

## Webhook Fallback

When bot logging is not configured (`ea_botLogChannel` is empty), EasyAdmin falls back to webhook notifications as described in the [Webhooks](../../configuration/webhooks) guide.
