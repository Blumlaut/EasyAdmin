import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('baninfo')
		.setDescription('Shows details of a ban')
		.addIntegerOption(option =>
			option.setName('banid')
				.setDescription('Ban ID')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const banId = interaction.options.getInteger('banid') ?? 0

		const ban = await shared.ea().fetchBan(banId)
		if (ban) {
			const embed = new EmbedBuilder()
				.setColor(16777214)
				.setTimestamp()

			let discordAccount: any = false
			for (const identifier of ban.identifiers) {
				if (identifier.search('discord:') !== -1) {
					const discordId = identifier.substring(identifier.indexOf(':') + 1)
					try {
						discordAccount = await shared.client.users.fetch(discordId)
					} catch {
						discordAccount = false
					}
				}
			}

			embed.addFields([
				{ name: 'Ban Info', value: `Ban infos for **#${banId}**` },
				{ name: 'Username', value: `\`\`\`${ban.name}\`\`\``, inline: true },
			])

			if (discordAccount) {
				embed.addFields([{ name: 'Discord Account', value: `\`\`\`${discordAccount.tag}\`\`\``, inline: true }])
				embed.setThumbnail(discordAccount.avatarURL() ?? '')
			}
			embed.addFields([
				{ name: 'Banned by', value: `\`\`\`${ban.banner}\`\`\``, inline: true },
				{ name: 'Reason', value: `\`\`\`\n${ban.reason}\`\`\``, inline: false },
				{ name: 'Expires', value: `\`\`\`${ban.expireString}\`\`\``, inline: true },
			])

			await interaction.reply({ embeds: [embed] })
		} else {
			const embed = await shared.prepareGenericEmbed('No ban was found with this ID.')
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
