const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playerlist')
		.setDescription('Shows a list of all Players'),
	async execute(interaction, exports) {


		var tempReply = await prepareGenericEmbed(`\`\`\`Processing Playerlist..\`\`\``);
		await interaction.reply({ embeds: [tempReply]})

		var players = await exports[EasyAdmin].getCachedPlayers()

		var tables = []

		var thisTable = new AsciiTable()
		thisTable.setHeading('Id', 'Name', 'Discord')

		if (getPlayers().length != 0) {
			for(let [index,player] of Object.values(players).entries()){
				if (!player.dropped) {

					if (thisTable.toString().length >= 900) {
						tables.push(thisTable)
						thisTable = new AsciiTable()
						thisTable.setHeading('Id', 'Name', 'Discord')
					}

					var username = player.name
	
					var discordAccount = await getDiscordAccountFromPlayer(player)
					if (discordAccount) {
						discordAccount = discordAccount.tag
					} else {
						discordAccount = "N/A"
					}
	
	
					thisTable.addRow(player.id, `${await exports[EasyAdmin].IsPlayerAdmin(parseInt(player.id)) == true && `*` || ``} ${username}`, discordAccount)

				}
			}
			tables.push(thisTable)
		} else {
			tables = ["There are no players on the server!"]
		}

		const embed = new Discord.MessageEmbed()
		.setColor((65280))
		.setTimestamp()

		tables.forEach(function(table) {
			embed.addField(`\u200b`, `\`\`\`${table}\`\`\``)
		})
        
		await interaction.editReply({ embeds: [embed]});
	},
};
