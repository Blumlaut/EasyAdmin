------------------------------------
------------------------------------
---- DONT TOUCH ANY OF THIS IF YOU DON'T KNOW WHAT YOU ARE DOING
---- THESE ARE **NOT** CONFIG VALUES, USE THE CONVARS IF YOU WANT TO CHANGE SOMETHING
----
----
---- If you are a developer and want to change something, consider writing a plugin instead:
---- https://easyadmin.readthedocs.io/en/latest/plugins/
----
------------------------------------
------------------------------------

ExcludedWebhookFeatures = {}

 local function refreshWebhookConvars()
    moderationNotification = GetConvar("ea_moderationNotification", "false")
    reportNotification = GetConvar("ea_reportNotification", "false")
    detailNotification = GetConvar("ea_detailNotification", "false")
 end
 refreshWebhookConvars()

RegisterCommand("ea_testWebhook", function(source, args, rawCommand)
	if DoesPlayerHavePermission(source, "server") then
		SendWebhookMessage(moderationNotification, "**Testing Webhook for moderationNotification**", false, 65280)
		SendWebhookMessage(detailNotification, "**Testing Webhook for detailNotification**", false, 65280)
		SendWebhookMessage(reportNotification, "**Testing Webhook for reportNotification**", false, 65280)
		PrintDebugMessage("Webhook Message Sent")
	end
end, false)

RegisterCommand("ea_excludeWebhookFeature", function(source, args, rawCommand)
	if DoesPlayerHavePermission(source, "server") then
		ExcludedWebhookFeatures = Set(args)
		PrintDebugMessage("Webhook excludes set", 3)
	end
end, false)


function isWebhookFeatureExcluded(feature)
    return ExcludedWebhookFeatures[feature]
end
exports('isWebhookFeatureExcluded', isWebhookFeatureExcluded)

-- Returns detailNotification if configured, otherwise falls back to moderationNotification.
-- Use this wherever the preferred webhook for an action is needed.
function getPreferredWebhook()
    refreshWebhookConvars()
    return detailNotification ~= "false" and detailNotification or moderationNotification
end

function SendWebhookMessage(webhook,message,feature,colour,title,image)
    refreshWebhookConvars()

    local embed = {
        {
            ["color"] = (colour or 16777214),
            ["title"] = "**"..(title or "EasyAdmin").."**",
            ["description"] = message,
            ["footer"] = {
                ["text"] = "EasyAdmin on "..formatDateString(os.time()),
            },
        }
    }
    if image then
        embed[1]["image"] = { ["url"] = image }
    end

    if GetConvar("ea_botLogChannel", "") ~= "" then
        exports[GetCurrentResourceName()]:LogDiscordMessage(message, feature, colour)
        return
    end

    if webhook ~= "false" and ExcludedWebhookFeatures[feature] ~= true then
        PerformHttpRequest(webhook, function(err, text, headers) end, 'POST', json.encode({embeds = embed}), { ['Content-Type'] = 'application/json' })
    end
end
exports('SendWebhookMessage', SendWebhookMessage)

-- ── Public API for external resources ──────────────────────────────
-- Resolves a named webhook convar to its URL and posts a message.
-- This is the primary entry-point for plugin authors who need to log
-- moderation actions to Discord.
--
-- Supported webhook names:
--   "moderation"     → ea_moderationNotification (default)
--   "detail"         → ea_detailNotification
--   "report"         → ea_reportNotification
--   any non-empty string → used directly as the webhook URL
--
-- When ea_botLogChannel is configured, messages are routed through the
-- Discord bot automatically. Feature exclusion (ExcludedWebhookFeatures)
-- is respected.
--
-- @param message   string   The message body (Discord markdown supported)
-- @param options   table?   Optional configuration:
--   .webhook   string  Webhook name or direct URL (default: "moderation")
--   .feature   string  Feature tag for exclusion filtering (default: nil)
--   .colour    number  Embed colour as decimal (default: 16777214 / red)
--   .title     string  Embed title (default: "EasyAdmin")
--   .image     string  Image URL for the embed (default: nil)
--
-- @usage
--   -- Simple usage (default moderation webhook):
--   exports.EasyAdmin:sendWebhook("**Admin** gave **Player** $500.", { feature = "esx" })
--
--   -- Full control:
--   exports.EasyAdmin:sendWebhook("Action logged", {
--     webhook = "detail",
--     feature = "qb",
--     colour = 65280,
--     title = "ESX Plugin",
--   })

function sendWebhook(message, options)
    if type(message) ~= 'string' or message == '' then
        PrintDebugMessage("sendWebhook: message must be a non-empty string", 2)
        return
    end

    options = options or {}
    local webhookName = options.webhook or "moderation"
    local feature = options.feature
    local colour = options.colour
    local title = options.title
    local image = options.image

    -- Resolve named webhook to actual URL
    local webhookUrl
    if webhookName == "moderation" then
        webhookUrl = GetConvar("ea_moderationNotification", "false")
    elseif webhookName == "detail" then
        webhookUrl = GetConvar("ea_detailNotification", "false")
    elseif webhookName == "report" then
        webhookUrl = GetConvar("ea_reportNotification", "false")
    elseif type(webhookName) == "string" and webhookName ~= "" then
        webhookUrl = webhookName  -- treat as direct URL
    else
        webhookUrl = GetConvar("ea_moderationNotification", "false")
    end

    SendWebhookMessage(webhookUrl, message, feature, colour, title, image)
end
exports('sendWebhook', sendWebhook)