/**
 * CLI helpers shared by record.mjs and build.mjs: argument parsing, video
 * discovery and loading.
 */

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DEFAULT_OUT, HERE } from './browser.mjs'
import { acquireLock } from './lock.mjs'

export const VIDEOS_DIR = path.join(HERE, 'videos')
export const DEFAULT_VIDEO = 'easyadmin-8.0'

export function parseArgs(argv, { defaultVideo = DEFAULT_VIDEO } = {}) {
	const args = {
		video: defaultVideo,
		port: 5199,
		out: DEFAULT_OUT,
		url: null,
		list: false,
		keepFrames: false,
		help: false,
	}
	const positional = []
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		switch (arg) {
			case '--video': case '-v': args.video = argv[++i]; break
			case '--port': args.port = Number(argv[++i]); break
			case '--out': args.out = path.resolve(argv[++i]); break
			case '--url': args.url = argv[++i].replace(/\/$/, ''); break
			case '--list': args.list = true; break
			case '--keep-frames': args.keepFrames = true; break
			case '--help': case '-h': args.help = true; break
			default:
				if (arg.startsWith('-')) throw new Error(`unknown argument: ${arg}`)
				positional.push(arg)
		}
	}
	if (positional.length) args.video = positional[0]
	return args
}

export function usage(command = 'build.mjs') {
	return `usage: node scripts/demo-video/${command} [video] [options]

  video                  video name from videos/ (default: ${DEFAULT_VIDEO})
                         or a path to any .mjs video script
  --port <n>             dev server port (default: 5199)
  --out <dir>            output directory (default: scripts/demo-video/out)
  --url <url>            use an already-running dev server instead of booting one
  --list                 list available videos
  --keep-frames          keep the captured frames next to the mp4
  --help                 show this message`
}

/** Names of every video script in videos/. */
export function listVideos() {
	if (!fs.existsSync(VIDEOS_DIR)) return []
	return fs.readdirSync(VIDEOS_DIR)
		.filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
		.map((f) => f.replace(/\.mjs$/, ''))
		.sort()
}

export function printVideos() {
	const names = listVideos()
	if (!names.length) return console.log(`no videos found in ${VIDEOS_DIR}`)
	console.log('available videos:')
	for (const name of names) console.log(`  ${name}`)
}

/** Load a video script by name (videos/<name>.mjs) or by path. */
export async function loadVideo(ref) {
	const byPath = ref.includes('/') || ref.endsWith('.mjs')
	const file = byPath ? path.resolve(ref) : path.join(VIDEOS_DIR, `${ref}.mjs`)
	if (!fs.existsSync(file)) {
		const names = listVideos()
		throw new Error(`no video script at ${file}${names.length ? `\n\navailable videos:\n${names.map((n) => `  ${n}`).join('\n')}` : ''}`)
	}
	const mod = await import(pathToFileURL(file).href)
	const video = mod.default ?? mod.video
	if (!video) throw new Error(`${file} has no default export`)
	return video
}

/**
 * Lock a video's output so two builds of the same name cannot interleave frames.
 * Returns a release function.
 */
export function lockVideo(video) {
	fs.mkdirSync(video.out, { recursive: true })
	return acquireLock(path.join(video.out, `.${video.name}.lock`), `video "${video.name}"`)
}
