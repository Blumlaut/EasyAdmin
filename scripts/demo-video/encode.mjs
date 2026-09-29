/**
 * Encode a CDP screencast frame sequence into the final mp4.
 *
 * record/build capture every compositor frame the browser produces (up to
 * 60 fps) as a JPEG with a capture timestamp. Static stretches produce no
 * frames, so we rebuild the exact 60 fps timeline: each captured frame is
 * repeated for as long as the next one takes to arrive. No interpolation:
 * the video shows exactly the frames the page rendered.
 *
 * Settings come from <frames>/manifest.json (written while recording) and can
 * be overridden with flags. Usable as a module:
 *
 *   import { encodeFrames } from './encode.mjs'
 *   await encodeFrames(framesDir, outFile, { crf: 20 })
 *
 * or as a CLI:
 *   node encode.mjs <frames-dir> <out.mp4> [--fps 60] [--crf 18] [--preset slow]
 */

import { spawn } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const DEFAULT_FPS = 60

function readManifest(framesDir) {
	const file = path.join(framesDir, 'manifest.json')
	if (!fs.existsSync(file)) return {}
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch {
		return {}
	}
}

/**
 * JPEG dimensions from the SOF marker. Reads the header only, no decode.
 * Returns null when the marker is not within the first bytes.
 */
function jpegSize(file) {
	const fd = fs.openSync(file, 'r')
	try {
		const buf = Buffer.alloc(4096)
		const read = fs.readSync(fd, buf, 0, buf.length, 0)
		let i = 2
		while (i + 9 < read) {
			if (buf[i] !== 0xff) {
				i++
				continue
			}
			const marker = buf[i + 1]
			const length = buf.readUInt16BE(i + 2)
			if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
				return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) }
			}
			i += 2 + length
		}
		return null
	} finally {
		fs.closeSync(fd)
	}
}

/**
 * Rebuild the constant-fps slot timeline from per-frame capture timestamps.
 *
 * The browser's first compositor frame can predate the emulated viewport (it is
 * captured at the raw surface size), and the surface can change mid-recording.
 * Frames are aligned to the dominant size instead of failing the encode.
 */
export function buildTimeline(framesDir, fps, { viewport } = {}) {
	const files = fs.readdirSync(framesDir).filter((f) => f.endsWith('.jpg')).sort()
	if (!files.length) throw new Error(`no frames in ${framesDir}`)
	const timestamps = fs.readFileSync(path.join(framesDir, 'timestamps.jsonl'), 'utf8')
		.trim()
		.split('\n')
		.map((line) => Number(line.split('\t')[1]))
	if (!Number.isFinite(timestamps[0]) || timestamps.some((t) => !Number.isFinite(t))) {
		throw new Error('missing capture timestamps, re-record with a Chromium that reports them')
	}
	if (timestamps.length !== files.length) {
		throw new Error(`${files.length} frames but ${timestamps.length} capture timestamps in ${framesDir},`
			+ ' the directory holds frames from more than one run. Delete it and record again.')
	}

	let kept = files.map((file, i) => ({
		file,
		timestamp: timestamps[i],
		size: jpegSize(path.join(framesDir, file)),
	}))

	const tally = new Map()
	for (const frame of kept) {
		if (!frame.size) continue
		const key = `${frame.size.width}x${frame.size.height}`
		tally.set(key, (tally.get(key) || 0) + 1)
	}
	const dominant = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
	if (dominant) {
		const wrong = kept.filter((f) => f.size && `${f.size.width}x${f.size.height}` !== dominant)
		if (wrong.length) {
			console.warn(`warning: dropped ${wrong.length} frame(s) that are not ${dominant} (browser surface changed)`) 
			kept = kept.filter((f) => !f.size || `${f.size.width}x${f.size.height}` === dominant)
		}
		if (viewport && dominant !== `${viewport.width}x${viewport.height}`) {
			console.warn(`warning: frames are ${dominant} but the video viewport is ${viewport.width}x${viewport.height}`
				+ ': the recording may be cropped')
		}
	}

	const slots = new Array(kept.length)
	const t0 = kept[0].timestamp
	let slot = 0
	for (let i = 0; i < kept.length; i++) {
		const delta = i + 1 < kept.length ? (kept[i + 1].timestamp - t0) * fps : null
		const nextSlot = Number.isFinite(delta) ? Math.max(slot + 1, Math.round(delta)) : slot + 1
		slots[i] = nextSlot - slot
		slot = nextSlot
	}
	return { frames: kept, slots, totalSlots: slot, duration: slot / fps }
}

async function assertFfmpeg() {
	await new Promise((resolve, reject) => {
		const probe = spawn('ffmpeg', ['-version'], { stdio: 'ignore' })
		probe.on('error', () => reject(new Error('ffmpeg not found on PATH, install it to encode videos')))
		probe.on('close', (code) => (code === 0
			? resolve()
			: reject(new Error('ffmpeg is not working (non-zero exit on -version)'))))
	})
}

/**
 * Encode captured frames into an h264 mp4.
 *
 * @param {string} framesDir directory written by FrameCapture
 * @param {string} outFile   destination mp4
 * @param {object} [options] overrides: fps, crf, preset, fadeIn, fadeOut, scale, audio, audioFade
 */
