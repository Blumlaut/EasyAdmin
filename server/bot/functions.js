// this file contains util functions the bot uses

function prepareGenericEmbed(message,feature,colour,title,image,customAuthor,description,timestamp) {
    return new Promise(function(resolve) {
        if (feature && exports[EasyAdmin].isWebhookFeatureExcluded(feature)) {
            resolve()
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

        resolve(embed)
    })
}

function findPlayerFromUserInput(input) {
    return new Promise(function(resolve) {
        var user = undefined

        var players = exports[EasyAdmin].getCachedPlayers()

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

        resolve(user)
    })
}


function DoesGuildMemberHavePermission(member, object) { // wrapper for Discord Permissions, use export for Player Permissions.

    return new Promise(function(resolve) {

        var memberId = member.id
        if(!memberId) {
            resolve(false)
        }
        if (object.search('easyadmin.') == -1) {
            object = `easyadmin.${object}`
        }
    
        if (member.guild.ownerId === memberId) { // guild owner always has permissions, to everything.
            resolve(true)
        }
    
    
        var allowed=IsPrincipalAceAllowed(`identifier.discord:${memberId}`, object)
        resolve(allowed)



    })

}


function getDiscordAccountFromPlayer(user) {
    return new Promise(function(resolve) {
        var discordAccount = false
        if (!isNaN(user)) {
            user = exports[EasyAdmin].getCachedPlayer(user)
        }

        for (let identifier of user.identifiers) {
            if (identifier.search("discord:") != -1) {
                discordAccount = client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
            }
        }

        resolve(discordAccount)
    })
}


function getPlayerFromDiscordAccount(user) {
    return new Promise(function(resolve) {
        var id = user.id

        var players = exports[EasyAdmin].getCachedPlayers()

        for (let [index, player] of Object.values(players).entries()) {
            for (let identifier of player.identifiers) {
                if (identifier == `discord:${id}`) {
                    resolve(player)
                }
            }
        }

        resolve(false)
    })
}