# Convar Reference

Every EasyAdmin convar, grouped by what it controls. The default is the value used when the convar is not set.

## Core

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_dangerousDevMode` | `false` | Developer-only features. Never enable on a live server |
| `ea_defaultKey` | `none` | Has no effect. Open the menu with `/easyadmin` or `/ea` instead |
| `ea_enableSplash` | `true` | Print the version banner in the server console on startup |
| `ea_IpPrivacy` | `true` | Hide IP addresses in the player list and player details |
| `ea_LanguageName` | `en` | Menu and message language. Available: `de`, `en`, `es`, `fr`, `it`, `nl`, `pl` |
| `ea_minIdentifierMatches` | `2` | Identifier matches needed before a player counts as banned |
| `ea_presentDeferral` | `true` | Show a progress bar during the banlist check on connection |
| `ea_useTokenIdentifiers` | `true` | Use token identifiers for ban matching |

## Ban Screen

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_banMessageFooter` | `You can appeal this by ban by visiting our discord.` | Footer text, for example appeal instructions |
| `ea_banMessageServerName` | `sv_projectName` | Server name shown on the ban screen |
| `ea_banMessageShowStaff` | `true` | Show the name of the admin who issued the ban |
| `ea_banMessageSubHeader` | `You have been banned from this server.` | Subheader text |
| `ea_banMessageTitleColour` | `#354557` | Hex colour for the server name |
| `ea_banMessageWatermark` | (EasyAdmin logo) | Image URL or base64 data URI for the watermark |

## Warnings and Chat

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_adminCooldown:<action>` | `0` | Seconds before the same admin can repeat an action. `0` disables it |
| `ea_chatReminderTime` | `0` | Minutes between chat reminders. `0` disables them |
| `ea_enableChat` | `true` | Enable the admin-only chat channel |
| `ea_maxWarnings` | `3` | Warnings before the automatic action |
| `ea_warnAction` | `kick` | Action at the limit: `kick` or `ban` |
| `ea_warningBanTime` | `604800` | Ban length in seconds when the action is `ban` |

Actions for `ea_adminCooldown:<action>`: `ban`, `unban`, `kick`, `warn`, `slap`, `freeze`, `mute`, `teleport`, `spectate`, `screenshot`. These per-action convars are not shown in the server's convar editor, so add them to `server.cfg` by hand.

## Reports and Calladmin

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_callAdminCommandName` | `calladmin` | Command name for calladmin |
| `ea_callAdminCooldown` | `60` | Seconds a player must wait before calling an admin again |
| `ea_defaultMinReports` | `3` | Reports needed to auto-ban a player |
| `ea_enableCallAdminCommand` | `true` | Enable the calladmin command |
| `ea_enableReportCommand` | `true` | Enable the report command |
| `ea_enableReportScreenshots` | `true` | Take a screenshot when a player is reported |
| `ea_MinReportModifier` | `4` | Divisor for the minimum report count. The result is rounded to the nearest whole number (halves round up) |
| `ea_MinReportModifierEnabled` | `true` | Enable the player-count-based report modifier |
| `ea_MinReportPlayers` | `12` | Player count above which the report modifier activates |
| `ea_ReportBanTime` | `86400` | Auto-ban length in seconds |
| `ea_reportCommandName` | `report` | Command name for reports |

