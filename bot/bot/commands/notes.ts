import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('notes')
		.setDescription('View admin notes for a player')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided. If they have recently left, try using their ID instead of username.'), ephemeral: true })
			return
		}

		const notes = await shared.ea().getAdminNotes(user.identifiers)

		if (!notes || notes.length === 0) {
			const embed = await shared.prepareGenericEmbed(`No admin notes found for **${user.name}**.`)
			await interaction.reply({ embeds: [embed!] })
			return
		}

		const embed = new EmbedBuilder()
			.setColor(16777214)
			.setTimestamp()

		embed.addFields([{ name: 'Admin Notes', value: `Showing last ${Math.min(notes.length, 10)} of ${notes.length} note(s) for **${user.name}**` }])

		const entries = notes.slice(-10).reverse()
		for (const entry of entries) {
			const moderator = entry.moderator ?? 'Unknown'
			embed.addFields([{
				name: `[#${entry.id}] ${entry.time} — ${moderator}`,
				value: entry.content.substring(0, 1020),
				inline: false,
			}])
		}

		await interaction.reply({ embeds: [embed] })
	},
}
