const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a User')
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
        

        emitNet("EasyAdmin:warnPlayer", user.id, reason)
		var embed = await prepareGenericEmbed(`Successfully warned **${user.name}** for **${reason}**`);
        
		await interaction.reply({ embeds: [embed]});
	},
};
