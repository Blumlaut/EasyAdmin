

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove_ace')
		.setDescription('Removes a permission from a group, saves into easyadmin_permissions.cfg')
		.addStringOption(option =>
		    option.setName('group')
				.setDescription('The group to remove the permission from, for example, group.admin')
				.setRequired(true))
		.addStringOption(option =>
		    option.setName('permission')
				.setDescription('the permission, for example, easyadmin.bot.playerlist')
				.setRequired(true)),
	async execute(interaction, exports) {
		const group = interaction.options.getString('group')
		const perm = interaction.options.getString('permission')


		var query = `remove_ace ${group} ${perm} allow`
		exports[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `add_ace ${group} ${perm} allow`)

		ExecuteCommand(query)

		interaction.reply(`\`${query}\` has been executed and saved.`)
	},
};
