/**
 * Record a demo video's frames: the capture half of the pipeline, without
 * encoding. Useful while iterating on a video script: look at the frames and
 * only pay for encoding once it looks right.
 *
 *   node scripts/demo-video/record.mjs                      # default video
 *   node scripts/demo-video/record.mjs social-teaser        # by name
 *   node scripts/demo-video/record.mjs videos/my-video.mjs  # by path
 *   node scripts/demo-video/record.mjs --list
 *   node scripts/demo-video/record.mjs --url http://127.0.0.1:5199
 *
 * Encode afterwards with:
 *   node scripts/demo-video/encode.mjs out/frames/<video> out/<name>.mp4
 *
 * Requirements:
 *   npm run install:all                    # once
 *   npm i -D playwright                    # once (not a repo dependency)
 *   npx playwright install chromium        # or set EA_CHROMIUM_PATH
 */

import process from 'node:process'
import { loadVideo, lockVideo, parseArgs, printVideos, usage } from './kit/cli.mjs'
import { resolveVideo } from './kit/video.mjs'
import { play } from './kit/play.mjs'

async function main() {
	const args = parseArgs(process.argv.slice(2))
	if (args.help) {
		console.log(usage('record.mjs'))
		return
	}
	if (args.list) {
		printVideos()
		return
	}

	const video = await loadVideo(args.video)
	const resolved = resolveVideo(video, args)
	console.log(`Video "${resolved.name}": ${resolved.viewport.width}x${resolved.viewport.height} @ ${resolved.fps} fps`)

	const release = lockVideo(resolved)
	let framesDir
	try {
		;({ framesDir } = await play(resolved))
	} finally {
		release()
	}

	console.log(`\nFrames:  ${framesDir}`)
	console.log(`Encode:  node scripts/demo-video/encode.mjs ${framesDir} ${resolved.outputPath}`)
}

main().catch((err) => {
	console.error(err.message)
	process.exit(1)
})
