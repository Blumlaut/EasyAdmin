fx_version "cerulean"

games {"rdr3","gta5"}

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

server_scripts {
	"util_shared.lua",
	"admin_server.lua",
	"plugins/**/*_shared.lua",
	"plugins/**/*_server.lua"
}

client_scripts {
	"dependencies/NativeUI.lua",
	"dependencies/NativeUI-rdr3.lua",
	"dependencies/Controls.lua",
	"util_shared.lua",
	"admin_client.lua",
	"gui_c.lua",
	"plugins/**/*_shared.lua",
	"plugins/**/*_client.lua"
}

files {
	"dependencies/images/*.png",
}

convar_category 'EasyAdmin' {
    "Configuration Options",
    {
    { "EasyAdmin language", "$ea_LanguageName", "CV_STRING", "en" },
    { "Key to open the menu", "$ea_MenuButton", "CV_STRING", "none" },
    { "The Minimum Amount of Identifiers", "$ea_minIdentifierMatches", "CV_INT", "2" },
    { "Moderation Actions Webhook", "$ea_moderationNotification", "CV_STRING", "false" },
    { "Report Notifications Webhook", "$ea_reportNotification", "CV_STRING", "false" },
    { "Detail Notifications Webhook", "$ea_detailNotification", "CV_STRING", "false" },
    { "Disable Specific Webhook Alerts", "$ea_dateFormat", "CV_STRING", "%d/%m/%Y     %H:%M:%S" },
    { "Image Uploader", "$ea_screenshoturl", "CV_STRING", "https://wew.wtf/upload.php" },
    { "Screenshot Field Name", "$ea_screenshotfield", "CV_STRING", "files[]" },
    { "JSON String arguments", "$ea_screenshotOptions", "CV_STRING", "{}" },
    { "Screenshot on Report", "$ea_enableReportScreenshots", "CV_BOOL", "true" },
    { "Webhook Identifier", "$ea_logIdentifier", "CV_STRING", "steam" },
    { "Enable calladmin Command", "$ea_enableCallAdminCommand", "CV_BOOL", "false" },
    { "Enable report Command", "$ea_enableReportCommand", "CV_BOOL", "false" },
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
    { "Hide IP in the GUI", "$ea_IpPrivacy", "CV_BOOL", "false" },
    { "Banlist Backup Time (hours)", "$ea_backupFrequency", "CV_INT", "72" },
    { "Maximum Backup Count", "$ea_maxBackupCount", "CV_INT", "10" },
    { "Chat Reminder Time (minutes, disabled if 0)", "$ea_chatReminderTime", "CV_INT", "0" },
    { "Time before Cached Player Expires", "$ea_playerCacheExpiryTime", "CV_INT", "900" },
    { "Set Debug Level", "$ea_logLevel", "CV_INT", "1" },
    { "Enable Custom Banlist", "$ea_custombanlist", "CV_BOOL", "false" },
    { "Enable Telemetry", "$ea_enableTelemetry", "CV_BOOL", "true" },
    { "Use Tokens as Identifiers", "$ea_useTokenIdentifiers", "CV_BOOL", "true" },
    { "Enable Ascii Art on Start", "$ea_enableSplash", "CV_BOOL", "true" }
    }
}