# Screenshots & Live Stream

EasyAdmin can capture screenshots and live stream player screens for moderation purposes. Both features are captured natively using Three.js and FiveM's `CfxTexture`. Screenshots are uploaded to a configured image host, while live streams are relayed through the server to admin viewers in real time.

No external resources are required — capture is built directly into EasyAdmin.

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

---

## Live Stream

Live stream lets admins watch a player's screen in real time. Unlike screenshots, streams are **not** uploaded to external hosts or sent to webhooks — frames stay within the FiveM client-to-server-to-client loop.

### How It Works

1. An admin clicks "Stream" on a target player
2. The target player's NUI begins a continuous capture loop (Three.js + `CfxTexture`)
3. Each frame is encoded as a low-quality WebP and sent to the server
4. The server relays each frame to all subscribed admin viewers
5. Multiple admins can watch the same stream — only one capture loop runs on the target
6. When the last viewer disconnects, the capture loop stops automatically

### Multi-Viewer Support

Multiple admins can stream the same player simultaneously. The target player runs **one** capture loop regardless of viewer count. Frames are fanned out from the server to all active viewers.

### Configuration

### Stream Max Resolution

Cap the longer dimension of each streamed frame. The shorter dimension is scaled proportionally to preserve aspect ratio.

```
set ea_streamMaxResolution 640
```

Default: `640` (produces 640×360 from a 1920×1080 screen)

### Stream Quality

Control the WebP encoding quality for streamed frames (0.0–1.0). Lower values produce smaller frames and less bandwidth at the cost of visual quality.

```
set ea_streamQuality 0.3
```

Default: `0.3`

### Stream Target FPS

Control the target frame rate of the capture loop.

```
set ea_streamTargetFps 8
```

Default: `8`

### Stream Behavior

- **Stream timeout**: If no frames arrive within 10 seconds of starting, the stream is automatically stopped and viewers are notified.
- **Target disconnect**: If the target player disconnects, all viewers are notified and the stream ends.
- **Screenshot during stream**: Screenshots taken while a stream is active skip external upload and webhook notifications (frames stay local).
- **Permission**: Uses the same `player.screenshot` permission as screenshots.

### Usage

Streaming can be triggered through:

1. The NUI player actions menu (Play button in the Control group)

The stream appears as a floating window with:
- Player name in the header
- Live FPS counter with a pulsing green dot
- Draggable window (drag from the header)
- Close button to stop watching

### API

| Export | Description |
|--------|-------------|
| `EasyAdmin:isStreamActive(playerId)` | Check if a stream is active for a player |

### Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:StartStream(playerId)` | Start streaming a player (server-side) |
| `EasyAdmin:StopStream(playerId)` | Stop watching a player's stream (server-side) |

### Troubleshooting

- **Stream shows "Stream failed to start"** — The target player's NUI may not have Three.js/CfxTexture available. Ensure they are fully loaded into the game.
- **Low FPS** — Reduce `ea_streamMaxResolution` or `ea_streamTargetFps`. Higher resolutions and frame rates increase CPU usage on the target player's client.
- **Choppy stream** — Reduce `ea_streamTargetFps` or `ea_streamQuality`. Frames are dropped when the network cannot keep up.
