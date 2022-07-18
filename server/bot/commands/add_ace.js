

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_ace')
		.setDescription('Adds a permission to a group, saves into easyadmin_permissions.cfg'),
	async execute(interaction, exports) {
		var timestamp = Date.now()

		const modal = new ModalBuilder()
			.setCustomId('addaceModal'+timestamp)
			.setTitle('Add ACE');

		const groupName = new TextInputBuilder()
			.setCustomId('groupName')
			.setLabel("Group Name")
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(120)
			.setPlaceholder('group.admin');

		const permission = new TextInputBuilder()
			.setCustomId('permission')
			// The label is the prompt the user sees for this input
			.setLabel("Permission")
			// Short means only a single line of text
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setMaxLength(120)
			.setPlaceholder('easyadmin.bot.playerlist');

		const firstActionRow = new ActionRowBuilder().addComponents(groupName);
		const secondActionRow = new ActionRowBuilder().addComponents(permission);

		modal.addComponents(firstActionRow, secondActionRow);

		interaction.showModal(modal);

		const filter = (interaction) => interaction.customId === 'addaceModal'+timestamp;
		interaction.awaitModalSubmit({ filter, time: 120000 })
		.then(async (interaction) => {
			var group = interaction.fields.getTextInputValue('groupName');
			var permission = interaction.fields.getTextInputValue('permission');
			var query = `add_ace ${group} ${permission} allow`
			exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", query)
	
			ExecuteCommand(query)
	
			interaction.reply(`\`${query}\` has been executed and saved.`)

		}).catch(async (error) => {}) // silently catch error, happens if the form times out
	},
};
