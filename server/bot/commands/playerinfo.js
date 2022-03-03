

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
			heading: [ 'Identifiers']
		  , rows: displayedIdentifiers
		  })

		  var discordAccount = await getDiscordAccountFromPlayer(user)
		  if (discordAccount) {
			discordAccount = discordAccount.tag
		  } else {
			discordAccount = "N/A"
		  }
		

		  var embed = new Discord.MessageEmbed()
		  .setColor((65280))
		  .setTimestamp()

		  embed.addField('Player Info', `Player infos for **${user.name}**`)
		  embed.addField('Discord Account', `\`\`\`${discordAccount}\`\`\``, true)
		  embed.addField('Admin', `\`\`\`${exports[EasyAdmin].IsPlayerAdmin(user.id)}\`\`\``, true)
		  embed.addField('Warnings', `\`\`\`${exports[EasyAdmin].getPlayerWarnings(user.id)}\`\`\``, true)



		  if (!user.dropped) {
			var playerPed = GetPlayerPed(user.id)
			embed.addField('Health', `\`\`\`${GetEntityHealth(playerPed)}\`\`\``, true)
			embed.addField('Armour', `\`\`\`${GetPedArmour(playerPed)}\`\`\``, true)
			if (GetPlayerInvincible(user.id)) {
				embed.addField('Godmode', '\`\`\`ON\`\`\`', true)
			}
		  } else {
			  embed.addField('Status', `\`\`\`Player Disconnected\`\`\``)
		  }


		  embed.addField('Identifiers', `\`\`\`${table}\`\`\``)
        
		  await interaction.reply({ embeds: [embed]});
	},
};
