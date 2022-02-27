

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_group')
		.setDescription('Adds a group to a User (ACE), saves into easyadmin_permissions.cfg')
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


        var query = `add_principal identifier.discord:${user} group.${groupName}`
        exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", query)

        ExecuteCommand(query)

        interaction.reply(`Added <@${user}> to \`group.${groupName}\``)
	},
};
