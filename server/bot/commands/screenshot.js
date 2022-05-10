

module.exports = {
	data: new SlashCommandBuilder()
		.setName('screenshot')
		.setDescription('Takes a screenshot of the player\'s screen')
		.addStringOption(option =>
		    option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),
	async execute(interaction, exports) {
		const userOrId = interaction.options.getString('user')
		var embed = await prepareGenericEmbed(`Taking Screenshot, please wait.`);
		await interaction.reply({ embeds: [embed]});


		var inProgress = await exports[EasyAdmin].isScreenshotInProgress()
		if (inProgress) {
			var embed = await prepareGenericEmbed(`A screenshot is already in progress! Please try again later.`);
			interaction.editReply({ embeds: [embed]});
			return
		}

		const user = await findPlayerFromUserInput(userOrId)
		if (!user || user.dropped) {
			interaction.editReply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true})
			return
		}

		emit('EasyAdmin:TakeScreenshot', user.id)

		const screenshotHandler = async function (result) {
			if (result == "ERROR") { return }

			var screenshotUrl = await exports[EasyAdmin].matchURL(result.toString())
			RemoveEventHandler("EasyAdmin:TookScreenshot", screenshotHandler)
			clearTimeout(failedTimeout)

			var embed = await prepareGenericEmbed(`Screenshot of **${user.name}**'s game taken.`,undefined,undefined,undefined,screenshotUrl);
			await interaction.editReply({ embeds: [embed]});
		}


		onNet('EasyAdmin:TookScreenshot', screenshotHandler)

		var failedTimeout = setTimeout(async function () {
			RemoveEventHandler("EasyAdmin:TookScreenshot", screenshotHandler)
			var embed = await prepareGenericEmbed(`Screenshot of **${user.name}**'s game failed!`, undefined, 16711680);
			await interaction.editReply({ embeds: [embed]});
		}, 25000);
	},
};
