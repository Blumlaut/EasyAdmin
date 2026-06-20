# Convar Reference

Complete reference of all EasyAdmin configuration convars, sorted alphabetically.

## ea_IpPrivacy

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |
| **Scope** | `setr` |

Hides IP addresses in the NUI player list and detail views.

## ea_LanguageName

| | |
|---|---|
| **Default** | `en` |
| **Type** | String |
| **Scope** | `setr` |

Sets the UI language. Available: `de`, `en`, `es`, `fr`, `it`, `nl`, `pl`.

## ea_MinReportModifier

| | |
|---|---|
| **Default** | `4` |
| **Type** | Integer |

Divisor for calculating the adjusted minimum report count when the report modifier is active. Formula: `floor(playerCount / ea_MinReportModifier)`.

## ea_MinReportModifierEnabled

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Enable the player-count-based report modifier. When disabled, `ea_defaultMinReports` is used regardless of player count.

## ea_MinReportPlayers

| | |
|---|---|
| **Default** | `12` |
| **Type** | Integer |

Minimum number of players online for the report modifier to activate.

## ea_ReportBanTime

| | |
|---|---|
| **Default** | `86400` |
| **Type** | Integer |

Duration of the auto-ban triggered by report threshold, in seconds. Default: 86400 (24 hours).

## ea_actionHistoryExpiry

| | |
|---|---|
| **Default** | `30` |
| **Type** | Integer |

Number of days to keep action history entries before automatic cleanup.

## ea_addReminder

| | |
|---|---|
| **Type** | Command |

Add a chat reminder. Place after EasyAdmin starts in `server.cfg` or run in-game. Format: `ea_addReminder "message text"`. Not persisted across restarts.

## ea_addShortcut

| | |
|---|---|
| **Type** | Command |

Add a reason shortcut. Place after EasyAdmin starts in `server.cfg` or run in-game. Format: `ea_addShortcut keyword "full text"`. Not persisted across restarts.

## ea_adminCooldown

| | |
|---|---|
| **Type** | Convar (dynamic) |

Set cooldown in seconds for a specific action. Replace `ACTION` with the action name. Examples: `ea_adminCooldown:ban 60`, `ea_adminCooldown:kick 30`. Set to `0` to disable.

Available actions: `ban`, `kick`, `warn`, `slap`, `freeze`, `mute`, `teleport`, `spectate`, `screenshot`

## ea_backupFrequency

| | |
|---|---|
| **Default** | `72` |
| **Type** | Integer |

Hours between automatic banlist backups. Set to `0` to disable automatic backups.

## ea_banMessageFooter

| | |
|---|---|
| **Default** | `You can appeal this by ban by visiting our discord.` |
| **Type** | String |

Footer text on the ban screen.

## ea_banMessageServerName

| | |
|---|---|
| **Default** | `sv_projectName` |
| **Type** | String |

Server name displayed on the ban screen.

## ea_banMessageShowStaff

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Show the staff member's name on the ban screen.

## ea_banMessageSubHeader

| | |
|---|---|
| **Default** | `You have been banned from this server.` |
| **Type** | String |

Subheader text on the ban screen.

## ea_banMessageTitleColour

| | |
|---|---|
| **Default** | `#354557` |
| **Type** | String |

Hex color for the ban screen title.

## ea_banMessageWatermark

| | |
|---|---|
| **Default** | (embedded EasyAdmin logo) |
| **Type** | String |

URL to a logo image for the ban screen watermark. Can also be a base64 data URI.

## ea_botChatBridge

| | |
|---|---|
| **Default** | (empty) |
| **Type** | String |

Discord channel ID for the chat bridge. Syncs messages between Discord and FiveM chat.

## ea_botLogChannel

| | |
|---|---|
| **Default** | (empty) |
| **Type** | String |

Discord channel ID for bot logging. When set, webhook notifications are disabled.

## ea_botStatusChannel

| | |
|---|---|
| **Default** | `true` |
| **Type** | String |

Discord channel ID for the live server status display.

## ea_botToken

| | |
|---|---|
| **Default** | `none` |
| **Type** | String |

Discord bot token. Required for the Discord bot to function.

## ea_callAdminCommandName

| | |
|---|---|
| **Default** | `calladmin` |
| **Type** | String |

Command name for the calladmin feature.

## ea_callAdminCooldown

| | |
|---|---|
| **Default** | `60` |
| **Type** | Integer |

Cooldown in seconds between calladmin uses per player.

## ea_chatReminderTime

| | |
|---|---|
| **Default** | `0` |
| **Type** | Integer |

Interval in minutes between chat reminders. Set to `0` to disable.

## ea_custombanlist

| | |
|---|---|
| **Default** | `false` |
| **Type** | Boolean |

When enabled, triggers `ea_data:addBan` and `ea_data:updateBan` events during banlist operations for custom banlist integration.

## ea_dangerousDevMode

| | |
|---|---|
| **Default** | `false` |
| **Type** | Boolean |

Enables developer-only features. **Never enable on a production server.**

## ea_dateFormat

| | |
|---|---|
| **Default** | `%d/%m/%Y %H:%M:%S` |
| **Type** | String |

