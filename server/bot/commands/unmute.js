const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Unmutes a User')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Username or ID')
                .setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true})
			return
		}

		var ret = exports[EasyAdmin].mutePlayer(user.id, false)

		if (ret) {
			await interaction.reply('Successfully unmuted **'+user.name+'**.');
		} else {
			await interaction.reply('Could not unmute **'+user.name+'**.');
		}
	},
};
