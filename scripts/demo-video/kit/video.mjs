/**
 * Video definitions: the shape a video script exports.
 *
 *   export default defineVideo({
 *     name: 'easyadmin-8.0',
 *     viewport: { width: 1920, height: 1080 },
 *     opening: { logo: 'logo.png', title: 'EasyAdmin', version: '8.0' },
 *     async run(v) { ... },
 *   })
 *
 * Only `name` and `run(v)` are required. Everything else has a default; see
 * DEFAULTS below and the README for the full reference. `run` is the script:
 * it receives a Director (kit/director.mjs) and awaits actions in real time.
 */

import path from 'node:path'

export function defineVideo(video) {
	if (!video || typeof video !== 'object') throw new Error('defineVideo() expects an object')
	if (!video.name) throw new Error('video.name is required (used for output and markers)')
	if (typeof video.run !== 'function') throw new Error(`video "${video.name}" needs a run(director) function`)
	return video
}

/**
 * Defaults applied to every video. Anything here can be overridden per video.
 */
export const DEFAULTS = {
	/** Output file name, relative to `--out`. */
	output: (name) => `${name}.mp4`,
	/** Page to open, relative to the dev server root. `?dev` boots the mock FiveM env. */
	url: '?dev',
	/** Browser viewport, in other words the recording resolution. */
	viewport: { width: 1920, height: 1080 },
	deviceScaleFactor: 1,
	/** Playback frame rate of the encoded video. */
	fps: 60,
	/** Backdrop behind the NUI window, and the default colour for transitions. */
	background: '#0f172a',
	/** Delivery frame mask, e.g. { width: 1080, height: 1080, radius: 32 }. */
	frame: null,
	/** Slide rendered in the very first captured frame (see stage slide options). */
	opening: null,
	/**
	 * Synthetic cursor behaviour. `duration` is how long the drawn cursor takes
	 * to reach a target, and clicks wait for it, so this sets the pace of every
	 * interaction in the video.
	 */
	cursor: { duration: 550 },
	/** Nav ids to visit on the throwaway warm-up page (see play.mjs). */
	warmPages: [],
	/** Selector that must be visible before the walkthrough starts. */
	ready: '.ea-window',
	/** How long to wait for `ready`: a cold dev server pre-bundles dependencies. */
	readyTimeout: 120000,
	/** Extra time after `ready` before `run` starts, so late data settles. */
	settle: 1200,
	/** ffmpeg settings, passed to encode.mjs (see kit/encode). */
	encode: {
		crf: 18,
		preset: 'slow',
		fadeIn: 0.5,
		fadeOut: 0,
		scale: null,
		audio: null,
	},
}

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v)

function merge(base, override) {
	if (override === undefined) return base
	// Objects merge key by key; anything else (including arrays and null) replaces.
	if (!isPlainObject(base) || !isPlainObject(override)) return override
	const out = { ...base }
	for (const [key, value] of Object.entries(override)) out[key] = merge(base[key], value)
	return out
}

/**
 * Merge a video definition with defaults and the CLI options, and derive every
 * path the pipeline needs. `out` and `url` are expected to be resolved already.
 */
export function resolveVideo(video, cli = {}) {
	const out = path.resolve(cli.out)
	const merged = merge(DEFAULTS, video)
	const output = typeof merged.output === 'function' ? merged.output(video.name) : merged.output
	return {
		...merged,
		...video, // the video's own functions (run/onError/finish) and raw settings win
		name: video.name,
		out,
		base: cli.url ? cli.url.replace(/\/$/, '') : `http://127.0.0.1:${cli.port}`,
		port: cli.port,
		ownsServer: !cli.url,
		// one directory per video: a second build must never mix into these frames
		framesDir: path.join(out, 'frames', video.name),
		outputPath: path.join(out, output),
		output,
		stageInit: {
			background: merged.background,
			frame: merged.frame,
			opening: merged.opening,
			cursor: merged.cursor,
		},
	}
}
