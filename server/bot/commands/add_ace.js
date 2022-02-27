

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_ace')
		.setDescription('Adds a permission to a group, saves into easyadmin_permissions.cfg')
        .addStringOption(option =>
            option.setName('group')
                .setDescription('The group to add a permission to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('permission')
                .setDescription('the permission, for example, easyadmin.bot.playerlist!')
                .setRequired(true)),
	async execute(interaction, exports) {
		const group = interaction.options.getString('group')
        const perm = interaction.options.getString('permission')


        var query = `add_ace group.${group} ${perm} allow`
        exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", query)

        ExecuteCommand(query)

        interaction.reply(`Added \`${perm}\` to \`group.${group}\``)
	},
};
