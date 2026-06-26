import { SlashCommandBuilder } from '@discordjs/builders'
import type { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import * as shared from '../shared'

export default {
	data: new SlashCommandBuilder()
		.setName('refreshperms')
		.setDescription('Refreshes your EasyAdmin permissions')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('the user to refresh permissions for, optional.')
				.setRequired(false)),

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		let member = interaction.member as GuildMember
		const user = interaction.options.getUser('user')
		if (user && user.id === member.id) {
			// user selected themselves, treat as self-refresh
		}

		if (user && !(await shared.DoesGuildMemberHavePermission(member, `bot.${interaction.commandName}`))) {
			await interaction.reply({ content: shared.t('You don\'t have permission to refresh other users\' permissions!'), ephemeral: true })
			return
		}

		if (user) {
			const guild = interaction.guild
			if (guild) {
				member = await guild.members.fetch(user.id)
			}
		}

		const username = user ? `${member.displayName}'s` : 'your'
		await shared.refreshRolesForMember(member)

		const embed = await shared.prepareGenericEmbed(`Successfully refreshed ${username} permissions.`)
		await interaction.reply({ embeds: [embed!] })
	},
}
