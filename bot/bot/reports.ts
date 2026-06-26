import { EmbedBuilder } from 'discord.js'
import * as shared from './shared'

const reports: Record<number, any> = {}

function generateReportEmbed(report: any, _disabled: boolean, closed: boolean): { embeds: EmbedBuilder[] } {
	const embed = new EmbedBuilder().setTimestamp()

	if (closed) {
		embed.setColor(808080)
	} else {
		embed.setColor(65280)
	}

	if (report.type === 1) {
		embed.addFields([{ name: 'Player Report', value: `**${report.reporterName}** reported **${report.reportedName}**!` }])
	} else {
		embed.addFields([{ name: 'Admin Call', value: `**${report.reporterName}** called for an Admin!` }])
	}

	embed.addFields([
		{ name: 'Reason', value: `\`\`\`\n${report.reason}\`\`\`` },
		{ name: 'Report ID', value: `#${report.id}`, inline: true },
		{ name: 'Claimed by', value: `${report.claimedName ?? 'Noone'}`, inline: true },
	])

	return { embeds: [embed] }
}

async function logNewReport(report: any): Promise<void> {
	if (GetConvar('ea_botToken', '') !== '') {
		const reportId = report.id
		reports[reportId] = report
		const reportMessage = generateReportEmbed(report, false, false)

		let channelId = GetConvar('ea_botLogChannel', '')
		if (report.type === 1 && shared.botLogForwards['report']) {
			channelId = shared.botLogForwards['report']
		} else if (report.type === 0 && shared.botLogForwards['calladmin']) {
			channelId = shared.botLogForwards['calladmin']
		}

		const channel = await shared.client.channels.cache.get(channelId)
		if (channel && 'send' in channel) {
			const msg = await (channel as { send: (data: any) => Promise<any> }).send(reportMessage)
			reports[reportId].msg = msg
		}
	}
}

on('EasyAdmin:reportAdded', async function (reportData: any) {
	await logNewReport(reportData)
})

on('EasyAdmin:reportClaimed', async function (reportData: any) {
	const reportId = reportData.id
	if (reports[reportId]) {
		reports[reportId].claimed = reportData.claimed
		reports[reportId].claimedName = reportData.claimedName
		const reportMessage = generateReportEmbed(reports[reportId], true, false)
		if (reports[reportId].msg) {
			await reports[reportId].msg.edit(reportMessage)
		}
	}
})

on('EasyAdmin:reportRemoved', async function (reportData: any) {
	const reportId = reportData.id
	if (reports[reportId]) {
		const reportMessage = generateReportEmbed(reports[reportId], true, true)
		if (reports[reportId].msg) {
			await reports[reportId].msg.edit(reportMessage)
		}
		reports[reportId] = undefined
	}
})
