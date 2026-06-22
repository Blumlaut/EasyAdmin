

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans a User')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for the ban')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('timeframe')
				.setDescription('Ban duration (e.g. 30 mins, 1 hour, 2 weeks, or permanent)')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		const reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		const timeframe = exports[EasyAdmin].formatShortcuts(interaction.options.getString('timeframe'))

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: t("Sorry, I couldn't find any user with the info you provided."), ephemeral: true})
			return
		}

		var banTime

		try {
			if (timeframe.toLowerCase() == 'permanent') {
				banTime = 10444633200
			} else {
				banTime = await juration.parse(timeframe)
				if (banTime > 10444633200) {
					banTime = 10444633200
				}
			}
		} catch (error) {
			console.error(error)
			interaction.reply({ content: t("Sorry, I couldn't understand the timeframe you provided."), ephemeral: true })
			return
		}


		if (banTime < 10444633200 && !await DoesGuildMemberHavePermission(interaction.member, 'player.ban.temporary')) {
			interaction.reply({ content: t("Insufficient permissions, you need `easyadmin.player.ban.temporary`."), ephemeral: true })
			return
		} else if (banTime > 10444633200 && !await DoesGuildMemberHavePermission(interaction.member, 'player.ban.permanent')) {
			interaction.reply({ content: t("Insufficient permissions, you need `easyadmin.player.ban.permanent`."), ephemeral: true })
			return
		}

		var ban = exports[EasyAdmin].addBan(user.id, reason, banTime, interaction.user.tag)
		if (ban) {
			let embed = await prepareGenericEmbed(t("Successfully banned **{name}** for **{reason}** until {expires} [#{id}].", { name: user.name, reason: reason, expires: ban.expireString, id: ban.banid }))
			await interaction.reply({ embeds: [embed]})
		} else {
			let embed = await prepareGenericEmbed(t("Failed banning **{name}**.", { name: user.name }))
			await interaction.reply({ embeds: [embed]})
		}
	},
}
