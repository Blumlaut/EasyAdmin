const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleanup')
		.setDescription('Cleans up area of type')
		.addStringOption(option =>
			option.setName('type')
			.setDescription('Type of Entity to clean up.')
			.setRequired(true)
			.addChoices([
				['Vehicles', "cars"],
				['Peds', "peds"],
				["Props", "props"]
			])),
			
	async execute(interaction, exports) {
		const type = interaction.options.getString('type')

		var ret = exports[EasyAdmin].cleanupArea(type)

		if (ret) {
			await interaction.reply('Cleaned up **'+type+'**.');
		} else {
			await interaction.reply('Could clean up **'+type+'**.');
		}
	},
};
