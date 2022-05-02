

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refreshperms')
		.setDescription('Refreshes your EasyAdmin permissions')
		.addUserOption(option =>
		    option.setName('user')
				.setDescription('the user to refresh permissions for, optional.')
				.setRequired(false)),

	async execute(interaction, exports) {
		const user = interaction.options.getUser('user')
		var member = interaction.member
		if(user && !await DoesGuildMemberHavePermission(interaction.member, `bot.${interaction.commandName}`) == true) {
		    await interaction.reply({ content: 'You don\'t have permission to refresh other users permissions!', ephemeral: true });
		    return
		} else if (user) {
		    member = await interaction.guild.members.fetch(user.id)
		}

		let username =  (user && `${member.displayName}'s`) || "your" 
		await refreshRolesForMember(member)

		var embed = await prepareGenericEmbed(`Successfully refreshed ${username} permissions.`);
		
		await interaction.reply({ embeds: [embed]});
	},
};