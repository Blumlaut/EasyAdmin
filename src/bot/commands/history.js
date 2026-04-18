

module.exports = {
	data: new SlashCommandBuilder()
		.setName('history')
		.setDescription('View action history for a player')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')

		const user = await findPlayerFromUserInput(userOrId)

		if (!user) {
			interaction.reply({ content: 'Sorry, I couldn\'t find any user with the info you provided. If they have recently left, try using their ID instead of username.', ephemeral: true })
			return
		}

		const history = await exports[EasyAdmin].getActionHistory(user.identifiers)

		if (!history || history.length === 0) {
			let embed = await prepareGenericEmbed(`No action history found for **${user.name}**.`)
			return interaction.reply({ embeds: [embed] })
		}

		const embed = new EmbedBuilder()
			.setColor(16777214)
			.setTimestamp()

		embed.addFields([{ name: 'Action History', value: `Showing last ${Math.min(history.length, 10)} of ${history.length} action(s) for **${user.name}**` }])

		const entries = history.slice(-10).reverse()
		for (const entry of entries) {
			const date = new Date(entry.time * 1000).toUTCString()
			const reason = entry.reason || 'No reason provided'
			const moderator = entry.moderator || 'Unknown'
			embed.addFields([{
				name: `[#${entry.id}] ${entry.action} — ${date}`,
				value: `**Reason:** ${reason.substring(0, 900)}\n**By:** ${moderator}`,
				inline: false
			}])
		}

		await interaction.reply({ embeds: [embed] })
	},
}
