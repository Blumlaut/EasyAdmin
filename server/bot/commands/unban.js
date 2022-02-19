const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('unbans a User')
        .addIntegerOption(option =>
            option.setName('banid')
                .setDescription('Ban ID')
                .setRequired(true)),
	async execute(interaction, exports) {
		const banId = interaction.options.getInteger('banid')

		
		emit("EasyAdmin:unbanPlayer", banId) // todo: add easyadmin function to fetch a ban.
		var embed = await prepareGenericEmbed('Removed Ban #'+banId+".");
        
		await interaction.reply({ embeds: [embed]});
	},
};
