# Screenshots

EasyAdmin can capture screenshots of player screens for moderation purposes. Screenshots are uploaded to a configured endpoint and the URL is displayed to the admin.

## Configuration

### Upload URL

Set the URL to upload screenshots to:

```
set ea_screenshoturl "https://example.com/upload.php"
```

Default: `https://wew.wtf/upload.php`

This can be a Discord webhook URL or any endpoint that accepts POST requests with multipart form data.

### Form Field Name

Customize the form field name for the screenshot file:

```
set ea_screenshotfield "files[]"
```

Default: `files[]`

### Extra Options

Pass additional options to screenshot-basic:

```
set ea_screenshotOptions "{}"
```

Default: `{}` (empty JSON object)

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.screenshot` | Take screenshots of players |

## Usage

Screenshots can be triggered through:

1. The NUI player actions menu
2. The `/screenshot` command
3. Automatic capture when a player is reported (if enabled)

### Automatic Report Screenshots

When a player is reported, a screenshot of the reported player is automatically captured:

```
set ea_enableReportScreenshots "true"
```

Default: `true`

## Requirements

- `screenshot-basic` resource must be installed and started before EasyAdmin
- The upload endpoint must accept POST requests with multipart form data

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:isScreenshotInProgress()` | Check if a screenshot is currently being captured |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:TakeScreenshot(playerId)` | Capture a screenshot of a player |
