
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