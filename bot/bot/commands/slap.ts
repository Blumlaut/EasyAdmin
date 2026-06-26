import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('slap')
		.setDescription('Substracts amount of HP from player')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Amount of HP to slap the user for.')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''
		const slapAmount = interaction.options.getInteger('amount') ?? 0

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.'), ephemeral: true })
			return
		}

		const ret = await Promise.resolve(shared.ea().slapPlayer(user.id, slapAmount))

		if (ret) {
			const embed = await shared.prepareGenericEmbed(`Successfully slapped **${user.name}** for ${slapAmount} HP.`)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(`Could not slap **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
