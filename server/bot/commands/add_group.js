

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
				.setDescription('the group, for example, group.admin')
				.setRequired(true)),
	async execute(interaction, exports) {
		const user = interaction.options.getUser('user').id
		const groupName = interaction.options.getString('group')


		var query = `add_principal identifier.discord:${user} ${groupName}`
		exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", query)

		ExecuteCommand(query)

		interaction.reply(`\`${query}\` has been executed and saved.`)
	},
};
