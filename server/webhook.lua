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

function SendWebhookMessage(webhook,message,feature,colour,title,image)
    moderationNotification = GetConvar("ea_moderationNotification", "false")
    reportNotification = GetConvar("ea_reportNotification", "false")
    detailNotification = GetConvar("ea_detailNotification", "false")
    
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