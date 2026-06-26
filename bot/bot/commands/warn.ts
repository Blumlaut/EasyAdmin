import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a User')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason Text')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''
		const reason = shared.ea().formatShortcuts(interaction.options.getString('reason') ?? '')

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.'), ephemeral: true })
			return
		}

		const src = (interaction.member as any).user.tag ?? 'Unknown'
		const ret = await shared.ea().warnPlayer(src, user.id, reason)
		let embed
		if (ret) {
			embed = await shared.prepareGenericEmbed(`Successfully warned **${user.name}** for **${reason}**`)
		} else {
			embed = await shared.prepareGenericEmbed('Could not warn this user. (Maybe this user is immune)')
		}
		await interaction.reply({ embeds: [embed!] })
	},
}
