# Configuration

Configuration of EasyAdmin is done via convars, these can be set via your server config file.

You can set a convar by following the syntax in the "usage" field.

Note that "setr" and "set" are **not** identical, make sure not to use them interchangably as Convars using "setr" can be read by players on the server.


## Basic Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_LanguageName | Convar | `setr ea_LanguageName "en"` | This Convars dictates in which language EasyAdmin is displayed ( this includes but is not limited to GUI, Kick Messages, Reasons, Hud Elements.. ) Available options: de, en, es, fr, it, nl, pl |
| ea_defaultKey (RedM Only!) | Convar | `setr ea_defaultKey "PhotoModePc"` | [Guide for FiveM here.](keybind.md) Key which is used to open the Menu [RedM Keys](https://github.com/Blumlaut/EasyAdmin/blob/master/dependencies/Controls.lua#L3) |
| ea_minIdentifierMatches | Convar | `set ea_minIdentifierMatches 2` | The Minimum Amount of Identifiers that have to match before a Player gets "Declined" for being banned. Never put this below 1. If some form of Proxy is used on the server, you should add 1 to this number for every Proxy IP |
| ea_presentDeferral | Convar | `set ea_presentDeferral "true"` | Whether or not EasyAdmin will display a progress (in %) of it checking the banlist when connecting, disable when using Adaptive Cards. |

## Ban Screen Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_banMessageTitleColour | Convar | `set ea_banMessageTitleColour "#354557"` | The hex color for the title of the ban screen. |
| ea_banMessageServerName | Convar | `set ea_banMessageServerName "EasyAdmin RP"` | Your server's name to show on the title of the ban screen. |
| ea_banMessageShowStaff | Convar | `set ea_banMessageShowStaff "true"` | Whether or not to display the staff member that banned the user. Set to `"false"` to hide the staff member's name. |
| ea_banMessageFooter | Convar | `set ea_banMessageFooter "You can appeal this by ban by visiting our discord."` | The footer message typically showing an appeal link. |
| ea_banMessageSubHeader | Convar | `set ea_banMessageSubHeader "You have been banned from this server."` | Sub header for the ban screen. |
| ea_banMessageWatermark | Convar | `set ea_banMessageWatermark "https://example.com/logo.png"` | Your server logo or banner - used as a watermark. (ideally transparent/no background) |

## Webhook & Screenshot Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_moderationNotification | Convar | `set ea_moderationNotification "https://discordapp/api/webhooks/123/456"` | Logs Actions via Discord Webhook                                                                                                                                                                                                           
| ea_reportNotification | Convar | `set ea_reportNotification "https://discordapp/api/webhooks/123/456"` | Sends Report Notifications to a Seperate Webhook, will use ea_moderationNotification if unset.
| ea_detailNotification | Convar | `set ea_detailNotification "https://discordapp/api/webhooks/123/456"` | Sends Detail Notifications (Convar Changes, Freeze and Spectate) to a seperate Webhook, will use ea_moderationNotification if unset.
| ea_excludeWebhookFeature | Command | `ea_excludeWebhookFeature freeze teleport` | Allows Specific Webhook Alerts to be disabled, available options: `kick ban slap warn teleport freeze spectate settings calladmin report reports screenshot permissions joinleave` |
| ea_dateFormat | Convar | `setr ea_dateFormat "%d/%m/%Y %H:%M:%S"` | Allows a custom DateTime format to be displayed in EasyAdmin, [available options](https://www.lua.org/pil/22.1.html)												 |
| ea_screenshoturl | Convar | `setr ea_screenshoturl "https://wew.wtf/upload.php"` | Defines an Image Uploader for the created Screenshots, make sure `ea_screenshotfield` is also configured correctly. |
| ea_screenshotfield | Convar | `setr ea_screenshotfield "files[]"` | Defines the name for the form field to add the file to. See [screenshot-basic](https://github.com/citizenfx/screenshot-basic/blob/master/README.md) for further information. |
| ea_screenshotOptions | Convar | `setr ea_screenshotOptions "{}"` | Defines any arguments that should be passed through to screenshot-basic as a JSON String. See [screenshot-basic](https://github.com/citizenfx/screenshot-basic/blob/master/README.md) for further information. |
| ea_enableReportScreenshots | Convar | `set ea_enableReportScreenshots "true"` | When a player is Reported, this Convar will cause a screenshot to be taken of the reported player's game, if screenshot-basic is set up							 |
| ea_logIdentifier | Convar | `set ea_logIdentifier "discord,steam,license"` | Will attempt to log the player's identifier in webhook messages, preference in descending order.

## Command Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_enableCallAdminCommand | Convar | `set ea_enableCallAdminCommand "true"` | Enables "calladmin" command, will print a message via webhook. |
| ea_enableReportCommand | Convar | `set ea_enableReportCommand "true"` | Enables "report" command |
| ea_callAdminCommandName | Convar | `set ea_callAdminCommandName "calladmin"` | Defines what the command to call an admin will be
| ea_reportCommandName | Convar | `set ea_reportCommandName "report"`									 | Defines what the command to report a player will be
| ea_callAdminCooldown | Convar | `set ea_callAdminCooldown 60` | In Seconds, how long a Player will not be able to use callAdmin after using it once. |
| ea_defaultMinReports | Convar | `set ea_defaultMinReports 3` | Minimum Reports to Ban someone below ea_MinReportPlayers Threshold, if ea_MinReportModifierEnabled, this is the amount always needed for a player to be banned. |
| ea_ReportBanTime | Convar | `set ea_ReportBanTime 86400` | Ban Time in unix time, how long the temporary ban should last after getting reported by x users |
| ea_MinReportModifierEnabled | Convar | `set ea_MinReportModifierEnabled "true"` | Allows "Variable" Minimum Report Count, Will Divide Current Player Count by ea_MinReportModifier. |
| ea_MinReportPlayers | Convar | `set ea_MinReportPlayers 12` | Minimum Amount of Players for the "Report Modifier" to enable, would not recommend setting below this number. |
| ea_MinReportModifier | Convar | `set ea_MinReportModifier 4` | Amount by which Player Count gets divided to get "minimum reports needed" count, so if 12 Players are on the server and this value is 4, 12/4= 3 Reports |

## Administration Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_maxWarnings | Convar | `set ea_maxWarnings 3` | Defines how many times a player can get warned before actions are taken Automatically. |
| ea_warnAction | Convar | `set ea_warnAction "kick"` | Defines how the player will get acted upon, if maximum warnings are reached, can be `none`, `kick` or `ban` |
| ea_warningBanTime | Convar | `set ea_warningBanTime 604800` | How long a player will stay banned after being warned and banned, accepts a unix time string. |
| ea_IpPrivacy | Convar	| `setr ea_IpPrivacy "true"` | Weither or not to Hide IP Identifiers in the GUI, won't prevent them being used for Bans. |
| ea_adminCooldown:`<ACTION>` | Convar |  `set ea_adminCooldown:ban 60` | If set to an integer other than 0, they will restrict an Admin from repeating that action for the number of seconds provided in the integer. |

## Bot Configuration
| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_botToken | Convar | `set ea_botToken "aaaabbbbb.cccceeeee"` | The Discord token used for the bot |
| ea_botLogChannel | Convar | `set ea_botLogChannel "838749101079658526"` | The Discord Channel the bot will log messages in. |
| ea_botStatusChannel | Convar | `set ea_botStatusChannel "838749101079658526"` | The Discord Channel will post live server status messages in. |
| ea_botChatBridge | Convar | `set ea_botChatBridge "838749101079658526"` | The Discord where Ingame and Discord chat will be bridged. |
| ea_addBotLogForwarding | Command | `ea_addBotLogForwarding joinleave 604747425512685582` | Sends a specific log type into a defined channel. |


## Backup Configuration


| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_backupFrequency | Convar | `set ea_backupFrequency 24` | time (in hours) between Banlist Backups. |
| ea_maxBackupCount | Convar | `set ea_maxBackupCount 10` | the maximum amount of backups that can be created. Old backups will be deleted. |


## Other Features

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_chatReminderTime | Convar | `set ea_chatReminderTime 0` | Time ( in minutes ) of how often there should be a random Chat Reminder printed to Chat, disabled if 0. |
| ea_addReminder | Command | `ea_addReminder "Online Admins: ^3@admins^7"` | **Make sure to add this parameter BELOW the EasyAdmin start line, otherwise it won't work** Adds a Reminder Text to the pool of available options, can support infinite reminders, [More detailed informations](reminders.md) |
| ea_playerCacheExpiryTime | Convar | `set ea_playerCacheExpiryTime 900` | Defines, in seconds, how long it takes for a Cached Player to get removed from Cache, 30 Minutes by Default, however, higher Values are recommended for sparsely Moderated Servers, should not exceed a few hours for performance reasons. |
| ea_addShortcut | Command | `ea_addShortcut rdm RDMing is not allowed, please read our Rules! (/rules)`| Creates a shortcut for a reason. [More detailed informations](shortcuts.md) |
| ea_enableChat | Command | `set ea_enableChat "false"` | Toggles EasyAdmin's own Admin Chat on/off |
| ea_enableAllowlist | Convar | `set ea_enableAllowlist "true"` | Enable or Disable Allowlist System |
| ea_routingBucketOptions | Convar | `set ea_routingBucketOptions "true"` | Enable or Disable the Routing Bucket Manipulation Options |

## Advanced Configuration

| Command/Convar | Type | Usage | Description |
|--|--|--|--|
| ea_logLevel | Convar 	| `setr ea_logLevel 3` | Sets the level of debug messages that should be displayed, 1-4 (1=errors only, 2=errors&warnings only, 3=errors, warnings and info messages, 4=everything, including spammy developer prints, not recommended)
| ea_enableTelemetry | Convar | `set ea_enableTelemetry "true"` | Enable or Disable Telemetry |
| ea_useTokenIdentifiers | Convar | `set ea_useTokenIdentifiers "true"` | Weither or not to use Tokens as Identifiers when banning users, keep activated unless multiple server instances access the same banlist file. |
| ea_enableSplash | Convar | `set ea_enableSplash "false"` | Enables or Disables the Ascii Art when EasyAdmin Starts.	
