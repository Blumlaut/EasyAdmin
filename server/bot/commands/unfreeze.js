

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unfreeze')
		.setDescription('Unfreezes player')
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

		var ret = await exports[EasyAdmin].freezePlayer(user.id, false)

		if (ret) {
			var embed = await prepareGenericEmbed(`Successfully unfroze **${user.name}**.`);
		
			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Could not unfreeze **${user.name}**.`);
		
			await interaction.reply({ embeds: [embed]});
		}
	},
};
