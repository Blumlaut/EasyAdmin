# Configuration

EasyAdmin is configured using **convars**. You can set them in your server configuration file.

- Use `setr` for convars that should be visible to players (e.g., language).
- Use `set` for internal settings only.
- Always follow the usage syntax as shown in the table.

---

## 🛠️ Basic Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_LanguageName` | `setr ea_LanguageName "en"` | Sets the language of EasyAdmin UI, messages, and HUD. Options: `de, en, es, fr, it, nl, pl` |
| `ea_defaultKey` (RedM only) | `setr ea_defaultKey "PhotoModePc"` | Sets the key to open the menu. [Keybind guide](keybind.md). |
| `ea_minIdentifierMatches` | `set ea_minIdentifierMatches 2` | Minimum number of identifiers (steam, ip, etc.) that must match to ban a user. Increase by 1 for every proxy. |
| `ea_presentDeferral` | `set ea_presentDeferral "true"` | Shows progress bar when connecting. Disable if using Adaptive Cards. |

---

## 🚫 Ban Screen Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_banMessageTitleColour` | `set ea_banMessageTitleColour "#354557"` | Hex color for ban screen title. |
| `ea_banMessageServerName` | `set ea_banMessageServerName "My Server"` | Server name shown on ban screen. |
| `ea_banMessageShowStaff` | `set ea_banMessageShowStaff "true"` | Shows the name of the staff member who issued the ban. |
| `ea_banMessageFooter` | `set ea_banMessageFooter "Appeal on Discord: linkhere"` | Footer message with appeal instructions. |
| `ea_banMessageSubHeader` | `set ea_banMessageSubHeader "You are banned."` | Subheader message on ban screen. |
| `ea_banMessageWatermark` | `set ea_banMessageWatermark "https://example.com/logo.png"` | Logo used as a watermark (transparent background recommended). |

---

## 📢 Webhook & Screenshot Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_moderationNotification` | `set ea_moderationNotification "https://discord.com/api/webhooks/123/456"` | Main moderation webhook. |
| `ea_reportNotification` | `set ea_reportNotification "https://discord.com/api/webhooks/123/456"` | Optional webhook for reports. |
| `ea_detailNotification` | `set ea_detailNotification "https://discord.com/api/webhooks/123/456"` | Optional webhook for details like freezes, teleport, etc. |
| `ea_excludeWebhookFeature` | `ea_excludeWebhookFeature kick ban` | Disable specific webhook alerts. Options: `kick, ban, slap, warn, teleport, freeze, spectate, settings, calladmin, report, reports, screenshot, permissions, joinleave` |
| `ea_dateFormat` | `setr ea_dateFormat "%d/%m/%Y %H:%M:%S"` | Custom date/time format. |
| `ea_screenshoturl` | `setr ea_screenshoturl "https://wew.wtf/upload.php"` | Image upload URL for screenshots. |
| `ea_screenshotfield` | `setr ea_screenshotfield "files[]"` | Form field name for screenshot upload. |
| `ea_screenshotOptions` | `setr ea_screenshotOptions "{}"` | Extra options for screenshot-basic. |
| `ea_enableReportScreenshots` | `set ea_enableReportScreenshots "true"` | Take screenshot when someone is reported. |
| `ea_logIdentifier` | `set ea_logIdentifier "discord,steam,license"` | List of identifiers to log in webhooks (order matters). |

---

