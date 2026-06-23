import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('unfreeze')
		.setDescription('Unfreezes player')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.'), ephemeral: true })
			return
		}

		const ret = await shared.ea().freezePlayer(user.id, false)

		if (ret) {
			const embed = await shared.prepareGenericEmbed(`Successfully unfroze **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(`Could not unfreeze **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
