import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('unbans a User')
		.addIntegerOption(option =>
			option.setName('banid')
				.setDescription('Ban ID')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const banId = interaction.options.getInteger('banid') ?? 0

		const ret = await shared.ea().unbanPlayer(banId)

		if (ret === true) {
			const embed = await shared.prepareGenericEmbed(`Successfully removed Ban **#${banId}**.`)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(`Failed to remove ban **#${banId}**, make sure the ID is valid.`)
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
