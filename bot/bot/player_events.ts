import * as shared from './shared'

if (GetConvar('ea_botToken', '') !== '') {
	on('playerJoining', function () {
		const player = source as number

		if (GetConvar('ea_botToken', '') !== '' && GetConvar('ea_botLogChannel', '') !== '') {
			const msg = `Player **${shared.ea().getName(player, true, true)}** with id **${player}** joined the Server!`
			const logDiscordMessage = exports.LogDiscordMessage
			logDiscordMessage(msg, 'joinleave')
		}
	})

	on('playerConnecting', function () {
		if (GetConvar('ea_botToken', '') === '') return
		const player = source as number
		shared.ea().syncDiscordRoles(player)
	})

	on('playerDropped', () => {
		if (GetConvar('ea_botToken', '') === '') return
		const player = source as number

		if (GetConvar('ea_botChatBridge', '') !== '') {
			delete shared.knownAvatars[player]
		}

		if (GetConvar('ea_botLogChannel', '') !== '') {
			const msg = `Player **${shared.ea().getName(player, true, true)}** left the server!`
			const logDiscordMessage = exports.LogDiscordMessage
			logDiscordMessage(msg, 'joinleave')
		}
	})
}
