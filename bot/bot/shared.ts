// Shared state and functions for all bot modules.
// Import from this file instead of relying on global.* pollution.

import {
	EmbedBuilder,
	GuildMember,
	User,
} from 'discord.js'

import { client as discordClient } from './bot'
export { discordClient as client }

// --- Mutable config object (imports are immutable bindings, so we use a single object) ---

export const config = {
	EasyAdmin: '',
	resourcePath: '',
	guild: '',
	userID: '',
	i18nStrings: {} as Record<string, string>,
}

// --- Typed EasyAdmin exports accessor ---
export function ea(): CitizenExports['EasyAdmin'] {
	return exports.EasyAdmin
}

// --- Persistent state ---

export const botLogForwards: Record<string, string> = {}
export const knownAvatars: Record<number, string | false | undefined> = {}

// --- i18n ---

/**
 * Resolve a translation key and replace named placeholders.
 */
export function t(key: string, params?: Record<string, string | number>): string {
	const template = config.i18nStrings[key] ?? key
	if (!params || Object.keys(params).length === 0) return template
	return template.replace(/\{(\w+)\}/g, (_, param) => String(params[param] ?? `{${param}}`))
}

// --- Shared functions ---

export async function prepareGenericEmbed(
	message: string | undefined,
	feature?: string,
	colour?: number,
	_title?: string,
	image?: string,
	customAuthor?: { name: string; iconURL?: string },
	description?: string,
	timestamp: boolean | undefined = undefined,
): Promise<EmbedBuilder | undefined> {
	if (feature && await ea().isWebhookFeatureExcluded(feature)) {
		return undefined
	}

	const embed = new EmbedBuilder().setColor(colour ?? 16777214)

	if (timestamp !== false) {
		embed.setTimestamp()
	}
	if (message) {
		embed.addFields([{ name: '**EasyAdmin**', value: message }])
	}
	if (description) {
		embed.setDescription(description)
	}
	if (customAuthor) {
		embed.setAuthor(customAuthor)
	}
	if (image) {
		embed.setImage(image)
	}

	return embed
}

export async function findPlayerFromUserInput(input: string): Promise<CachedPlayer | undefined> {
	let user: CachedPlayer | undefined
	const players = await ea().getCachedPlayers()

	for (const player of Object.values(players) as CachedPlayer[]) {
		if (!isNaN(Number(input))) {
			if (player.id === Number(input)) {
				user = player
			}
		} else {
			if (player.name.search(input) !== -1) {
				user = player
			}
		}
	}

	return user
}

export async function DoesGuildMemberHavePermission(member: GuildMember, object: string): Promise<boolean> {
	if (!member || !object) { return false }
	const memberId = member.id
	if (!memberId) { return false }

	let checkObject = object
	if (checkObject.search('easyadmin.') === -1) {
		checkObject = `easyadmin.${object}`
	}

	// guild owner always has permissions
	if (member.guild.ownerId === memberId) {
		return true
	}

	return IsPrincipalAceAllowed(`identifier.discord:${memberId}`, checkObject)
}

export async function getDiscordAccountFromPlayer(user: number | CachedPlayer): Promise<User | false> {
	let discordAccount: User | false = false

	let player: CachedPlayer | undefined
	if (!isNaN(Number(user))) {
		player = await ea().getCachedPlayer(Number(user))
	} else {
		player = user as CachedPlayer
	}

	if (!player) {
		return false
	}

	for (const identifier of player.identifiers) {
		if (identifier.search('discord:') !== -1) {
			const discordId = identifier.substring(identifier.indexOf(':') + 1)
			try {
				discordAccount = await discordClient.users.fetch(discordId)
			} catch {
				discordAccount = false
			}
		}
	}

	return discordAccount
}

export async function getPlayerFromDiscordAccount(user: User): Promise<CachedPlayer | false> {
	const players = await ea().getCachedPlayers()

	for (const player of Object.values(players) as CachedPlayer[]) {
		for (const identifier of player.identifiers) {
			if (identifier === `discord:${user.id}`) {
				return player
			}
		}
	}

	return false
}

export async function refreshRolesForMember(member: GuildMember): Promise<void> {
	const roles = await member.roles.cache.keys()
	for (const role of roles) {
		emit('debug', `role sync for ${member.user.tag} add_principal identifier.discord:${member.id} role:${role}`)
		ExecuteCommand(`add_principal identifier.discord:${member.id} role:${role}`)
	}
	emit('debug', `roles synced for ${member.user.tag}`)
}

export function refreshRolesForUser(user: User, roles: string[]): void {
	for (const role of roles) {
		emit('debug', `role sync for ${user.tag} add_principal identifier.discord:${user.id} role:${role}`)
		ExecuteCommand(`add_principal identifier.discord:${user.id} role:${role}`)
	}
	emit('debug', `roles synced for ${user.tag}`)
}
