import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kicks a User')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for the kick')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''
		const reason = shared.ea().formatShortcuts(interaction.options.getString('reason') ?? '')

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.'), ephemeral: true })
			return
		}

		DropPlayer(user.id, shared.t('Kicked by {by}, Reason: {reason}', { by: interaction.user.tag, reason }))

		const embed = await shared.prepareGenericEmbed(shared.t('Successfully kicked **{name}** for **{reason}**', { name: user.name, reason }))
		await interaction.reply({ embeds: [embed!] })
	},
}
