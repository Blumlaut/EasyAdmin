import juration from 'juration'
import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans a User')
		.addStringOption(option =>
			option.setName('user')
				.setDescription('Username or ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('Reason for the ban')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('timeframe')
				.setDescription('Ban duration (e.g. 30 mins, 1 hour, 2 weeks, or permanent)')
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const userOrId = interaction.options.getString('user') ?? ''
		const reason = shared.ea().formatShortcuts(interaction.options.getString('reason') ?? '')
		const timeframe = shared.ea().formatShortcuts(interaction.options.getString('timeframe') ?? '')

		const user = await shared.findPlayerFromUserInput(userOrId)

		if (!user || user.dropped) {
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t find any user with the info you provided.'), ephemeral: true })
			return
		}

		let banTime: number

		try {
			if (timeframe.toLowerCase() === 'permanent') {
				banTime = 10444633200
			} else {
				banTime = await juration.parse(timeframe)
				if (banTime > 10444633200) {
					banTime = 10444633200
				}
			}
		} catch (error) {
			console.error(error)
			await interaction.reply({ content: shared.t('Sorry, I couldn\'t understand the timeframe you provided.'), ephemeral: true })
			return
		}

		if (banTime < 10444633200 && interaction.member && 'roles' in interaction.member && !await shared.DoesGuildMemberHavePermission(interaction.member as any, 'player.ban.temporary')) {
			await interaction.reply({ content: shared.t('Insufficient permissions, you need `easyadmin.player.ban.temporary`.'), ephemeral: true })
			return
		} else if (banTime >= 10444633200 && interaction.member && 'roles' in interaction.member && !await shared.DoesGuildMemberHavePermission(interaction.member as any, 'player.ban.permanent')) {
			await interaction.reply({ content: shared.t('Insufficient permissions, you need `easyadmin.player.ban.permanent`.'), ephemeral: true })
			return
		}

		const ban = shared.ea().addBan(user.id, reason, banTime, interaction.user.username)
		if (ban) {
			const embed = await shared.prepareGenericEmbed(
				shared.t('Successfully banned **{name}** for **{reason}** until {expires} [#{id}].', {
					name: user.name,
					reason,
					expires: ban.expireString,
					id: ban.banid,
				}),
			)
			await interaction.reply({ embeds: [embed!] })
		} else {
			const embed = await shared.prepareGenericEmbed(shared.t('Failed banning **{name}**.', { name: user.name }))
			await interaction.reply({ embeds: [embed!] })
		}
	},
}
