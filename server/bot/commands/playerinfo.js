

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playerinfo')
		.setDescription('Gives Info about a Player')
		.addStringOption(option =>
		    option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		
		const user = await findPlayerFromUserInput(userOrId)

		if (!user) {
			interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided, if they have recently left, try using their ID instead of username", ephemeral: true})
			return
		}

		var displayedIdentifiers = []
		
		for (let identifier of user.identifiers) {
			if ((isNaN(identifier.charAt(0))) && !(GetConvar("ea_IpPrivacy", "true") == "true" && identifier.search("ip:") != -1)) {
				displayedIdentifiers.push(identifier)
			}
		}

		var table = AsciiTable.factory({
			heading: [ 'Identifiers'], 
			rows: displayedIdentifiers
		})

		var discordAccount = await getDiscordAccountFromPlayer(user)
		var discordName = "N/A"
		if (discordAccount) {
			discordName = discordAccount.tag
		}
	

		var embed = new EmbedBuilder()
			.setColor(16777214)
			.setTimestamp()

		embed.addFields([
			{ name: 'Player Info', value: `Player infos for **${user.name}**`},
			{ name: 'Discord Account', value: `\`\`\`${discordName}\`\`\``, inline: true}
		])

		if (discordAccount) {
			embed.setThumbnail(discordAccount.avatarURL())
		}

		embed.addFields([
			{ name: 'Admin', value: `\`\`\`${exports[EasyAdmin].IsPlayerAdmin(user.id)}\`\`\``, inline: true},
			{ name: 'Warnings', value: `\`\`\`${exports[EasyAdmin].getPlayerWarnings(user.id)}\`\`\``, inline: true}
		])



		if (!user.dropped) {
			var playerPed = GetPlayerPed(user.id)
			embed.addFields([
				{ name: 'Health', value: `\`\`\`${GetEntityHealth(playerPed)}\`\`\``, inline: true},
				{ name: 'Armour', value: `\`\`\`${GetPedArmour(playerPed)}\`\`\``, inline: true}
			])
			if (GetPlayerInvincible(user.id)) {
				embed.addFields([{ name: 'Godmode', value: '\`\`\`ON\`\`\`', inline: true}])
			}
		} else {
			embed.addFields([{ name: 'Status', value: `\`\`\`Player Disconnected\`\`\``}])
		}


		embed.addFields([{ name: 'Identifiers', value: `\`\`\`${table}\`\`\``}])
	
		await interaction.reply({ embeds: [embed]});
	},
};
