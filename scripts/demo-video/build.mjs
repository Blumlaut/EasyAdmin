/**
 * Build a demo video end to end: record the walkthrough, then encode it.
 *
 *   npm run demo:video                       # default video
 *   npm run demo:video -- social-teaser      # another video by name
 *   npm run demo:video -- --list
 *   npm run demo:video -- --out /tmp/videos
 *
 * `--keep-frames` leaves out/frames/<video>/ on disk for inspection or
 * re-encoding. Each video has its own frames directory and takes a lock while
 * it runs, so two videos can build concurrently but one video cannot be built
 * twice at once.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { loadVideo, lockVideo, parseArgs, printVideos, usage } from './kit/cli.mjs'
import { resolveVideo } from './kit/video.mjs'
import { play } from './kit/play.mjs'
import { encodeFrames } from './encode.mjs'

async function main() {
	const args = parseArgs(process.argv.slice(2))
	if (args.help) {
		console.log(usage('build.mjs'))
		return
	}
	if (args.list) {
		printVideos()
		return
	}

	const started = Date.now()
	const video = await loadVideo(args.video)
	const resolved = resolveVideo(video, args)
	console.log(`Video "${resolved.name}": ${resolved.viewport.width}x${resolved.viewport.height} @ ${resolved.fps} fps`)
	console.log(`Output: ${resolved.outputPath}\n`)

	const release = lockVideo(resolved)
	let framesDir
	try {
		;({ framesDir } = await play(resolved))
		await encodeFrames(framesDir, resolved.outputPath, { fps: resolved.fps })
	} finally {
		release()
	}

	if (args.keepFrames) console.log(`\nFrames kept in ${framesDir}`)
	else {
		fs.rmSync(framesDir, { recursive: true, force: true })
		try {
			fs.rmdirSync(path.join(resolved.out, 'frames')) // only if now empty
		} catch {}
	}

	console.log(`\nDone in ${((Date.now() - started) / 60000).toFixed(1)} min: ${resolved.outputPath}`)
}

main().catch((err) => {
	console.error(err.message)
	process.exit(1)
})
