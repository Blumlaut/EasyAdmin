import type { ChatInputCommandInteraction } from 'discord.js'

export interface Command {
	data: { name: string; toJSON(): object }
	execute(interaction: ChatInputCommandInteraction, exports: unknown): Promise<void>
}

import announce from './announce'
import ban from './ban'
import baninfo from './baninfo'
import cleanup from './cleanup'
import freeze from './freeze'
import history from './history'
import kick from './kick'
import mute from './mute'
import notes from './notes'
import playerinfo from './playerinfo'
import playerlist from './playerlist'
import refreshperms from './refreshperms'
import screenshot from './screenshot'
import slap from './slap'
import unban from './unban'
import unfreeze from './unfreeze'
import unmute from './unmute'
import warn from './warn'

export const commands: Command[] = [
	announce,
	ban,
	baninfo,
	cleanup,
	freeze,
	history,
	kick,
	mute,
	notes,
	playerinfo,
	playerlist,
	refreshperms,
	screenshot,
	slap,
	unban,
	unfreeze,
	unmute,
	warn,
]
