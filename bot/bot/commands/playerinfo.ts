import AsciiTable from 'ascii-table'
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('playerinfo')
		.setDescription('Gives Info about a Player')
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

		const displayedIdentifiers: string[] = []

		for (const identifier of user.identifiers) {
			if ((isNaN(identifier.charAt(0) as any)) && !(GetConvar('ea_IpPrivacy', 'true') === 'true' && identifier.search('ip:') !== -1)) {
				displayedIdentifiers.push(identifier)
			}
		}

		const table = AsciiTable({
			heading: ['Identifiers'],
			rows: displayedIdentifiers.map(id => [id]),
		})

		const discordAccount = await shared.getDiscordAccountFromPlayer(user)
		let discordName = 'N/A'
		if (discordAccount) {
			discordName = (discordAccount as any).tag
		}

		const embed = new EmbedBuilder()
			.setColor(16777214)
			.setTimestamp()

		embed.addFields([
			{ name: 'Player Info', value: `Player infos for **${user.name}**` },
			{ name: 'Discord Account', value: `\`\`\`${discordName}\`\`\``, inline: true },
		])

		if (discordAccount) {
			embed.setThumbnail((discordAccount as any).avatarURL() ?? '')
		}

		embed.addFields([
			{ name: 'Admin', value: `\`\`\`${shared.ea().IsPlayerAdmin(user.id)}\`\`\``, inline: true },
			{ name: 'Warnings', value: `\`\`\`${shared.ea().getPlayerWarnings(user.id)}\`\`\``, inline: true },
		])

		if (!user.dropped) {
			const playerPed = GetPlayerPed(user.id)
			embed.addFields([
				{ name: 'Health', value: `\`\`\`${GetEntityHealth(playerPed)}\`\`\``, inline: true },
				{ name: 'Armour', value: `\`\`\`${GetPedArmour(playerPed)}\`\`\``, inline: true },
			])
			if (GetPlayerInvincible(user.id)) {
				embed.addFields([{ name: 'Godmode', value: '```ON```', inline: true }])
			}
		} else {
			embed.addFields([{ name: 'Status', value: '```Player Disconnected```' }])
		}

		embed.addFields([{ name: 'Identifiers', value: `\`\`\`${table}\`\`\`` }])

		await interaction.reply({ embeds: [embed] })
	},
}
