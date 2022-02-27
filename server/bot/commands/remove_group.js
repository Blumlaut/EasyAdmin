

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove_group')
		.setDescription('Removes a group from a User (ACE), saves into easyadmin_permissions.cfg')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('group')
                .setDescription('the group, for example, admin, "group." is prefixed automatically!')
                .setRequired(true)),
	async execute(interaction, exports) {
		const user = interaction.options.getUser('user').id
        const groupName = interaction.options.getString('group')


        var query = `remove_principal identifier.discord:${user} group.${groupName}`
        exports[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `add_principal identifier.discord:${user} group.${groupName}`)

        ExecuteCommand(query)

        interaction.reply(`Removed <@${user}> from \`group.${groupName}\``)
	},
};
