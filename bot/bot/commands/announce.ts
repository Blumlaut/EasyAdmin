import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('send a announcement to the server')
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason Text')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const reason = shared.ea().formatShortcuts(interaction.options.getString('reason') ?? '')

		const ret = await shared.ea().announce(reason)
		if (ret) {
			const embed = await shared.prepareGenericEmbed(`Successfully sent an announcement\nreason: ${reason}`)
			await interaction.reply({ embeds: [embed!]} )
		} else {
			const embed = await shared.prepareGenericEmbed('Could not send an announcement.')
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
