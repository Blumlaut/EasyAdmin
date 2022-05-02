

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slap')
		.setDescription('Substracts amount of HP from player')
		.addStringOption(option =>
		    option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
			.setDescription('Amount of HP to slap the user for.')
			.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		const slapAmount = interaction.options.getInteger('amount')

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true})
			return
		}

		var ret = exports[EasyAdmin].slapPlayer(user.id, slapAmount)

		if (ret) {
			var embed = await prepareGenericEmbed(`Successfully slapped **${user.name}** for ${slapAmount} HP.`);
		
			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Could not slap **${user.name}**.`);
		
			await interaction.reply({ embeds: [embed]});
		}
	},
};
