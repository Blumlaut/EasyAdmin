// FiveM Node.js runtime globals (injected by FXServer at runtime)
// Covers the JS API used by the bot. Natives are available via the FiveM runtime.

// --- Convars ---
declare function GetConvar(name: string, defaultValue?: string): string
declare function GetConvarInt(name: string, defaultValue?: number): number
declare function GetConvarFloat(name: string, defaultValue?: number): number

// --- Resource ---
declare function GetCurrentResourceName(): string
declare function GetResourcePath(name: string): string

// --- Players ---
declare function getPlayers(): number[]
declare function DropPlayer(source: number, reason: string): void
declare function GetPlayerPed(source: number): number
declare function GetEntityHealth(entity: number): number
declare function GetPedArmour(ped: number): number
declare function GetPlayerInvincible(source: number): boolean

// --- World ---
declare function GetAllVehicles(): number[]
declare function GetAllPeds(): number[]
declare function GetAllObjects(): number[]

// --- ACL ---
declare function IsPrincipalAceAllowed(principal: string, ace: string): boolean
declare function ExecuteCommand(cmd: string): void

// --- Events ---
declare function on(eventName: string, callback: (...args: any[]) => void): void
declare function onNet(eventName: string, callback: (...args: any[]) => void): void
declare function emit(eventName: string, ...args: any[]): void
declare function RegisterCommand(name: string, callback: (...args: any[]) => void): void
declare function RemoveEventHandler(eventName: string, callback: (...args: any[]) => void): void

// --- Source (set by FiveM per-event context) ---
declare const source: number

// --- Exports (FiveM dynamic export system, pattern from @citizenfx/server CitizenExports) ---
interface CitizenExports {
	(exportKey: string | number, exportFunction: Function): void
	[resourceName: string]: {
		[exportKey: string | number]: Function
	}

	// Own-resource exports (registered via exports('name', fn))
	LogDiscordMessage(text: string, feature?: string, colour?: number): void
	syncDiscordRoles(player: number): void
	addBotLogForwarding(source: number, args: string[]): Promise<boolean>

	// --- EasyAdmin exports ---
	EasyAdmin: {
		GetVersion(): [string, string]
		getLatestVersion(): [string, string]
		DoesPlayerHavePermission(player: number, object: string): boolean
		isWebhookFeatureExcluded(feature: string): Promise<boolean>
		getCachedPlayers(): Promise<Record<string, CachedPlayer>>
		getCachedPlayer(id: number): Promise<CachedPlayer | undefined>
		getAllPlayerIdentifiers(player: number): Promise<string[]>
		getName(player: number, ...args: boolean[]): string
		formatShortcuts(text: string): string
		announce(reason: string): Promise<boolean>
		addBan(playerId: number, reason: string, banTime: number, banner: string): BanResult | false
		fetchBan(banId: number): Promise<BanInfo | undefined>
		unbanPlayer(banId: number): Promise<boolean>
		freezePlayer(playerId: number, freeze: boolean): Promise<boolean>
		mutePlayer(playerId: number, mute: boolean): Promise<boolean>
		warnPlayer(src: string, playerId: number, reason: string): Promise<boolean>
		slapPlayer(playerId: number, amount: number): Promise<boolean>
		cleanupArea(type: string): boolean
		getActionHistory(identifiers: string[]): Promise<ActionHistoryEntry[]>
		getAdminNotes(identifiers: string[]): Promise<AdminNoteEntry[]>
		IsPlayerAdmin(playerId: number): boolean
		getPlayerWarnings(playerId: number): number
		GetOnlineAdmins(): Record<number, any>
		getAllReports(): Promise<Record<number, Report>>
		syncDiscordRoles(player: number): void
		LogDiscordMessage(text: string, feature?: string, colour?: number): void
		HTTPRequest(url: string): Promise<string>
		matchURL(result: string): Promise<string>
		isScreenshotInProgress(): Promise<boolean>
	}

	// --- Chat exports ---
	chat: {
		registerMessageHook(callback: (source: number, message: any) => void): void
		addMessage(source: number, message: { args: string[] }): void
	}

	// --- Our own exports ---
	LogDiscordMessage(text: string, feature?: string, colour?: number): void
	syncDiscordRoles(player: number): void
	addBotLogForwarding(source: number, args: string[]): Promise<boolean>
}

declare const exports: CitizenExports

// --- Missing package types ---
declare module 'ascii-table' {
	function factory(options: { heading: string[]; rows: any[][] }): string
	export = factory
}

// --- Shared types ---
interface CachedPlayer {
	id: number
	name: string
	identifiers: string[]
	dropped: boolean
}

interface BanResult {
	banid: number
	expireString: string
}

interface BanInfo {
	id: number
	name: string
	identifiers: string[]
	banner: string
	reason: string
	expireString: string
}

interface ActionHistoryEntry {
	id: number
	action: string
	time: number
	reason: string
	moderator: string
}

interface AdminNoteEntry {
	id: number
	time: string
	content: string
	moderator: string
}

interface Report {
	id: number
	type: number
	reporterName: string
	reportedName: string
	reason: string
	claimed: boolean
	claimedName?: string
	msg?: any
}
