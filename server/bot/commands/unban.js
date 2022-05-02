

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('unbans a User')
		.addIntegerOption(option =>
		    option.setName('banid')
				.setDescription('Ban ID')
				.setRequired(true)),
	async execute(interaction, exports) {
		const banId = interaction.options.getInteger('banid')

		
		var ret = await exports[EasyAdmin].unbanPlayer(banId)

		if (ret == true) {
			var embed = await prepareGenericEmbed(`Successfully removed Ban **#${banId}**.`);
		
			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Failed to remove ban **#${banId}**, make sure the ID is valid.`);
		
			await interaction.reply({ embeds: [embed]});
		}
	},
};
