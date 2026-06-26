import prettyMilliseconds from 'pretty-ms'
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from 'discord.js'
import * as shared from './shared'

let statusMessage: any = null
const startTimestamp = new Date()

async function getServerStatus(why?: string): Promise<{ embeds: EmbedBuilder[]; components?: any[] }> {
	const embed = new EmbedBuilder()
		.setColor(65280)
		.setTimestamp()

	let joinURL = GetConvar('web_baseUrl', '')
	let buttonRow: ActionRowBuilder | null = null

	if (joinURL !== '' && joinURL.indexOf('cfx.re') !== -1 && !joinURL.match(/^[^A-z0-9]/)) {
		embed.setURL(`https://${joinURL}`)
		buttonRow = new ActionRowBuilder()
		const button = new ButtonBuilder()
			.setURL(`https://${joinURL}`)
			.setLabel('Join Server')
			.setStyle(ButtonStyle.Link)
		buttonRow.addComponents([button])
	} else {
		joinURL = ''
	}

	let serverName = GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))
	if (serverName.length > 255) {
		serverName = serverName.substring(0, 255)
	}
	serverName = serverName.replace(/\^[0-9]/g, '')

	embed.addFields([{ name: 'Server Name', value: `\`\`\`${serverName}\`\`\`` }])

	const reports = await shared.ea().getAllReports()
	let activeReports = 0
	let claimedReports = 0
	for (const report of Object.values(reports)) {
		activeReports += 1
		if ((report as any).claimed) {
			claimedReports += 1
		}
	}

	embed.addFields([
		{ name: 'Players Online', value: `\`\`\`${getPlayers().length}/${GetConvar('sv_maxClients', '')}\`\`\``, inline: true },
		{ name: 'Admins Online', value: `\`\`\`${Object.values(shared.ea().GetOnlineAdmins()).length}\`\`\``, inline: true },
		{ name: 'Reports', value: `\`\`\`${activeReports} (${claimedReports} claimed)\`\`\``, inline: true },
		{ name: 'Active Vehicles', value: `\`\`\`${GetAllVehicles().length}\`\`\``, inline: true },
		{ name: 'Active Peds', value: `\`\`\`${GetAllPeds().length}\`\`\``, inline: true },
		{ name: 'Active Objects', value: `\`\`\`${GetAllObjects().length}\`\`\``, inline: true },
	])

	if (joinURL !== '') {
		try {
			const serverId = joinURL.substring(joinURL.lastIndexOf('-') + 1, joinURL.indexOf('.users.cfx.re'))
			const response = await shared.ea().HTTPRequest(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`)
			const data = JSON.parse(response).Data
			embed.addFields([{ name: 'Upvotes', value: `\`\`\`${data.upvotePower} Upvotes, ${data.burstPower} Bursts\`\`\``, inline: false }])
			embed.setAuthor({ name: serverName, iconURL: data.ownerAvatar, url: `https://${joinURL}` })
		} catch (error) {
			console.error(error)
		}
	}

	embed.addFields([{ name: 'Uptime', value: `\`\`\`${prettyMilliseconds(new Date().getTime() - startTimestamp.getTime(), { verbose: true, secondsDecimalDigits: 0 })}\`\`\``, inline: false }])

	if (why) {
		embed.addFields([{ name: 'Last Update', value: why }])
	}

	if (buttonRow) {
		return { embeds: [embed], components: [buttonRow.toJSON()] }
	}
	return { embeds: [embed] }
}

async function updateServerStatus(why?: string): Promise<void> {
	if (GetConvar('ea_botStatusChannel', '') === '') { return }

	const channel = await shared.client.channels.fetch(GetConvar('ea_botStatusChannel', '')).catch(() => null)

	if (!channel) {
		console.error('Failed to configure bot status channel, please make sure the channel id is correct and the bot has read and write access.')
		return
	}

	if (!statusMessage) {
		const messages = await (channel as any).messages.fetch({ limit: 10 }).catch((error: Error) => {
			console.error('^7Failed to configure server status channel, please make sure you gave the bot permission to write in the channel!\n\n')
			console.error(error)
			return null
		})

		if (messages) {
			const messagesToDelete: string[] = []
			for (const message of messages.values()) {
				if (messages.size === 1 && message.author.id === shared.config.userID) {
					statusMessage = message
					break
				} else {
					messagesToDelete.push(message.id)
				}
			}

			try {
				if (statusMessage) {
					await updateServerStatus()
					return
				}
				await (channel as any).bulkDelete(messagesToDelete)
			} catch (error) {
				console.log('Could not bulk-delete messages in botStatusChannel.')
				console.error(error)
			}
		}

		const loadingEmbed = new EmbedBuilder().setDescription('Fetching Server Infos..').setTimestamp()
		statusMessage = await (channel as any).send({ embeds: [loadingEmbed] })
	}

	const embedData = await getServerStatus(why)
	await statusMessage.edit(embedData)
}

shared.client.on('messageCreate', async (msg: any) => {
	if (!msg.member || msg.author.bot) { return } // message-sender is a webhook
	if (msg.author.id === shared.config.userID) { return }
	if (!msg.channel) { return }
	if (msg.channel.id === GetConvar('ea_botStatusChannel', '')) {
		await msg.delete()
		await updateServerStatus('manual')
	}
})

setTimeout(updateServerStatus, 10000)
setInterval(updateServerStatus, 180000)
