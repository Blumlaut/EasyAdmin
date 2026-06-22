

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks a User')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for the kick')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		const reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: t("Sorry, I couldn't find any user with the info you provided."), ephemeral: true})
			return
		}


		DropPlayer(user.id, t("Kicked by {by}, Reason: {reason}", { by: interaction.user.tag, reason: reason }))

		var embed = await prepareGenericEmbed(t("Successfully kicked **{name}** for **{reason}**", { name: user.name, reason: reason }))

		await interaction.reply({ embeds: [embed]})
	},
}
