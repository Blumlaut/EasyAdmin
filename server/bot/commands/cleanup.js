

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleanup')
		.setDescription('Cleans up area of type')
		.addStringOption(option =>
			option.setName('type')
			.setDescription('Type of Entity to clean up.')
			.setRequired(true)
			.addChoices(
				{name:"Vehicles", value:"cars"},
				{name:"Peds", value:"peds"},
				{name:"Props", value:"props"})),
			
	async execute(interaction, exports) {
		const type = interaction.options.getString('type')

		var ret = exports[EasyAdmin].cleanupArea(type)

		if (ret) {
			var embed = await prepareGenericEmbed(`Cleaned up **${type}**.`)

			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Could not cleanup **${type}**.`)
			
			await interaction.reply({ embeds: [embed]});
		}
	},
};
