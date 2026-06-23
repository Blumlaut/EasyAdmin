import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mutes a User')
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

		const ret = await shared.ea().mutePlayer(user.id, true)

		if (ret) {
			const embed = await shared.prepareGenericEmbed(`Successfully muted **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(`Could not mute **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
