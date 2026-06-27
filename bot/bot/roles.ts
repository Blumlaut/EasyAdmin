import * as shared from './shared'

async function syncDiscordRoles(player: number): Promise<void> {
	if (!shared.config.EasyAdmin) { return } // bot is down

	let user: any = null

	try {
		const identifiers = await shared.ea().getAllPlayerIdentifiers(player)
		for (const identifier of identifiers) {
			if (identifier.search('discord:') !== -1) {
				const discordId = identifier.substring(identifier.indexOf(':') + 1)
				user = await shared.client.users.fetch(discordId)
			}
		}
		if (!user) {
			return
		}
	} catch {
		return
	}

	const roles: string[] = []
	for (const id of shared.client.guilds.cache.keys()) {
		const guild = shared.client.guilds.cache.get(id)
		if (guild && guild.members.cache.has(user.id)) {
			const guildMember = await guild.members.fetch(user.id)
			if (guildMember) {
				roles.push(...guildMember.roles.cache.keys())
			}
		}
	}
	shared.refreshRolesForUser(user, roles)
}

globalThis.exports('syncDiscordRoles', syncDiscordRoles)

if (GetConvar('ea_botToken', '') !== '') {
	shared.client.on('guildMemberUpdate', async function (oldMember: any, newMember: any) {
		const oldRoles = await oldMember.roles.cache.keys()
		const newRoles = await newMember.roles.cache.keys()

		for (const role of oldRoles) {
			ExecuteCommand(`remove_principal identifier.discord:${oldMember.id} role:${role}`)
		}

		for (const role of newRoles) {
			ExecuteCommand(`add_principal identifier.discord:${newMember.id} role:${role}`)
		}
	})
}
