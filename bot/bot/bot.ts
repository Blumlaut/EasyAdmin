import type { Client } from 'discord.js'
import { Collection, InteractionType } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

import { loadTranslations } from './i18n'
import { client } from './client'
import * as shared from './shared'
import { commands } from './commands'
import { logDiscordMessage } from './logging'

// Import all bot modules so they are included in the bundle and their top-level code runs
import './logging'
import './reports'
import './roles'
import './server_status'
import './player_events'
import './chat_bridge'

// --- i18n ---
shared.config.i18nStrings = loadTranslations(GetConvar('ea_LanguageName', 'en'))

;(client as any).commands = new Collection()

// --- Command registration ---
async function registerClientCommands(clientId: string): Promise<void> {
	for (const command of commands) {
		;(client as any).commands.set(command.data.name, command)
	}

	const rest = new REST({ version: '10' }).setToken(GetConvar('ea_botToken', ''))

	// compat: remove existing commands for homeguild
	if (shared.config.guild !== '') {
		await rest.put(Routes.applicationGuildCommands(clientId, shared.config.guild), { body: {} })
	}
	await rest.put(
		Routes.applicationCommands(clientId),
		{ body: commands.map(c => c.data.toJSON()) },
	)

	client.on('interactionCreate', async interaction => {
		if (interaction.type !== InteractionType.ApplicationCommand) return

		const command = (client as any).commands.get(interaction.commandName)
		if (!command) return

		const guildMember = interaction.member
		if (guildMember && 'guild' in guildMember && guildMember.guild) {
			if (!(await shared.DoesGuildMemberHavePermission(guildMember as any, `bot.${command.data.name}`)) && command.data.name !== 'refreshperms') {
				await shared.refreshRolesForMember(guildMember as any)
				if (!(await shared.DoesGuildMemberHavePermission(guildMember as any, `bot.${command.data.name}`))) {
					await interaction.reply({ content: 'You don\'t have permission to run this command!', ephemeral: true })
					return
				}
			}
		}

		try {
			await command.execute(interaction, globalThis.exports)
		} catch (error) {
			console.error(error)
			const errorContent = {
				content: `There was an error while executing this command, please report the following stack trace here: <https://github.com/Blumlaut/EasyAdmin/issues> \`\`\`js\n${(error as Error).stack}\`\`\``,
				ephemeral: true,
			}
			if (interaction.replied) {
				await interaction.followUp(errorContent)
			} else {
				await interaction.reply(errorContent)
			}
		}
	})
}

// --- Startup ---
if (GetConvar('ea_botToken', '') !== '') {
	client.once('clientReady', async () => {
		const readyClient = client as Client & { user: { tag: string; id: string } }
		console.log(`Logged in as ${readyClient.user.tag}!`)
		readyClient.user.setPresence({
			activities: [{ name: `${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}`, type: 3 as any }],
			status: 'online',
		})
		shared.config.userID = readyClient.user.id
		shared.config.resourcePath = GetResourcePath(GetCurrentResourceName())
		shared.config.guild = GetConvar('ea_botGuild', '')
		shared.config.EasyAdmin = GetCurrentResourceName()

		const currentVersion = await shared.ea().GetVersion()[0]
		const latestVersionInfo = await shared.ea().getLatestVersion()

		await registerClientCommands(readyClient.user.id)

		let startupMessage = `**EasyAdmin ${currentVersion}** has started.`
		if (currentVersion !== latestVersionInfo[0]) {
			startupMessage += `\nVersion ${latestVersionInfo[0]} is Available!\n Download it from ${latestVersionInfo[1]}`
		}
		logDiscordMessage(startupMessage, 'startup')
	})

	client.on('debug', function (info: string) {
		if (GetConvarInt('ea_logLevel', 1) >= 4) {
			console.log(`${info}`)
		}
	})

	client.login(GetConvar('ea_botToken', ''))
}

// --- Error handling ---
process.on('uncaughtException', function (err: Error) {
	console.log('Caught exception: ', err.stack)
})
process.on('unhandledRejection', function (err: any) {
	if (err.message?.includes('this.rest.clearHashSweeper is not a function')) {
		setTimeout(() => {
			console.log('^1EasyAdmin ^3FATAL ERROR! ^7Your Discord Token is Invalid, EasyAdmin\'s Discord Bot ^1will not work ^7until this error has been resolved! Please check your Discord Token and try again.')
		}, 1000)
		return
	} else if (err.message?.includes('disallowed intents')) {
		setTimeout(() => {
			console.log('^1EasyAdmin ^3FATAL ERROR! ^7Your Discord Bot does not have the correct intents enabled, EasyAdmin\'s Discord Bot ^1will not work ^7until this error has been resolved! Please refer to the documentation: https://easyadmin.readthedocs.io/en/latest/discordbot/#creating-the-bot-user')
		}, 1000)
		return
	}
	console.log('Caught rejection: ', err.stack)
})
