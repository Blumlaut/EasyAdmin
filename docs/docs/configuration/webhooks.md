# Webhooks and Screenshot Configuration

EasyAdmin sends Discord notifications for moderation actions through webhooks. It also supports configuring screenshot upload destinations.

> **Note:** If the Discord bot logging channel (`ea_botLogChannel`) is configured, webhook notifications are disabled. The bot sends logs to Discord instead.

## Webhook Channels

Three separate webhook URLs can be configured for different notification types:

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_moderationNotification` | `false` | Main webhook for moderation actions (kicks, bans, warns, mutes, screenshots) |
| `ea_reportNotification` | `false` | Webhook for report and calladmin notifications. Falls back to `ea_moderationNotification` if not set |
| `ea_detailNotification` | `false` | Webhook for detail actions (spectate, teleport, freeze, slap, cleanup, settings changes, resource management). Falls back to `ea_moderationNotification` if not set |

Example:

```
set ea_moderationNotification "https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz"
set ea_reportNotification "https://discord.com/api/webhooks/987654321/zyxwvutsrqponmlkjihgfedcba"
set ea_detailNotification "https://discord.com/api/webhooks/111222333/abcdefghijklmnopqrstuvwx"
```

To disable all webhooks, set the relevant convar to `false` (the default).

## Excluding Webhook Features

Individual webhook notification types can be disabled using the `ea_excludeWebhookFeature` command. Run this in the server console or in-game:

```
ea_excludeWebhookFeature kick ban slap warn
```

Available feature names:

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
- `cleanup` — Server cleanup notifications

Run the command without arguments to reset exclusions.

## Date Format

Customize the date/time format used in webhook messages and ban screens. Uses standard Lua date format specifiers.

```
setr ea_dateFormat "%d/%m/%Y %H:%M:%S"
```

Common format specifiers:

- `%d` — Day (01-31)
- `%m` — Month (01-12)
- `%Y` — Four-digit year
- `%H` — Hour (00-23)
- `%M` — Minute (00-59)
- `%S` — Second (00-59)

Default: `%d/%m/%Y %H:%M:%S`

## Screenshot Upload

When an admin takes a screenshot of a player, the image is captured natively (Three.js + CfxTexture), downsampled, encoded as WebP, and uploaded to a configured endpoint.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_screenshoturl` | `https://wew.wtf/upload.php` | URL to upload screenshots to |
| `ea_screenshotfield` | `files[]` | Form field name for the uploaded file |
| `ea_screenshotMaxResolution` | `1280` | Max length of the longer dimension (px). Shorter dimension scales to match aspect ratio. |
| `ea_screenshotQuality` | `0.8` | WebP encoding quality (0.0–1.0). |
| `ea_enableReportScreenshots` | `true` | Automatically take a screenshot when a player is reported |

To use Discord as a screenshot uploader:

```
setr ea_screenshoturl "https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz"
setr ea_screenshotfield "files[]"
```

The screenshot endpoint receives a POST request with the image data.

## Log Identifiers

Controls which identifiers are included in webhook messages and logs.

```
set ea_logIdentifier "steam,discord,license"
```

Comma-separated list of identifier types to include. Order determines display order.

Available types: `steam`, `discord`, `license`, `xbl`, `live`, `ip`, `discordId`, `fivem`, `a2s`, `appinfo`, `fortnite`, `opsgenie`, `epic`, `teamcenter`, `ssauth`, `xbl2`

Set to `false` to disable identifiers in logs entirely.

Default: `steam`

## Testing Webhooks

Use the `ea_testWebhook` command to send test messages to all configured webhooks. Requires server-level permissions.

```
ea_testWebhook
```
