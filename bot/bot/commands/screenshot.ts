import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('screenshot')
		.setDescription('Takes a screenshot of the player\'s screen')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''
		const loadingEmbed = await shared.prepareGenericEmbed('Taking Screenshot, please wait.')
		await interaction.reply({ embeds: [loadingEmbed!] })

		const inProgress = await shared.ea().isScreenshotInProgress()
		if (inProgress) {
			const embed = await shared.prepareGenericEmbed('A screenshot is already in progress! Please try again later.')
			await interaction.editReply({ embeds: [embed!] })
			return
		}

		const user = await shared.findPlayerFromUserInput(userOrId)
		if (!user || user.dropped) {
			await interaction.editReply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.') })
			return
		}

		emit('EasyAdmin:TakeScreenshot', user.id)

		const screenshotHandler = async function (result: string) {
			if (result === 'ERROR') { return }

			const screenshotUrl = await shared.ea().matchURL(result.toString())
			RemoveEventHandler('EasyAdmin:TookScreenshot', screenshotHandler)
			clearTimeout(failedTimeout)

			const embed = await shared.prepareGenericEmbed(
				`Screenshot of **${user.name}**'s game taken.`,
				undefined,
				undefined,
				undefined,
				screenshotUrl,
			)
			await interaction.editReply({ embeds: [embed!] })
		}

		onNet('EasyAdmin:TookScreenshot', screenshotHandler)

		const failedTimeout = setTimeout(async () => {
			RemoveEventHandler('EasyAdmin:TookScreenshot', screenshotHandler)
			const embed = await shared.prepareGenericEmbed(
				`Screenshot of **${user.name}**'s game failed!`,
				undefined,
				16711680,
			)
			await interaction.editReply({ embeds: [embed!] })
		}, 25000)
	},
}
