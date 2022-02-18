// this file contains util functions the bot uses

const { Guild } = require("discord.js");


async function LogDiscordMessage() {
    var text = Array.from(arguments).toString();
    
    const embed = new Discord.MessageEmbed()
    .setTimestamp()
    .addField("EasyAdmin", text)
    
    client.channels.cache.get(logChannel).send({ embeds: [embed] })
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
        object = "easyadmin."+object
    }

    if (member.guild.ownerId === member.id) { // guild owner always has permissions, to everything.
        return true
    }


    return IsPrincipalAceAllowed("identifier.discord:"+member.id, object)
}
