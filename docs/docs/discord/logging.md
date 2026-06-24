# Bot Logging

When the Discord bot logging channel is configured, moderation actions are sent to Discord through the bot instead of webhooks. Webhook notifications are disabled when bot logging is active.

## Configuring the Logging Channel

1. In Discord, right-click the channel where you want logs sent and select **Copy Channel ID**.
2. Add the channel ID to your `server.cfg`:

```
set ea_botLogChannel "123456789012345678"
```

All moderation actions (bans, kicks, warns, mutes, etc.) are sent to this channel as embed messages.

## Log Forwarding

Forward specific log types to additional channels using the `ea_addBotLogForwarding` command:

```
ea_addBotLogForwarding joinleave 123456789012345678
ea_addBotLogForwarding ban 123456789012345678
```

Available log types:

- `kick` — Player kick notifications
- `ban` — Player ban notifications
- `slap` — Slap action notifications
- `warn` — Warning notifications
- `teleport` — Teleport notifications
- `freeze` — Freeze/unfreeze notifications
- `spectate` — Spectate notifications
- `settings` — Server setting changes, resource start/stop, announcements
- `calladmin` — Player calladmin reports
- `report` — Player report notifications
- `reports` — Report claim/close notifications
- `screenshot` — Screenshot capture notifications
- `permissions` — Permission edits
- `joinleave` — Player join/leave notifications

Run the command with a log type and channel ID to forward that type. Run without arguments to list current forwarding rules.

## Webhook Fallback

When bot logging is not configured (`ea_botLogChannel` is empty), EasyAdmin falls back to webhook notifications as described in the [Webhooks](configuration/webhooks) guide.