export async function encodeFrames(framesDir, outFile, options = {}) {
	if (!fs.existsSync(framesDir)) throw new Error(`frames directory not found: ${framesDir}`)
	await assertFfmpeg()

	const manifest = readManifest(framesDir)
	const encode = { ...(manifest.encode || {}), ...clean(options) }
	const fps = options.fps ?? manifest.fps ?? DEFAULT_FPS
	const { frames, slots, duration } = buildTimeline(framesDir, fps, { viewport: manifest.viewport })
	// A trailing hold on a static frame produces no frames of its own, so extend
	// the last slot: the video should end when the recording ended.
	const tail = Math.min(Number(manifest.tail) || 0, 5)
	if (tail > 0.05 && frames.length) slots[frames.length - 1] += Math.round(tail * fps)

	if (frames.length < fps * 2) {
		throw new Error(`only ${frames.length} usable frames, so the page produced almost nothing`)
	}

	const filters = []
	if (encode.fadeIn) filters.push(`fade=t=in:st=0:d=${encode.fadeIn}`)
	if (encode.fadeOut) {
		filters.push(`fade=t=out:st=${Math.max(0, duration - encode.fadeOut).toFixed(3)}:d=${encode.fadeOut}`)
	}
	if (encode.scale) filters.push(`scale=${encode.scale}`)

	const args = [
		'-y', '-hide_banner', '-loglevel', 'error',
		'-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0',
	]
	if (encode.audio) args.push('-stream_loop', '-1', '-i', encode.audio)
	if (filters.length) args.push('-vf', filters.join(','))
	args.push(
		'-c:v', 'libx264', '-preset', encode.preset || 'slow', '-crf', String(encode.crf ?? 18),
		'-pix_fmt', 'yuv420p',
	)
	if (encode.audio) {
		const fade = { in: 1, out: 2, ...(encode.audioFade || {}) }
		const af = []
		if (fade.in) af.push(`afade=t=in:d=${fade.in}`)
		if (fade.out) af.push(`afade=t=out:st=${Math.max(0, duration - fade.out).toFixed(3)}:d=${fade.out}`)
		args.push('-c:a', 'aac', '-b:a', '192k', '-shortest')
		if (af.length) args.push('-af', af.join(','))
	}
	args.push('-movflags', '+faststart', outFile)

	console.log(`Encoding ${frames.length} captured frames → ${outFile} (${fps} fps, ${duration.toFixed(1)}s) ...`)
	const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] })
	// ffmpeg can bail out early (bad input, encoder error). Report that from the
	// close handler instead of crashing on an unhandled EPIPE.
	ff.stdin.on('error', () => {})
	const closed = new Promise((resolve) => ff.once('close', resolve))

	let slot = 0
	for (let i = 0; i < frames.length; i++) {
		if (ff.exitCode !== null) break
		const buf = fs.readFileSync(path.join(framesDir, frames[i].file))
		for (let repeat = 0; repeat < slots[i]; repeat++) {
			if (!ff.stdin.write(buf)) {
				await Promise.race([new Promise((res) => ff.stdin.once('drain', res)), closed])
			}
		}
		slot += slots[i]
		if (i % 500 === 0) console.log(`  ${i}/${frames.length} frames (${(slot / fps).toFixed(1)}s of video)`)
	}
	if (ff.exitCode === null) ff.stdin.end()
	const code = await closed
	if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`)

	if (tail > 0.05) console.log(`Extended the last frame by ${tail.toFixed(2)}s (trailing hold)`)
	printMarkers(framesDir, duration + tail)
	console.log(`Done: ${outFile} (${(duration + tail).toFixed(1)}s @ ${fps} fps)`)
	return { outFile, duration: duration + tail, capturedFrames: frames.length }
}

function printMarkers(framesDir, duration) {
	const file = path.join(framesDir, 'markers.jsonl')
	if (!fs.existsSync(file)) return
	const markers = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean)
		.map((line) => {
			const [time, label] = line.split('\t')
			return { time: Number(time), label }
		})
		.filter((m) => Number.isFinite(m.time) && m.time <= duration)
	if (!markers.length) return
	console.log('\nMarkers:')
	for (const m of markers) console.log(`  ${m.time.toFixed(1).padStart(7)}s  ${m.label}`)
}

function clean(obj) {
	const out = {}
	for (const [key, value] of Object.entries(obj)) if (value !== undefined) out[key] = value
	return out
}

// ------------------------------------------------------------------ CLI

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
	const positional = []
	const options = {}
	for (let i = 2; i < process.argv.length; i++) {
		const arg = process.argv[i]
		switch (arg) {
			case '--fps': options.fps = Number(process.argv[++i]); break
			case '--crf': options.crf = Number(process.argv[++i]); break
			case '--preset': options.preset = process.argv[++i]; break
			case '--fade-in': options.fadeIn = Number(process.argv[++i]); break
			case '--fade-out': options.fadeOut = Number(process.argv[++i]); break
			case '--scale': options.scale = process.argv[++i]; break
			case '--audio': options.audio = process.argv[++i]; break
			default: positional.push(arg)
		}
	}
	const [framesDir, outFile] = positional
	if (!framesDir || !outFile) {
		console.error('usage: node encode.mjs <frames-dir> <out.mp4> [--fps 60] [--crf 18] [--preset slow]')
		process.exit(1)
	}
	encodeFrames(framesDir, outFile, options).catch((err) => {
		console.error(err.message)
		process.exit(1)
	})
}
