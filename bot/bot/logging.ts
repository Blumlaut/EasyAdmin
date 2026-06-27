import * as shared from './shared'

const addBotLogForwarding = async function (source: number, args: string[]): Promise<boolean> {
	const player = source

	if (await (shared.ea() as any).DoesPlayerHavePermission(player, 'server')) {
		const feature = args[0]
		const channel = args[1]

		if (!feature || !parseInt(channel)) {
			console.error('Invalid Usage! ea_addBotLogForwarding feature channelId')
			return false
		}

		console.log(`Added log fwd ${feature} => ${channel}`)
		shared.botLogForwards[feature] = channel
		return true
	}
	return false
}

RegisterCommand('ea_addBotLogForwarding', addBotLogForwarding)

export const logDiscordMessage = async function (text: string, feature?: string, colour?: number): Promise<void> {
	if (!shared.config.EasyAdmin) { return } // bot isn't running
	if (GetConvar('ea_botLogChannel', '') === '') { return }
	if (feature === 'report' || feature === 'calladmin') { return } // handled in reports.ts

	const embed = await shared.prepareGenericEmbed(text, undefined, colour)

	const channelId = shared.botLogForwards[feature ?? ''] || GetConvar('ea_botLogChannel', '')
	const channel = await shared.client.channels.cache.get(channelId)

	if (channel && 'send' in channel) {
		(channel as { send: (data: any) => Promise<any> }).send({ embeds: [embed] }).catch((error: Error) => {
			console.error('^7Failed to log message, please make sure you gave the bot permission to write in the log channel!\n\n')
			console.error(error)
		})
	} else {
		console.error('^7Failed to log message, please make sure you gave the bot permission to write in the log channel!\n\n')
	}
}

globalThis.exports('addBotLogForwarding', addBotLogForwarding)
globalThis.exports('LogDiscordMessage', logDiscordMessage)
