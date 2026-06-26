import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('cleanup')
		.setDescription('Cleans up area of type')
		.addStringOption(option =>
			option.setName('type')
				.setDescription('Type of Entity to clean up.')
				.setRequired(true)
				.addChoices(
					{ name: 'Vehicles', value: 'cars' },
					{ name: 'Peds', value: 'peds' },
					{ name: 'Props', value: 'props' },
				)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const type = interaction.options.getString('type') ?? ''

		const ret = shared.ea().cleanupArea(type)

		if (ret) {
			const embed = await shared.prepareGenericEmbed(`Cleaned up **${type}**.`)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(`Could not cleanup **${type}**.`)
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
