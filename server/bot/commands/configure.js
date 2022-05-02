
async function configForward(interaction, exports) {
	var embed = await prepareGenericEmbed(`Alright! Now please write the type of log to forward (see <https://easyadmin.readthedocs.io/en/latest/config/> for examples)`);


	if (!interaction.replied) {
		await interaction.reply({ embeds: [embed]});
	} else {
		await interaction.followUp({ embeds: [embed]});
	}

	const filter = m => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
	const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

	collector.on('collect', async m => {
		await m.fetch()
		let embed = await prepareGenericEmbed(`Great! Now please tag the channel you want me to log this in (like this: <#${interaction.channel.id}>).`);


		await interaction.followUp({ embeds: [embed]});
		const filter = m => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
		const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

		collector.on('collect', async message => {
			await message.fetch()
			let channel = message.mentions.channels.first().id

			exports[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `ea_addBotLogForwarding ${m.cleanContent}`, true)

			exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `ea_addBotLogForwarding ${m.cleanContent} ${channel}`)
			

			addBotLogForwarding("", [m.cleanContent, channel])
			interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.")
		})

	});
}


async function configBridge(interaction, exports) {
	var embed = await prepareGenericEmbed(`Alright! Please tag the channel you want me to bridge (like this: <#${interaction.channel.id}>).`);


	if (!interaction.replied) {
		await interaction.reply({ embeds: [embed]});
	} else {
		await interaction.followUp({ embeds: [embed]});
	}

	const filter = m => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
	const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

	collector.on('collect', async m => {
		await m.fetch()
		let channel = m.mentions.channels.first().id

		exports[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `set ea_botChatBridge`, true)

		exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `set ea_botChatBridge ${channel}`)

		SetConvar('ea_botChatBridge', `${channel}`)
		
		interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.")

	});
}

async function configLiveStatus(interaction, exports) {
	var embed = await prepareGenericEmbed(`Alright! Please tag the channel you want me to post the live status in, make sure its empty and that normal people can't write there! (like this: <#${interaction.channel.id}>).`);


	if (!interaction.replied) {
		await interaction.reply({ embeds: [embed]});
	} else {
		await interaction.followUp({ embeds: [embed]});
	}

	const filter = m => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
	const collector = interaction.channel.createMessageCollector({ filter, time: 10000, max: 1 });

	collector.on('collect', async m => {
		await m.fetch()
		let channel = m.mentions.channels.first().id

		exports[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `set ea_botStatusChannel`, true)

		exports[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `set ea_botStatusChannel ${channel}`)

		SetConvar('ea_botStatusChannel', `${channel}`)
		
		interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.")

	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configure')
		.setDescription('Configure various easyadmin features')
		.addStringOption(option =>
			option.setName('setting')
				.setDescription('The setting to change')
				.setRequired(true)
				.addChoices(
					{name:'Log Forwarding', value: 'logfwd'},
					{name:'Chat Bridge', value: 'chatbridge'},
					{name:'Live Server Status', value: 'serverstatus'}
				)),
	async execute(interaction, exports) {
		const setting = interaction.options.getString('setting')


		if (setting == "logfwd") {
			configForward(interaction, exports)
		} else if (setting == "chatbridge") {
			configBridge(interaction, exports)
		} else if (setting == "serverstatus") {
			configLiveStatus(interaction, exports)
		}
	},
};