## 🧾 Command Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_enableCallAdminCommand` | `set ea_enableCallAdminCommand "true"` | Enables `/calladmin` command. |
| `ea_enableReportCommand` | `set ea_enableReportCommand "true"` | Enables `/report` command. |
| `ea_callAdminCommandName` | `set ea_callAdminCommandName "calladmin"` | Name of the call admin command. |
| `ea_reportCommandName` | `set ea_reportCommandName "report"` | Name of the report command. |
| `ea_callAdminCooldown` | `set ea_callAdminCooldown 60` | Cooldown in seconds between `/calladmin` uses. |
| `ea_defaultMinReports` | `set ea_defaultMinReports 3` | Minimum reports needed to ban a user. |
| `ea_ReportBanTime` | `set ea_ReportBanTime 86400` | Duration of a report-based ban in seconds. |
| `ea_MinReportModifierEnabled` | `set ea_MinReportModifierEnabled "true"` | Enables variable minimum reports based on player count. |
| `ea_MinReportPlayers` | `set ea_MinReportPlayers 12` | Minimum players for report modifier to activate. |
| `ea_MinReportModifier` | `set ea_MinReportModifier 4` | Divisor for calculating minimum reports (e.g., 12 players / 4 = 3 reports). |

---

## 🛡️ Administration Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_maxWarnings` | `set ea_maxWarnings 3` | Max warnings before automatic action. |
| `ea_warnAction` | `set ea_warnAction "kick"` | Action after max warnings: `none`, `kick`, or `ban`. |
| `ea_warningBanTime` | `set ea_warningBanTime 604800` | Duration of ban after too many warnings. |
| `ea_IpPrivacy` | `setr ea_IpPrivacy "true"` | Hides IP identifiers in GUI. |
| `ea_adminCooldown:<ACTION>` | `set ea_adminCooldown:ban 60` | Cooldown in seconds for admin actions. |

---

## 🤖 Bot Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_botToken` | `set ea_botToken "your-discord-token"` | Discord bot token. |
| `ea_botLogChannel` | `set ea_botLogChannel "123456789"` | Channel to send log messages to. |
| `ea_botStatusChannel` | `set ea_botStatusChannel "123456789"` | Channel to show server status. |
| `ea_botChatBridge` | `set ea_botChatBridge "123456789"` | Channel to bridge in-game and Discord chat. |
| `ea_addBotLogForwarding` | `ea_addBotLogForwarding joinleave 123456789` | Forwards specific logs to a channel. |

---

## 📦 Backup Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_backupFrequency` | `set ea_backupFrequency 24` | Time in hours between backups. |
| `ea_maxBackupCount` | `set ea_maxBackupCount 10` | Max number of backups to keep. |

---

## 🔧 Other Features

| Convar/Command | Usage | Description |
|----------------|-------|-------------|
| `ea_chatReminderTime` | `set ea_chatReminderTime 0` | Time in minutes between chat reminders. |
| `ea_addReminder` | `ea_addReminder "Online Admins: ^3@admins^7"` | Adds a chat reminder. Must be placed **after** the EasyAdmin start line. See [Reminders](reminders.md) |
| `ea_playerCacheExpiryTime` | `set ea_playerCacheExpiryTime 900` | Time in seconds to keep player data in cache. |
| `ea_addShortcut` | `ea_addShortcut rdm RDMing is not allowed, please read our Rules! (/rules)` | Adds a shortcut for commonly used messages. See [Shortcuts](shortcuts.md) |
| `ea_enableChat` | `set ea_enableChat "false"` | Enables or disables admin-only chat. |
| `ea_enableAllowlist` | `set ea_enableAllowlist "true"` | Enables the allowlist system. |
| `ea_routingBucketOptions` | `set ea_routingBucketOptions "true"` | Enables or disables routing bucket manipulation. |

---

## ⚙️ Advanced Configuration

| Convar | Usage | Description |
|--------|-------|-------------|
| `ea_logLevel` | `setr ea_logLevel 3` | Sets logging verbosity. Options: 1 (errors), 2 (warnings), 3 (info), 4 (debug). |
| `ea_useTokenIdentifiers` | `set ea_useTokenIdentifiers "true"` | Use tokens for bans. Disable if multiple servers share the same banlist. |
| `ea_enableSplash` | `set ea_enableSplash "false"` | Enables or disables the startup ASCII art. |

