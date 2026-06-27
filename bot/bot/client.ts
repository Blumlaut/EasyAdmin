import {
	Client,
	GatewayIntentBits,
	Partials,
} from 'discord.js'

// --- Discord client ---
export const client = new Client({
	partials: [Partials.GuildMember, Partials.User, Partials.Message, Partials.Channel, Partials.Reaction],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
})
