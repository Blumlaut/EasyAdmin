// this file contains util functions the bot uses
async function LogDiscordMessage(text, feature) {
    if (!EasyAdmin) {return} // bot isnt running
    if (GetConvar("ea_botLogChannel", "") == "") {return}
    if (feature == "report" || feature == "calladmin") {return} // we dont care about reports, these get handled in reports.js

    const embed = await prepareGenericEmbed(text)
    
    client.channels.cache.get(GetConvar("ea_botLogChannel", "")).send({ embeds: [embed] }).catch((error) => {
        console.error("^7Failed to log message, please make sure you gave the bot permission to write in the log channel!\n\n")
        console.error(error)
        return
    })
}
exports('LogDiscordMessage', LogDiscordMessage)


async function prepareGenericEmbed(message,feature,colour,title,image,customAuthor,description,timestamp) {

    if (feature && await exports[EasyAdmin].isWebhookFeatureExcluded(feature)) {
        return
    }

    const embed = new EmbedBuilder()
    .setColor(colour || 65280)
    if (timestamp != false) {
        embed.setTimestamp()
    }
    if (message) {
        embed.addFields({name: `**${(title || "EasyAdmin")}**`, value: message})
    }
    if (description) {
        embed.setDescription(description)
    }

    if (customAuthor) {
        embed.setAuthor(customAuthor)
    }

    if (image) {
        embed.setImage(image)
    }

    return embed
}

async function findPlayerFromUserInput(input) {
    var user = undefined

    var players = await exports[EasyAdmin].getCachedPlayers()

    Object.keys(players).forEach(function(key) {
        var player = players[key]
        var name = player.name
        if(!isNaN(input)) {
            if (player.id == input) {
                user = player
            }
        } else {
            if (name.search(input) != -1) {
                user = player
            }
        }
    })

    return user
}


async function DoesGuildMemberHavePermission(member, object) { // wrapper for Discord Permissions, use export for Player Permissions.

    if (object.search('easyadmin.') == -1) {
        object = `easyadmin.${object}`
    }

    if (member.guild.ownerId === member.id) { // guild owner always has permissions, to everything.
        return true
    }


    return IsPrincipalAceAllowed(`identifier.discord:${member.id}`, object)
}


async function getDiscordAccountFromPlayer(user) {
    var discordAccount = false
    if (!isNaN(user)) {
        user = await exports[EasyAdmin].getCachedPlayer(user)
    }

    for (let identifier of user.identifiers) {
        if (identifier.search("discord:") != -1) {
            discordAccount = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
        }
    }

    return discordAccount
}


async function getPlayerFromDiscordAccount(user) {
    var id = user.id

    var players = await exports[EasyAdmin].getCachedPlayers()

    for (let [index, player] of Object.values(players).entries()) {
        for (let identifier of player.identifiers) {
            if (identifier == `discord:${id}`) {
                return player
            }
		}
    }

    return false

}