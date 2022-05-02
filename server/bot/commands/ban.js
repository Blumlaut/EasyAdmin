

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('bans a User')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('Username or ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason Text')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timeframe')
                .setDescription('The timeframe in a human readable format (30 mins, 1 hour, 2 weeks, or permanent)')
                .setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		const reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		const timeframe = exports[EasyAdmin].formatShortcuts(interaction.options.getString('timeframe'))

		const user = await findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true})
			return
		}

		var banTime = undefined

		try {
			if (timeframe.toLowerCase() == "permanent") {
				banTime = 10444633200
			} else {
				banTime = await juration.parse(timeframe)
				if (banTime > 10444633200) {
					banTime = 10444633200
				}
			}
		} catch (error) {
			console.error(error)
			interaction.reply({ content: "Sorry, i couldn't understand the timeframe you provided.", ephemeral: true })
			return
		}


		if (banTime < 10444633200 && !await DoesGuildMemberHavePermission(interaction.member, "player.ban.temporary")) {
			interaction.reply({ content: "Insufficient Permissions, you need `easyadmin.player.ban.temporary`.", ephemeral: true })
			return
		} else if (banTime > 10444633200 && !await DoesGuildMemberHavePermission(interaction.member, "player.ban.permanent")) {
			interaction.reply({ content: "Insufficient Permissions, you need `easyadmin.player.ban.permanent`.", ephemeral: true })
			return
		}

		var ban = exports[EasyAdmin].addBan(user.id, reason, banTime, interaction.user.tag)
		if (ban) {
			var embed = await prepareGenericEmbed(`Successfully banned **${user.name}** for **${reason}** until ${ban.expireString} [#${ban.banid}.`)

			await interaction.reply({ embeds: [embed]});
		} else {
			var embed = await prepareGenericEmbed(`Failed banning **${user.name}**.`)
			
			await interaction.reply({ embeds: [embed]});
		}
	},
};
