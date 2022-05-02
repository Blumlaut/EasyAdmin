

module.exports = {
	data: new SlashCommandBuilder()
		.setName('freeze')
		.setDescription('Freezes player')
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

		var ret = await exports[EasyAdmin].freezePlayer(user.id, true)

		if (ret) {
			var embed = await prepareGenericEmbed(`Successfully froze **${user.name}**.`);

			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Could not freeze **${user.name}**.`);

			await interaction.reply({ embeds: [embed]});
		}
	},
};
