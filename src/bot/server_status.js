
var statusMessage
var startTimestamp = new Date()


global.getServerStatus = async function (why) {
	var embed = new EmbedBuilder()
		.setColor(65280)
		.setTimestamp()

	var joinURL = GetConvar('web_baseUrl', '')
	var buttonRow = await createJoinButtonRow(joinURL)

	embed.addFields([{name: 'Server Name', value: `\`\`\`${getFormattedServerName()}\`\`\``}])

	var stats = await getServerStats()
	embed.addFields(stats)

	if (joinURL != '') {
		await addUpvoteInfo(embed, joinURL)
	}

	embed.addFields([{ name: 'Uptime', value: `\`\`\`${prettyMilliseconds(new Date()-startTimestamp, {verbose: true, secondsDecimalDigits: 0})}\`\`\``, inline: false}])

	if (why) {
		embed.addFields([{name: 'Last Update', value: why}])
	}

	if (buttonRow) {
		return {embeds: [embed], components: [buttonRow] }
	}
	return {embeds: [embed] }
}

async function createJoinButtonRow(joinURL) {
	if (joinURL != '' && isValidJoinURL(joinURL)) {
		var buttonRow = new ActionRowBuilder()
		var button = new ButtonBuilder()
			.setURL(`https://${joinURL}`)
			.setLabel('Join Server')
			.setStyle(ButtonStyle.Link)
		buttonRow.addComponents([button])
		return buttonRow
	}

	return false
}

function isValidJoinURL(joinURL) {
	return joinURL.indexOf('cfx.re') != -1 && joinURL.match(/^[^A-z0-9]/)==null
}

function getFormattedServerName() {
	var serverName = GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))

	if (serverName.length > 255) {
		serverName = serverName.substring(0,255)
	}

	return serverName.replace(/\^[0-9]/g, '')
}

async function getServerStats() {
	var reports = await exports[EasyAdmin].getAllReports()
	var stats = getReportStats(reports)

	return [
		{ name: 'Players Online', value: `\`\`\`${getPlayers().length}/${GetConvar('sv_maxClients', '')}\`\`\``, inline: true},
		{ name: 'Admins Online', value: `\`\`\`${Object.values(exports[EasyAdmin].GetOnlineAdmins()).length}\`\`\``, inline: true},
		{ name: 'Reports', value: `\`\`\`${stats.active} (${stats.claimed} claimed)\`\`\``, inline: true},
		{ name: 'Active Vehicles', value: `\`\`\`${GetAllVehicles().length}\`\`\``, inline: true},
		{ name: 'Active Peds', value: `\`\`\`${GetAllPeds().length}\`\`\``, inline: true},
		{ name: 'Active Objects', value: `\`\`\`${GetAllObjects().length}\`\`\``, inline: true}
	]
}

function getReportStats(reports) {
	var activeReports = 0
	var claimedReports = 0

	for (let report of Object.values(reports).entries()) {
		activeReports+=1
		if (report.claimed) {
			claimedReports+=1
		}
	}

	return {active: activeReports, claimed: claimedReports}
}

async function addUpvoteInfo(embed, joinURL) {
	try {
		let serverId = extractServerId(joinURL)
		let response = await exports[EasyAdmin].HTTPRequest(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`)
		response = JSON.parse(response).Data

		embed.addFields([{ name: 'Upvotes', value: `\`\`\`${response.upvotePower} Upvotes, ${response.burstPower} Bursts\`\`\``, inline: false}])
		embed.setAuthor({ name: `${getFormattedServerName()}`, iconURL: response.ownerAvatar, url: `https://${joinURL}`})
	} catch (error) {
		console.error(error)
	}
}

function extractServerId(joinURL) {
	return joinURL.substring(joinURL.lastIndexOf('-')+1,joinURL.indexOf('.users.cfx.re'))
}

global.updateServerStatus = async function (why) {
	if (GetConvar('ea_botStatusChannel', '') == '') { return }
	var channel = await client.channels.fetch(GetConvar('ea_botStatusChannel', ''))

	if (channel == undefined) {
		console.error('Failed to configure bot status channel, please make sure the channel id is correct and the bot has read and write access.')
		return
	}
    
	if (!statusMessage) {
		var messagesToDelete = []
		var messages = await channel.messages.fetch({ limit: 10 }).catch((error) => {
			console.error('^7Failed to configure server status channel, please make sure you gave the bot permission to write in the channel!\n\n')
			console.error(error)
            
		})
		for (var message of messages.values()) {
			if (messages.size == 1 && message.author.id == client.user.id) {
				statusMessage = message
				break
			} else {
				messagesToDelete.push(message.id)
			}
		}   
		try {
			if (statusMessage) {
				updateServerStatus()
				return
			}
			await channel.bulkDelete(messagesToDelete)
		} catch (error) {
			console.log('Could not bulk-delete messages in botStatusChannel.')
			console.error(error)
		}
		let embed = await prepareGenericEmbed('Fetching Server Infos..')
		statusMessage = await channel.send({ embeds: [embed] })
	}
	const embed = await getServerStatus(why)
	statusMessage.edit(embed)
    
}

client.on('messageCreate', async msg => {
	if (!msg.member || msg.author.bot) { return } // message-sender is a webhook
	if(msg.author.id == userID) {
		return
	}
	if(!msg.channel) { return }
	if (msg.channel.id == GetConvar('ea_botStatusChannel', '')) {
		msg.delete()
		updateServerStatus('manual')
	}
    
})
setTimeout(updateServerStatus, 10000)
setInterval(updateServerStatus, 180000)
