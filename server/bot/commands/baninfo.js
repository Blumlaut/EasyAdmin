

module.exports = {
	data: new SlashCommandBuilder()
		.setName('baninfo')
		.setDescription('Shows details of a ban')
        .addIntegerOption(option =>
            option.setName('banid')
                .setDescription('Ban ID')
                .setRequired(true)),
	async execute(interaction, exports) {
		const banId = interaction.options.getInteger('banid')

		var ban = await exports[EasyAdmin].fetchBan(banId)
		if (ban) {
			var embed = new EmbedBuilder()
			.setColor(16777214)
			.setTimestamp()

			var discordAccount = false
			for (let identifier of ban.identifiers) {
				if (identifier.search("discord:") != -1) {
					discordAccount = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
				}
			}

			embed.addFields([
				{ name: 'Ban Info', value: `Ban infos for **#${banId}**`},
				{ name: 'Username', value: `\`\`\`${ban.name}\`\`\``, inline: true}
			])

			if (discordAccount) {
				embed.addFields([{ name: 'Discord Account', value: `\`\`\`${discordAccount.tag}\`\`\``, inline: true}])
				embed.setThumbnail(discordAccount.avatarURL())
			}
			embed.addFields([
				{ name: 'Banned by', value: `\`\`\`${ban.banner}\`\`\``, inline: true},
				{ name: 'Reason', value: `\`\`\`\n${ban.reason}\`\`\``, inline: false},
				{ name: 'Expires', value: `\`\`\`${ban.expireString}\`\`\``, inline: true}
			])

			
			interaction.reply({ embeds: [embed]})
		} else {
			var embed = await prepareGenericEmbed(`No ban was found with this ID.`)
			interaction.reply({ embeds: [embed]})
		}
	},
};
