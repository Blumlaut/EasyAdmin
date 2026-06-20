# Screenshots

EasyAdmin can capture screenshots of player screens for moderation purposes. Screenshots are captured natively using Three.js and FiveM's `CfxTexture`, then uploaded to a configured image host. The resulting URL is displayed to the admin in chat and sent to webhooks.

No external resources are required — screenshot capture is built directly into EasyAdmin.

## How It Works

1. An admin triggers a screenshot of a target player
2. The target player's game render target is captured via Three.js + `CfxTexture` in the NUI
3. The image is downsampled (capped at the configured max resolution) and encoded as WebP
4. The data URI is uploaded to the configured image host (`ea_screenshoturl`)
5. The hosted image URL is returned and displayed in chat + sent to webhooks

## Configuration

### Upload URL

Set the URL to upload screenshots to:

```
set ea_screenshoturl "https://example.com/upload.php"
```

Default: `https://wew.wtf/upload.php`

The endpoint receives a POST request with the image data. When set to `none`, the raw data URI is used instead (displayable in-game chat but not in Discord webhooks).

### Form Field Name

Customize the form field name for the screenshot upload:

```
set ea_screenshotfield "files[]"
```

Default: `files[]`

### Max Resolution

Cap the longer dimension of the captured image. The shorter dimension is scaled proportionally to preserve aspect ratio.

```
set ea_screenshotMaxResolution 1280
```

Default: `1280` (produces 1280×720 from a 1920×1080 screen)

### Quality

Control the WebP encoding quality (0.0–1.0).

```
set ea_screenshotQuality 0.8
```

Default: `0.8`

### Automatic Report Screenshots

When a player is reported, a screenshot of the reported player is automatically captured:

```
set ea_enableReportScreenshots "true"
```

Default: `true`

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.screenshot` | Take screenshots of players |

## Usage

Screenshots can be triggered through:

1. The NUI player actions menu (Camera button)
2. The Discord bot `/screenshot` command
3. Automatic capture when a player is reported (if enabled)

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:isScreenshotInProgress()` | Check if a screenshot is currently being captured |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:TakeScreenshot(playerId)` | Capture a screenshot of a player |

## Troubleshooting

- **Screenshots fail / timeout** — Ensure the target player's client is not frozen or disconnected. The capture has a 25-second timeout.
- **Webhooks don't show the image** — Discord webhooks need a hosted URL. Make sure `ea_screenshoturl` points to a valid image upload endpoint.
- **Image quality too low** — Increase `ea_screenshotQuality` (default 0.8) or `ea_screenshotMaxResolution` (default 1280).
