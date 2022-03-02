// this file contains util functions the bot uses
async function LogDiscordMessage() {
    if (GetConvar("ea_botLogChannel", "") == "") {return}
    var text = Array.from(arguments).toString();

    const embed = await prepareGenericEmbed(text)
    
    client.channels.cache.get(GetConvar("ea_botLogChannel", "")).send({ embeds: [embed] })
}
exports('LogDiscordMessage', LogDiscordMessage)


async function prepareGenericEmbed(message,feature,colour,title,image,customAuthor,description,timestamp) {

    if (feature && await exports[EasyAdmin].isWebhookFeatureExcluded(feature)) {
        return
    }

    const embed = new Discord.MessageEmbed()
    .setColor((colour || 65280))
    if (timestamp != false) {
        embed.setTimestamp()
    }
    if (message) {
        embed.addField(`**${(title || "EasyAdmin")}**`, message)
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

    for (let identifier of user.identifiers) {
        if (identifier.search("discord:") != -1) {
            discordAccount = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
        }
    }

    return discordAccount

}