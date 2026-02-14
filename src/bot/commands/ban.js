

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
			interaction.reply({ content: 'Sorry, i couldn\'t find any user with the infos you provided.', ephemeral: true})
			return
		}

		var banTime = parseBanTime(timeframe)

		if (banTime === null) {
			interaction.reply({ content: 'Sorry, i couldn\'t understand the timeframe you provided.', ephemeral: true })
			return
		}

		if (!await checkBanPermission(interaction.member, banTime, interaction)) {
			return
		}

		await executeBan(interaction, user, reason, banTime)
	},
}

async function parseBanTime(timeframe) {
	try {
		if (timeframe.toLowerCase() == 'permanent') {
			return 10444633200
		}

		var banTime = await juration.parse(timeframe)
		if (banTime > 10444633200) {
			return 10444633200
		}

		return banTime
	} catch (error) {
		console.error(error)
		return null
	}
}

async function checkBanPermission(member, banTime, interaction) {
	var maxTime = banTime < 10444633200 ? 'player.ban.temporary' : 'player.ban.permanent'

	if (!await DoesGuildMemberHavePermission(member, maxTime)) {
		var permissionName = banTime < 10444633200 ? 'easyadmin.player.ban.temporary' : 'easyadmin.player.ban.permanent'
		interaction.reply({ content: `Insufficient Permissions, you need \`${permissionName}\`.`, ephemeral: true })
		return false
	}

	return true
}

async function executeBan(interaction, user, reason, banTime) {
	var ban = exports[EasyAdmin].addBan(user.id, reason, banTime, interaction.user.tag)

	if (ban) {
		let embed = await prepareGenericEmbed(`Successfully banned **${user.name}** for **${reason}** until ${ban.expireString} [#${ban.banid}.`)
		await interaction.reply({ embeds: [embed]})
	} else {
		let embed = await prepareGenericEmbed(`Failed banning **${user.name}**.`)
		await interaction.reply({ embeds: [embed]})
	}
}
