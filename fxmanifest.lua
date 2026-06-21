fx_version "cerulean"

games {"rdr3","gta5"}

author 'Blumlaut <blue@furfag.de>'
description 'EasyAdmin - Admin Menu for FiveM & RedM'
repository 'https://github.com/Blumlaut/EasyAdmin'
version '7.52'
storage_api_version '2'
is_master 'yes'


lua54 'yes'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
node_version '22'

shared_script 'shared/permissions.lua'
shared_script 'shared/util_shared.lua'
shared_script 'shared/kvp.lua'

server_scripts {
    "server/lib/*.lua",
    "server/init/*.lua",
    "server/core/*.lua",
    "server/storage.lua",
    "server/stats/*.lua",
    "server/features/*.lua",
    "server/*.lua",
    "dist/*.js",
    "plugins/**/*_shared.lua",
    "plugins/**/*_server.lua"
}

client_scripts {
    "client/gui_client.lua",
    "client/nui/*.lua",
    "client/gui_nui.lua",
    "client/*.lua",
    "plugins/**/*_shared.lua",
    "plugins/**/*_client.lua"
}

ui_page "nui/dist/index.html"

files {
    "dependencies/images/*.png",
    "dependencies/nui/**/*",
    "nui/dist/**/*",
}

dependencies {
    '/onesync',
    '/server:12913'
}

provide 'EasyAdmin'

convar_category 'EasyAdmin' {
    "Configuration Options",
    {
        { "EasyAdmin language", "$ea_LanguageName", "CV_STRING", "en" },
        { "Default key to open the menu", "$ea_defaultKey", "CV_STRING", "none" },
        { "The Minimum Amount of Identifiers", "$ea_minIdentifierMatches", "CV_INT", "2" },
        { "Display banlist checking progress", "$ea_presentDeferral", "CV_BOOL", "true" },
        { "Moderation Actions Webhook", "$ea_moderationNotification", "CV_STRING", "false" },
        { "Report Notifications Webhook", "$ea_reportNotification", "CV_STRING", "false" },
        { "Detail Notifications Webhook", "$ea_detailNotification", "CV_STRING", "false" },
        { "Set a custom DateTime format", "$ea_dateFormat", "CV_STRING", "%d/%m/%Y     %H:%M:%S" },
        { "Image Uploader", "$ea_screenshoturl", "CV_STRING", "none" },
        { "Screenshot Field Name", "$ea_screenshotfield", "CV_STRING", "files[]" },
        { "Screenshot on Report", "$ea_enableReportScreenshots", "CV_BOOL", "true" },
        { "Screenshot Max Resolution (px, longer dimension)", "$ea_screenshotMaxResolution", "CV_INT", "1280" },
        { "Screenshot Quality (0.0-1.0)", "$ea_screenshotQuality", "CV_FLOAT", "0.8" },
        { "Stream Max Resolution (px, longer dimension)", "$ea_streamMaxResolution", "CV_INT", "640" },
        { "Stream Quality (0.0-1.0)", "$ea_streamQuality", "CV_FLOAT", "0.3" },
        { "Stream Target FPS", "$ea_streamTargetFps", "CV_INT", "8" },
        { "Stream Bitrate (bytes/sec, latent event bps — keep above targetFps * ~15KB)", "$ea_streamBitrate", "CV_INT", "200000" },
        { "Webhook Identifier", "$ea_logIdentifier", "CV_STRING", "steam" },
        { "Enable calladmin Command", "$ea_enableCallAdminCommand", "CV_BOOL", "true" },
        { "Enable report Command", "$ea_enableReportCommand", "CV_BOOL", "true" },
        { "calladmin Command Name", "$ea_callAdminCommandName", "CV_STRING", "calladmin" },
        { "report Command Name", "$ea_reportCommandName", "CV_STRING", "report" },
        { "calladmin Cooldown (seconds)", "$ea_callAdminCooldown", "CV_INT", "60" },
        { "Minimum Reports to Ban Someone", "$ea_defaultMinReports", "CV_INT", "3" },
        { "Report Ban Time (unix time)", "$ea_ReportBanTime", "CV_INT", "86400" },
        { "Allow Minimum Report Count", "$ea_MinReportModifierEnabled", "CV_BOOL", "true" },
        { "Minimum Amount of Players to enable Report Modifier", "$ea_MinReportPlayers", "CV_INT", "12" },
        { "Divisor of Player Count to get minimum reports needed count", "$ea_MinReportModifier", "CV_BOOL", "true" },
        { "Amount of Warns before Actions", "$ea_maxWarnings", "CV_INT", "3" },
        { "Maximum Warn Action", "$ea_warnAction", "CV_STRING", "kick" },
        { "Maximum Warn Ban Time (unix time)", "$ea_warningBanTime", "CV_INT", "604800" },
        { "Hide IP in the GUI", "$ea_IpPrivacy", "CV_BOOL", "true" },
        { "Banlist Backup Time (hours)", "$ea_backupFrequency", "CV_INT", "72" },
        { "Maximum Backup Count", "$ea_maxBackupCount", "CV_INT", "10" },
        { "Chat Reminder Time (minutes, disabled if 0)", "$ea_chatReminderTime", "CV_INT", "0" },
        { "Time before Cached Player Expires", "$ea_playerCacheExpiryTime", "CV_INT", "900" },
        { "Set Debug Level", "$ea_logLevel", "CV_INT", "1" },
        { "Use Tokens as Identifiers", "$ea_useTokenIdentifiers", "CV_BOOL", "true" },
        { "Enable Ascii Art on Start", "$ea_enableSplash", "CV_BOOL", "true" },
        { "Token for Discord bot", "$ea_botToken", "CV_STRING", "none" },
        { "Channel for Discord bot to log", "$ea_botLogChannel", "CV_STRING", "none" },
        { "Channel for Discord bot to enable live status", "$ea_botStatusChannel", "CV_STRING", "true" },
        { "Enable Allowlist", "$ea_enableAllowlist", "CV_BOOL", "false" },
        { "Routing Bucket Options", "$ea_routingBucketOptions", "CV_BOOL", "false" },
        { "Dangerous Dev Mode", "$ea_dangerousDevMode", "CV_BOOL", "false" },
        { "Enable Action History", "$ea_enableActionHistory", "CV_BOOL", "true" },
        { "Action History Expiry", "$ea_actionHistoryExpiry", "CV_INT", "30" }, -- Recommended time is 30 days,
        { "Enable Admin Notes", "$ea_enableAdminNotes", "CV_BOOL", "true" },
        { "Profiler Endpoint Override", "$ea_profilerEndpoint", "CV_STRING", "" },
    }
}