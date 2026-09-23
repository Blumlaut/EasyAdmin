# Webhooks and Screenshot Configuration

EasyAdmin can send Discord notifications for moderation actions through webhooks. It also supports uploading screenshots to an external image host.

> **Note:** If the Discord bot logging channel (`ea_botLogChannel`) is set, logs are sent through the bot and webhook notifications are ignored. Leave it empty to keep using webhooks.

## Webhook Channels

Three separate webhook URLs can be configured for different notification types:

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_moderationNotification` | `false` | Main webhook for moderation actions (kicks, bans, warns, mutes, screenshots) |
| `ea_reportNotification` | `false` | Player reports and calladmin requests. Falls back to `ea_moderationNotification` if not set |
| `ea_detailNotification` | `false` | Detail actions (spectate, teleport, freeze, slap, cleanup, settings changes). Falls back to `ea_moderationNotification` if not set |

Example:

```
set ea_moderationNotification "https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz"
set ea_reportNotification "https://discord.com/api/webhooks/987654321/zyxwvutsrqponmlkjihgfedcba"
set ea_detailNotification "https://discord.com/api/webhooks/111222333/abcdefghijklmnopqrstuvwx"
```

To disable a webhook, leave its convar unset or set it to `false`.

## Excluding Webhook Features

Individual notification types can be turned off with the `ea_excludeWebhookFeature` command. Run this in the server console or in-game:

```
ea_excludeWebhookFeature kick ban slap warn
```

Available feature names:

- `kick` — Player kick notifications
- `ban` — Player ban and unban notifications
- `slap` — Slap action notifications
- `warn` — Warning notifications
- `mute` — Mute and unmute notifications
- `teleport` — Teleport notifications
- `freeze` — Freeze and unfreeze notifications
- `spectate` — Spectate notifications
- `settings` — Server setting changes, resource start/stop, announcements
- `calladmin` — Player calladmin requests
- `report` — Player report notifications
- `reports` — Report claim and close notifications
- `screenshot` — Screenshot capture notifications
- `cleanup` — Server cleanup notifications

Run the command without arguments to reset exclusions.

Plugins can tag their own messages, and those tags can be excluded in the same way. See [Using Webhooks from Plugins](#using-webhooks-from-plugins).

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

The default format shows the date and time separated by whitespace. Whitespace inside the format is kept exactly as written, so always quote the value.

## Screenshot Upload

When an admin takes a screenshot of a player, EasyAdmin can upload it to an image host and share the resulting link in webhook messages and chat. Without an upload destination, the screenshot is only shown to the admin who took it.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_screenshoturl` | `none` | URL to upload screenshots to. See [Image Hosting](../image-hosting) for a ready-to-deploy solution |
| `ea_screenshotfield` | `files[]` | Name of the JSON field that carries the image in the upload request |
| `ea_screenshotMaxResolution` | `1280` | Maximum length of the longer dimension in pixels. The shorter dimension scales to match the aspect ratio |
| `ea_screenshotQuality` | `0.8` | WebP encoding quality (0.0–1.0) |
| `ea_enableReportScreenshots` | `true` | Automatically take a screenshot when a player is reported |

```
setr ea_screenshoturl "https://img.example.com/upload"
setr ea_screenshotfield "files[]"
```

The upload is a JSON POST with a single field holding the screenshot, for example:

```json
{ "files[]": "data:image/webp;base64,..." }
```

The upload service must reply with the image URL as JSON:

```json
{ "url": "https://img.example.com/abc123.webp" }
```

A Discord webhook URL cannot be used here, because Discord expects a file upload rather than JSON.

## Log Identifiers

EasyAdmin can show a player's Discord ID next to their name in webhook messages and logs.

```
set ea_logIdentifier "false"
```

Set it to `false` to hide Discord IDs. Any other value keeps them enabled — the value is not a list, so listing identifier types has no effect.

## Testing Webhooks

Use the `ea_testWebhook` command to send test messages to all configured webhooks. Requires server-level permissions.

```
ea_testWebhook
```

## Using Webhooks from Plugins

External resources can send webhook messages through EasyAdmin's exports.
This is useful for logging moderation actions from framework plugins (ESX,
QB-Core, etc.) to the same Discord channels as built-in EasyAdmin actions.

```lua
-- Simple usage (uses ea_moderationNotification by default):
exports.EasyAdmin:sendWebhook(
  string.format("**%s** gave **%s** $%s.", adminName, targetName, amount),
  { feature = "esx" }
)

-- Use a different webhook channel:
exports.EasyAdmin:sendWebhook("Action logged", {
  webhook = "detail",   -- "moderation", "detail", "report", or a direct URL
  feature = "qb",       -- feature tag for exclusion filtering
  colour = 65280,        -- embed colour (default: 16777214 / red)
  title = "QB-Core",     -- embed title (default: "EasyAdmin")
})
```

The `feature` option lets admins filter plugin messages independently via
`ea_excludeWebhookFeature`. For example, `ea_excludeWebhookFeature esx`
silences all webhook messages tagged with `feature = "esx"`.

See [Plugin API — Webhooks](../../plugins/plugin-api#webhooks) for the full
export reference.
