

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
				.setDescription('Reason Text')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		const reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true})
			return
		}


		DropPlayer(user.id, sprintf(exports[EasyAdmin].GetLocalisedText("kicked"), interaction.user.tag, reason ))

		var embed = await prepareGenericEmbed(`Successfully kicked **${user.name}** for **${reason}**`);

		await interaction.reply({ embeds: [embed]});
	},
};
