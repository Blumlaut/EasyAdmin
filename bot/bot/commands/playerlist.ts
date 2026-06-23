import {
	ActionRowBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	SlashCommandBuilder,
} from 'discord.js'
import type {
	ChatInputCommandInteraction,
	StringSelectMenuInteraction,
} from 'discord.js'

import * as shared from '../shared'

function generatePaginatorRow(idFields: string[], curPage: number, embedTimestamp: number) {
	const row = new ActionRowBuilder()

	const selector = new StringSelectMenuBuilder()
	const fieldLength = idFields.length || 1
	selector.setCustomId(`pageSelector${embedTimestamp}`)
	selector.setPlaceholder(`Page ${curPage + 1}/${fieldLength}`)

	for (let i = 0; i < fieldLength; i++) {
		selector.addOptions([{
			label: `Page ${i + 1}/${fieldLength}`,
			value: `${i}`,
		}])
	}
	if (!idFields[1]) {
		selector.setDisabled(true)
	}
	row.addComponents([selector])
	return row
}

function generateEmbedFields(embed: EmbedBuilder, idFields: string[], usernameFields: string[], discordNameFields: string[], curPage: number): void {
	embed.addFields([{
		name: 'Id',
		value: idFields[curPage],
		inline: true,
	}, {
		name: 'Name',
		value: usernameFields[curPage],
		inline: true,
	}, {
		name: 'Discord',
		value: discordNameFields[curPage],
		inline: true,
	}])
}

export default {
	data: new SlashCommandBuilder()
		.setName('playerlist')
		.setDescription('Shows a list of all Players'),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const tempReply = await shared.prepareGenericEmbed('```Processing Playerlist..```')
		await interaction.reply({ embeds: [tempReply!] })

		const players = await shared.ea().getCachedPlayers()
		const embedTimestamp = Date.now()

		let embed = new EmbedBuilder()
			.setColor(65280)
			.setTimestamp()

		const idFields: string[] = []
		const usernameFields: string[] = []
		const discordNameFields: string[] = []
		let ids = ''
		let usernames = ''
		let discordnames = ''
		let curPage = 0

		if (getPlayers().length !== 0) {
			for (const player of Object.values(players) as CachedPlayer[]) {
				if (!player.dropped) {
					if (ids.length >= 500 || usernames.length >= 500 || discordnames.length >= 500) {
						idFields.push(ids)
						usernameFields.push(usernames)
						discordNameFields.push(discordnames)
						ids = ''
						usernames = ''
						discordnames = ''
					}

					const discordAccount = await shared.getDiscordAccountFromPlayer(player)
					const discordTag = discordAccount ? (discordAccount as any).tag : 'N/A'

					ids += `\n${player.id}`
					usernames += `\n${player.name}`
					discordnames += `\n${discordTag}`
				}
			}
			idFields.push(ids)
			usernameFields.push(usernames)
			discordNameFields.push(discordnames)

			generateEmbedFields(embed, idFields, usernameFields, discordNameFields, 0)

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _row = generatePaginatorRow(idFields, curPage, embedTimestamp)
			if (idFields.length > 1) {
				const filter = (i: any) => i.customId === `pageSelector${embedTimestamp}`
				const collector = (interaction.channel as any)?.createMessageComponentCollector({
					filter,
					time: 120000,
				})

				collector.on('collect', async (i: StringSelectMenuInteraction) => {
					const newEmbed = new EmbedBuilder()
						.setColor(65280)
						.setTimestamp()
					if (i.customId === `pageSelector${embedTimestamp}`) {
						curPage = parseInt(i.values[0])
					}
					generateEmbedFields(newEmbed, idFields, usernameFields, discordNameFields, curPage)

					const newRow = generatePaginatorRow(idFields, curPage, embedTimestamp)

					await interaction.editReply({
						embeds: [newEmbed],
						components: [newRow.toJSON()],
					})
					await i.deferUpdate()
				})
			}
		} else {
			embed = new EmbedBuilder()
				.setColor(16777214)
				.setTimestamp()
				.addFields([{ name: 'Player List', value: 'There are no players on the server!' }])
		}

		const finalRow = generatePaginatorRow(idFields, 0, embedTimestamp)
		await interaction.editReply({
			embeds: [embed],
			components: [finalRow.toJSON()],
		})
	},
}
