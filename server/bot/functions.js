
async function LogDiscordMessage() {
    var text = Array.from(arguments).toString();
    
    const embed = new Discord.MessageEmbed()
    .setTimestamp()
    .addField("EasyAdmin", text)
    
    client.channels.cache.get(logChannel).send({ embeds: [embed] })
}
