/*eslint no-global-assign: "off", no-unused-vars: "off"*/
process.on('uncaughtException', function(err) {
	console.log('Caught exception: ', err.stack)
})
process.on('unhandledRejection', function(err) {
	console.log('Caught exception: ', err.stack)
})

AsciiTable = require('ascii-table')
sprintf = require('sprintf-js').sprintf
juration = require('juration')
const prettyMilliseconds = require('pretty-ms')
const { Client, EmbedBuilder, Collection, Intents, Partials, ButtonStyle, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Guild, Util, ModalBuilder, TextInputBuilder, GatewayIntentBits, InteractionType, TextInputStyle } = require('discord.js')

const { SlashCommandBuilder } = require('@discordjs/builders')


client = new Client({
	partials: [Partials.GuildMember, Partials.User, Partials.Message, Partials.Channel, Partials.Reaction],
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
})
client.commands = new Collection()


async function RegisterClientCommands(clientId) {
	const { REST } = require('@discordjs/rest')
	const { Routes } = require('discord-api-types/v10')
	const fs = require('fs')
	
	const commands = []
	const commandFiles = fs.readdirSync(`${resourcePath}/server/bot/commands`).filter(file => file.endsWith('.js'))
	
	
	for (const file of commandFiles) {
		const command = require(`${resourcePath}/server/bot/commands/${file}`)
		commands.push(command.data.toJSON())
		client.commands.set(command.data.name, command)
	}
	
	const rest = new REST({ version: '10' }).setToken(GetConvar('ea_botToken', ''))

	// compat: remove existing commands for homeguild
	if (guild != '') {
		rest.put(Routes.applicationGuildCommands(clientId, guild), { body: {} })
	}
	await rest.put(
		Routes.applicationCommands(clientId),
		{ body: commands },
	)
	
	client.on('interactionCreate', async interaction => {
		if (interaction.type != InteractionType.ApplicationCommand) return
		
		const command = client.commands.get(interaction.commandName)
		
		if (!command) return
		
		if (!(await DoesGuildMemberHavePermission(interaction.member, `bot.${command.data.name}`) == true) && !(command.data.name == 'refreshperms')) {
			await refreshRolesForMember(interaction.member)
			if (!(await DoesGuildMemberHavePermission(interaction.member, `bot.${command.data.name}`) == true)) {
				await interaction.reply({ content: 'You don\'t have permission to run this command!', ephemeral: true })
				return false
			}
		}
		try {
			await command.execute(interaction, exports) // we need to pass exports here, otherwise we won't be able to access them inside the command
		} catch (error) {
			console.error(error)
			var errorContent = { content: `There was an error while executing this command, please report the following stack trace here: <https://github.com/Blumlaut/EasyAdmin/issues> \`\`\`js\n${error.stack}\`\`\``, ephemeral: true }
			if (interaction.replied) {
				interaction.followUp(errorContent)
				
			} else {
				interaction.reply(errorContent)
			}
		}
	})
}

if (GetConvar('ea_botToken', '') != '') {
    
	client.on('ready', async () => {
		console.log(`Logged in as ${client.user.tag}!`)
		client.user.setPresence({ activities: [{ name: `${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}`, type: 'WATCHING' }], status: 'online' })
		userID = client.user.id
		resourcePath = GetResourcePath(GetCurrentResourceName()) // absolute resource path, needed for FS
		guild = GetConvar('ea_botGuild', '')
        
		EasyAdmin = GetCurrentResourceName() // fetch our Resource name and claim we're called EasyAdmin, this just makes exports easier.
        
		currentVersion = await exports[EasyAdmin].GetVersion()[0]
		latestVersionInfo = await exports[EasyAdmin].getLatestVersion()
        
        
		RegisterClientCommands(client.user.id)
		var startupMessage = `**EasyAdmin ${currentVersion}** has started.`
		if (currentVersion != latestVersionInfo[0]) {
			startupMessage+=`\nVersion ${latestVersionInfo[0]} is Available!\n Download it from ${latestVersionInfo[1]}`
		}
		LogDiscordMessage(startupMessage, 'startup')
	})
    
	client.on('debug', function(info){
		if (GetConvarInt('ea_logLevel', 1) >= 4 ) {
			console.log(`${info}`)
		}
	})
	on('debug', function(info){
		if (GetConvarInt('ea_logLevel', 1) >= 4 ) {
			console.log(`${info}`)
		}
	})
    
	client.login(GetConvar('ea_botToken', ''))
}

