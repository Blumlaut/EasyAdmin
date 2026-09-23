# Screenshots & Live Stream

EasyAdmin can capture screenshots and live stream player screens for moderation purposes. Both features are built into EasyAdmin — no extra resources are required.

## How It Works

1. An admin triggers a screenshot of a target player
2. The target's screen is captured on the target's own client
3. The image is scaled down to the configured maximum resolution and encoded as WebP
4. The image opens in a floating viewer on the admin's screen
5. If an upload URL is configured, the image is uploaded and the resulting link is posted in chat and in the webhook message

Chat links and webhook image links only appear when the upload succeeds. Without an upload URL, the admin still sees the screenshot in the viewer, but no link is created.

## Configuration

### Upload URL

Set the URL EasyAdmin uploads screenshots to:

```
set ea_screenshoturl "https://example.com/upload.php"
```

Default: `none`

EasyAdmin sends a JSON POST request to this URL. The request body contains a single field with the image as a data URI, and EasyAdmin expects the response to contain the public URL of the uploaded image.

Leave it as `none` to skip uploading. The admin still gets the screenshot in the viewer, but no link is created: chat stays silent and webhook messages record `(local)` instead of an image URL.

**Need an image host?** See the [Image Hosting](../../configuration/image-hosting) guide for a ready-to-deploy solution.

### Upload Field Name

Change the name of the field that carries the image in the upload request:

```
set ea_screenshotfield "files[]"
```

Default: `files[]`

Match this to the field name your image host expects.

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

1. The NUI player actions menu (Screenshot button in the Control group)
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

- **Screenshots fail / timeout** — The capture gives up after 25 seconds. Make sure the target's client is not frozen or disconnected. Slow uploads can look like a timeout — lower `ea_screenshotMaxResolution` and `ea_screenshotQuality` to send a smaller image.
- **Webhooks don't show the image** — Discord can only display images from a public URL. Without `ea_screenshoturl` set, the webhook message records `(local)` instead of an image link.
- **The screenshot only shows in your viewer** — Taking a screenshot while you are streaming that player keeps it local: nothing is uploaded and no webhook message is sent. Stop the stream and take the screenshot again if you need a link.
- **Image quality too low** — Increase `ea_screenshotQuality` (default 0.8) or `ea_screenshotMaxResolution` (default 1280).

---

## Live Stream

Live stream lets admins watch a player's screen in real time over a peer-to-peer WebRTC connection. Frames are sent directly from the target player to the admin viewer — the server only relays small signaling messages to establish the connection.

### How It Works

Live streaming uses **PeerJS** for WebRTC signaling and connection management:

1. An admin clicks "Stream" on a target player
2. The server creates a session and tells the target to start a frame renderer
3. Both the target and admin create PeerJS instances and report their peer IDs to the server
4. The server relays the peer IDs so the admin can initiate a direct media call to the target
5. Video flows peer-to-peer over WebRTC — no frames pass through the server
6. When the admin closes the viewer, the connection is torn down

### Connection Architecture

```
Target Player                FiveM Server              Admin Viewer
     │                            │                        │
     │  ── PeerReady ──────────▶  │                        │
     │                            │  ── PeerReady ──────▶  │
     │                            │                        │
     │  ◀── TargetReady ─────────│  ── ViewerPeerReady ─▶ │
     │                            │                        │
     │  ◀═════ WebRTC (SRTP) ══════════════════════════▶  │
     │     (peer-to-peer video)  │                        │
```

The server only relays peer IDs and session state. All video data flows directly between players.

### Multi-Viewer Support

Multiple admins can stream the same player simultaneously. Each admin gets its own peer-to-peer connection to the target. The target runs a single renderer regardless of viewer count.

### Configuration

#### STUN Servers

STUN servers help peers discover their public IP addresses for direct connections. The default Google STUN server works for most setups.

```
set ea_streamStunServers "stun:stun.l.google.com:19302"
```

Default: `stun:stun.l.google.com:19302`

To use multiple STUN servers, separate them with commas:

```
set ea_streamStunServers "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"
```

#### TURN Servers (Optional)

TURN servers relay traffic when a direct peer-to-peer connection is not possible (e.g., behind symmetric NATs or restrictive firewalls). **Most setups do not need TURN servers** — STUN alone is sufficient for the majority of connections.

Configure TURN if streams fail to connect between certain players:

```
set ea_streamTurnServers "turn:turn.example.com:3478"
set ea_streamTurnUser "myuser"
set ea_streamTurnPassword "mypassword"
```

Multiple TURN servers can be specified (comma-separated):

```
set ea_streamTurnServers "turn:turn1.example.com:3478,turn:turn2.example.com:3478"
```

**Note:** TURN servers require their own infrastructure. You can use services like [Twilio Network Traversal](https://www.twilio.com/stun-turn), [OpenRelay](https://www.metered.ca/tools/openrelay/), or run your own [coturn](https://github.com/coturn/coturn) server.

#### Stream Target FPS

Control the frame rate of the capture loop on the target player's client. Lower values reduce CPU usage.

```
set ea_streamTargetFps 8
```

Default: `8`

#### Stream Max Resolution

```
set ea_streamMaxResolution 640
```

Default: `640`

This setting does not do anything yet — streams are always captured at up to 640 px on the longer dimension, so changing it has no effect.

### Stream Behavior

- **Target disconnect**: If the target player disconnects, all viewers are notified and the stream ends.
- **Reconnection**: If the connection drops, the viewer attempts one automatic reconnect. If that fails, stop and restart the stream.
- **Permission**: Uses the same `player.screenshot` permission as screenshots.

### Usage

Streaming can be triggered through:

1. The NUI player actions menu (Stream button in the Control group)

The stream appears as a floating window with:
- Player name in the header
- Status indicator (connecting, live, disconnected)
- Draggable window (drag from the header)
- Resizable window (drag the bottom-right corner)
- Close button to stop watching

### API

| Export | Description |
|--------|-------------|
| `EasyAdmin:isStreamActive(playerId)` | Check if a stream is active for a player |

### Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:Stream:StartWatch(playerId)` | Start streaming a player (server-side) |
| `EasyAdmin:Stream:StopWatch(playerId)` | Stop watching a player's stream (server-side) |

### Troubleshooting

- **Stream shows "Connecting…" forever** — The most common cause is NAT traversal failure. Try configuring a TURN server (`ea_streamTurnServers`). Ensure both players have open UDP ports (WebRTC uses UDP by default).
- **Stream connects but video is black** — The target's screen may not be available yet. Ensure they are fully loaded into the game (not in the loading screen).
- **Low FPS on target** — Reduce `ea_streamTargetFps`. The default of 8 FPS balances smoothness and CPU usage.
- **Stream drops intermittently** — Check for high packet loss between the two players. A TURN server can help if the direct connection is unstable.
- **Multiple viewers cause lag** — Each viewer gets its own peer-to-peer connection. The target's CPU usage increases with viewer count. Monitor target performance when multiple admins are streaming simultaneously.