Custom date/time format for webhooks and ban screens. Uses Lua date format specifiers.

## ea_defaultKey

| | |
|---|---|
| **Default** | `none` |
| **Type** | String |

Menu key for RedM. On FiveM, use the settings UI instead.

## ea_defaultMinReports

| | |
|---|---|
| **Default** | `3` |
| **Type** | Integer |

Minimum number of reports needed to auto-ban a player.

## ea_detailNotification

| | |
|---|---|
| **Default** | `false` |
| **Type** | String |

Discord webhook URL for detail notifications (spectate, teleport, freeze, slap, cleanup, settings). Falls back to `ea_moderationNotification` if not set.

## ea_enableActionHistory

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Enable action history tracking.

## ea_enableAllowlist

| | |
|---|---|
| **Default** | `false` |
| **Type** | Boolean |

Enable the allowlist system. Only players with `easyadmin.player.allowlist` can join.

## ea_enableCallAdminCommand

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Enable the calladmin command.

## ea_enableChat

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Enable the admin-only chat channel.

## ea_enableReportCommand

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Enable the report command.

## ea_enableReportScreenshots

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Automatically take a screenshot when a player is reported.

## ea_enableSplash

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Show ASCII art version banner on server startup.

## ea_excludeWebhookFeature

| | |
|---|---|
| **Type** | Command |

Exclude specific webhook notification types. Format: `ea_excludeWebhookFeature kick ban slap`. Run without arguments to reset.

Available features: `kick`, `ban`, `slap`, `warn`, `teleport`, `freeze`, `spectate`, `settings`, `calladmin`, `report`, `reports`, `screenshot`, `permissions`, `joinleave`, `cleanup`

## ea_logIdentifier

| | |
|---|---|
| **Default** | `steam` |
| **Type** | String |

Comma-separated list of identifier types to include in logs and webhooks. Order determines display order.

## ea_logLevel

| | |
|---|---|
| **Default** | `1` |
| **Type** | Integer |

Logging verbosity: `1` (errors), `2` (warnings), `3` (info), `4` (debug).

## ea_maxBackupCount

| | |
|---|---|
| **Default** | `10` |
| **Type** | Integer |

Maximum number of banlist backups to retain.

## ea_maxWarnings

| | |
|---|---|
| **Default** | `3` |
| **Type** | Integer |

Maximum warnings before automatic action.

## ea_minIdentifierMatches

| | |
|---|---|
| **Default** | `2` |
| **Type** | Integer |

Minimum number of matching identifiers required to consider a player banned.

## ea_moderationNotification

| | |
|---|---|
| **Default** | `false` |
| **Type** | String |

Discord webhook URL for moderation notifications (kicks, bans, warns, mutes, screenshots).

## ea_playerCacheExpiryTime

| | |
|---|---|
| **Default** | `900` |
| **Type** | Integer |

Time in seconds before cached player data expires.

## ea_presentDeferral

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Show progress bar during banlist check on connection. Set to `false` if using another deferral resource.

## ea_profilerEndpoint

| | |
|---|---|
| **Default** | (empty) |
| **Type** | String |

Override the profiler HTTP endpoint. Format: `host:port`. Used by the Profiler page.

## ea_reportCommandName

| | |
|---|---|
| **Default** | `report` |
| **Type** | String |

Command name for the report feature.

## ea_reportNotification

| | |
|---|---|
| **Default** | `false` |
| **Type** | String |

Discord webhook URL for report notifications. Falls back to `ea_moderationNotification` if not set.

## ea_routingBucketOptions

| | |
|---|---|
| **Default** | `false` |
| **Type** | Boolean |

Registers routing bucket permission options. Actual gating is controlled by `player.bucket.join` and `player.bucket.force` permissions.

## ea_screenshotfield

| | |
|---|---|
| **Default** | `files[]` |
| **Type** | String |

Form field name for screenshot upload POST requests.

## ea_screenshotOptions

| | |
|---|---|
| **Default** | `{}` |
| **Type** | String |

Extra JSON options passed to screenshot-basic.

## ea_screenshoturl

| | |
|---|---|
| **Default** | `https://wew.wtf/upload.php` |
| **Type** | String |

URL to upload screenshots to. Can be a Discord webhook URL.

## ea_useTokenIdentifiers

| | |
|---|---|
| **Default** | `true` |
| **Type** | Boolean |

Use token identifiers for ban matching. Disable if multiple servers share the same banlist.

## ea_warnAction

| | |
|---|---|
| **Default** | `kick` |
| **Type** | String |

Action after maximum warnings reached: `kick` or `ban`.

## ea_warningBanTime

| | |
|---|---|
| **Default** | `604800` |
| **Type** | Integer |

Ban duration in seconds when `ea_warnAction` is `ban`. Default: 604800 (7 days).

## See Also

- [Configuration Overview](configuration/basic.md) — Core configuration guide
- [Webhooks](configuration/webhooks.md) — Webhook configuration
- [Advanced](configuration/advanced.md) — Advanced configuration options
- [NUI Settings](configuration/nui-settings.md) — NUI-specific convars