## Screenshots and Streaming

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_screenshotfield` | `files[]` | JSON field name that carries the image in the upload request |
| `ea_screenshotMaxResolution` | `1280` | Longest side of a screenshot, in pixels. The other side scales to keep the aspect ratio |
| `ea_screenshotQuality` | `0.8` | WebP quality for screenshots (0.0–1.0) |
| `ea_screenshoturl` | `none` | Upload URL for screenshots. Must accept a JSON POST and reply with a `url` field |
| `ea_streamMaxResolution` | `640` | Currently has no effect. Streams are always captured at up to 640 px on the longest side |
| `ea_streamStunServers` | `stun:stun.l.google.com:19302` | Comma-separated STUN servers used for streaming |
| `ea_streamTargetFps` | `8` | Capture frame rate for streaming |
| `ea_streamTurnPassword` | (empty) | Password for the TURN relay server |
| `ea_streamTurnServers` | (empty) | Comma-separated TURN relay servers used when a direct connection fails |
| `ea_streamTurnUser` | (empty) | Username for the TURN relay server |

## Webhooks and Logging

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_dateFormat` | `%d/%m/%Y %H:%M:%S` | Lua date/time format for webhooks and ban screens. The default separates the date and time with a tab |
| `ea_detailNotification` | `false` | Webhook URL for detail actions (spectate, teleport, freeze, slap, cleanup, settings). Falls back to `ea_moderationNotification` |
| `ea_enableDebugging` | `false` | Legacy. Setting it to anything other than `false` raises logging to level 3 for the session |
| `ea_logIdentifier` | `steam,discord,license` | Set to `false` to hide the Discord ID shown next to player names in logs and webhooks |
| `ea_logLevel` | `1` | Console output: `1` errors, `2` warnings, `3` info, `4` debug |
| `ea_moderationNotification` | `false` | Webhook URL for moderation actions (kicks, bans, warns, mutes, screenshots) |
| `ea_reportNotification` | `false` | Webhook URL for reports and calladmin. Falls back to `ea_moderationNotification` |

## Discord Bot

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_botChatBridge` | (empty) | Channel ID for the chat bridge between Discord and the in-game admin chat |
| `ea_botGuild` | (empty) | Only for upgrades from 7.x. Discord server whose old per-server bot commands should be removed |
| `ea_botLogChannel` | (empty) | Channel ID for bot log messages. When set, webhook notifications are skipped |
| `ea_botStatusChannel` | (empty) | Channel ID for the live server status message. Leave empty to turn it off |
| `ea_botToken` | `none` | Discord bot token. Required for the bot to run |

## Player Data

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_actionHistoryExpiry` | `120` | Days before action history entries are deleted |
| `ea_enableActionHistory` | `true` | Record new action history entries |
| `ea_enableAdminNotes` | `true` | Reserved. EasyAdmin does not use this setting yet, so changing it has no effect |
| `ea_playerCacheExpiryTime` | `1800` | Seconds a disconnected player stays in the cache |

## Backups and Allowlist

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_backupFrequency` | `72` | Hours between automatic banlist backups. `0` disables them |
| `ea_custombanlist` | `false` | Fire ban events so another resource can track your bans |
| `ea_enableAllowlist` | `false` | Only allowlisted players can join |
| `ea_maxBackupCount` | `10` | Backups to keep |
| `ea_routingBucketOptions` | `false` | Reserved. Changing it has no effect; routing bucket access is controlled by permissions |

## Profiler

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_profilerEndpoint` | (empty) | Profiler address override, as `host:port` |

## Commands

| Command | Description |
|---------|-------------|
| `ea_addReminder` | Add a chat reminder. Not saved across restarts |
| `ea_addShortcut` | Add a reason shortcut. Not saved across restarts |
| `ea_excludeWebhookFeature` | Turn off selected webhook notification types. Run with no arguments to reset |

Excludable types for `ea_excludeWebhookFeature`: `ban`, `calladmin`, `cleanup`, `freeze`, `kick`, `mute`, `report`, `reports`, `screenshot`, `settings`, `slap`, `spectate`, `teleport`, `warn`.

## See Also

- [Configuration Overview](../../configuration/basic) — Core configuration guide
- [Webhooks](../../configuration/webhooks) — Webhook configuration
- [Advanced](../../configuration/advanced) — Advanced configuration options
- [NUI Settings](../../configuration/nui-settings) — NUI-specific convars
- [Command Reference](../command-reference) — All EasyAdmin commands
