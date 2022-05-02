

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('send a announcement to the server')
		.addStringOption(option =>
		    option.setName('reason')
				.setDescription('Reason Text')
				.setRequired(true)),
	async execute(interaction, exports) {
		var reason = exports[EasyAdmin].formatShortcuts(interaction.options.getString('reason'))
		
		var ret = await exports[EasyAdmin].announce(reason)
		if (ret) {
		    var embed = await prepareGenericEmbed(`Succesfully sent an announcement \nreason: ${reason}`)
		    await interaction.reply({embeds: [embed]})
		} else {
		    var embed = await prepareGenericEmbed(`Could not send an annoucement.`)
		    await interaction.reply({embeds: [embed]})
		}

	},
};
