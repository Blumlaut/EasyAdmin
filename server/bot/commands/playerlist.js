const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playerlist')
		.setDescription('Shows a list of all Players'),
	async execute(interaction, exports) {

		var players = getPlayers()
		var table = new AsciiTable()
		table.setHeading('Id', 'Name', 'Discord')
		 

		if (players.length != 0) {
			for (let player of players) {
				const user = await exports[EasyAdmin].getCachedPlayer(player)
				var username = user.name
				var discordAccount = "N/A"

				for (let identifier of user.identifiers) {
                    if (identifier.search("discord:") != -1) {
                        discordAccount = (await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))).tag
                    }
                }

				table.addRow(player, username, discordAccount)
			}
		} else {
			table = "There are no players on the server!"
		}

		var embed = await prepareGenericEmbed('```'+table+'```');
        
		await interaction.reply({ embeds: [embed]});
	},
};
