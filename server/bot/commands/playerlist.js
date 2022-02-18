const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playerlist')
		.setDescription('Shows a list of all Players'),
	async execute(interaction, exports) {

		var players = getPlayers()
		var table = new AsciiTable()
		table.setHeading('Id', 'Name')
		 

		if (players.length != 0) {
			for (let player of players) {
				var username = await exports[EasyAdmin].getName(player,true,false)
				table.addRow(player, username)
			}
		} else {
			table = "There are no players on the server!"
		}

        
		await interaction.reply('```'+table+'```');
	},
};
