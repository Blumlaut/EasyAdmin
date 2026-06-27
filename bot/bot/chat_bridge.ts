import * as shared from './shared'
import { fivemExports } from './fivem'

try {
	const knownAvatarsLocal: Record<number, string | false> = {}

	fivemExports.chat.registerMessageHook(async function (source: number, outMessage: any) {
		if (GetConvar('ea_botChatBridge', '') === '') { return }

		const user = await shared.ea().getCachedPlayer(source)
		if (!user) { return }

		const userInfo: { name: string; iconURL?: string } = { name: outMessage.args[0] }

		if (knownAvatarsLocal[source] === undefined) {
			let fivemAccount: string | false = false
			for (const identifier of user.identifiers) {
				if (identifier.search('fivem:') !== -1) {
					fivemAccount = identifier.substring(identifier.indexOf(':') + 1)
				}
			}

			if (fivemAccount) {
				const response = await shared.ea().HTTPRequest(`https://policy-live.fivem.net/api/getUserInfo/${fivemAccount}`)
				try {
					const data = JSON.parse(response)
					if (data.avatar_template) {
						let avatarURL = data.avatar_template.replace('{size}', '96')
						if (avatarURL.indexOf('http') === -1) {
							avatarURL = `https://forum.cfx.re${avatarURL}`
						}
						userInfo.iconURL = avatarURL
						knownAvatarsLocal[source] = avatarURL
					} else {
						knownAvatarsLocal[source] = false
					}
				} catch {
					knownAvatarsLocal[source] = false
				}
			} else {
				knownAvatarsLocal[source] = false
			}
		} else {
			if (knownAvatarsLocal[source]) {
				userInfo.iconURL = knownAvatarsLocal[source] as string
			}
		}

		if (knownAvatarsLocal[source] === false) {
			userInfo.iconURL = undefined
		}

		const embed = await shared.prepareGenericEmbed(undefined, undefined, 55555, undefined, undefined, userInfo, outMessage.args[1], false)
		if (embed) {
			const channel = shared.client.channels.cache.get(GetConvar('ea_botChatBridge', ''))
			if (channel && 'send' in channel) {
				await (channel as { send: (data: any) => void }).send({ embeds: [embed] })
			}
		}
	})
} catch {
	if (GetConvar('ea_botChatBridge', '') !== '') {
		console.error('Registering Chat Bridge failed, you will need to update your chat resource from https://github.com/citizenfx/cfx-server-data to use it.')
	}
}

shared.client.on('messageCreate', async (msg: any) => {
	if (GetConvar('ea_botChatBridge', '') === '') { return }
	if (!msg.member || msg.author.bot) { return }
	if (msg.author.id === shared.config.userID) { return }
	if (!msg.channel) { return }
	if (msg.channel.id === GetConvar('ea_botChatBridge', '')) {
		fivemExports.chat.addMessage(-1, { args: [msg.member.user.username, msg.cleanContent] })
	}
})

on('playerDropped', () => {
	if (GetConvar('ea_botChatBridge', '') === '') { return }
	const player = source as number
	delete shared.knownAvatars[player]
})
