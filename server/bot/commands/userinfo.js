const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Gives Info about User')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Username or ID')
                .setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('query')
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

		var displayedIdentifiers = []
		
		for (let identifier of user.identifiers) {
			if ((isNaN(identifier.charAt(0))) && !(GetConvar("ea_IpPrivacy", "false") == "true" && identifier.search("ip:") != -1)) {
				displayedIdentifiers.push(identifier)
			}
		}

		var table = AsciiTable.factory({
			heading: [ 'Identifiers']
		  , rows: displayedIdentifiers
		  })



        
		await interaction.reply('User Infos for **'+user.name+'**\nIs Admin: '+exports[EasyAdmin].IsPlayerAdmin(user.id)+'\nWarnings: '+exports[EasyAdmin].getPlayerWarnings(user.id)+'\n```'+table+'```');
	},
};
