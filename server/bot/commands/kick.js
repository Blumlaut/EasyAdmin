const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks a User')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Username or ID')
                .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason Text')
                        .setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('query')
        const reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		var user = null


		var players = await exports[EasyAdmin].getCachedPlayers()

		Object.keys(players).forEach(function(key) {
			var player = players[key]
			var name = player.name
			if(!isNaN(userOrId)) {
				if (player.id == userOrId) {
					user = player
				}
			} else {
				if (name.search(userOrId) != -1) {
					user = player
				}
			}
		})

		if (!user) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided, if they have recently left, try using their ID instead of username", ephemeral: true})
			return
		}
        

        DropPlayer(user.id, sprintf(exports[EasyAdmin].GetLocalisedText("kicked"), interaction.user.tag, reason ))

        
		await interaction.reply('Successfully kicked **'+user.name+'** for **'+reason+'**.');
	},
};
