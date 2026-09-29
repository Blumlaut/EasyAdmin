/**
 * Browser plumbing for the demo-video kit: booting the Vite dev server,
 * loading Playwright and capturing the browser's native compositor frames.
 *
 * Frame capture uses CDP Page.startScreencast: the browser sends one frame per
 * compositor commit (up to the display's refresh rate) as a JPEG with a capture
 * timestamp, and paces itself on our acks so delivery never back-pressures the
 * page. Static stretches produce no frames at all, so encode rebuilds the exact
 * 60 fps timeline by repeating each frame until the next one arrives.
 */

import { spawn } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export const HERE = path.join(ROOT, 'scripts', 'demo-video')
export const DEFAULT_OUT = path.join(HERE, 'out')

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function fetchOk(url) {
	try {
		return (await fetch(url)).ok
	} catch {
		return false
	}
}

export async function waitForServer(url, timeoutMs = 30000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		if (await fetchOk(url)) return
		await sleep(300)
	}
	throw new Error(`Timed out waiting for ${url}`)
}

export function startVite(port) {
	console.log(`Starting Vite dev server on port ${port}...`)
	const bin = path.join(ROOT, 'nui', 'node_modules', '.bin', 'vite')
	if (!fs.existsSync(bin)) throw new Error('nui/node_modules missing, run `npm run install:all` first')
	return spawn(bin, ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
		cwd: path.join(ROOT, 'nui'),
		stdio: 'inherit',
	})
}

const repoRequire = createRequire(import.meta.url)

export async function loadPlaywright() {
	try {
		return await import('playwright')
	} catch {
		// CJS fallback that honors NODE_PATH, so a globally-installed playwright
		// works without a local dependency
		try {
			return repoRequire('playwright')
		} catch {
			throw new Error('playwright is not installed. Run:\n'
				+ '  npm i -D playwright && npx playwright install chromium\n'
				+ 'or set NODE_PATH to a directory containing playwright, and point\n'
				+ 'EA_CHROMIUM_PATH at a chromium binary if the bundled one mismatches.')
		}
	}
}

export async function launchBrowser(chromium, viewport) {
	// An explicit window size keeps the browser's compositor surface equal to the
	// recording viewport: screencast captures the surface, and a mismatched one
	// crops the video before any of our layout code can matter.
	const args = [
		'--no-sandbox',
		'--hide-scrollbars',
		'--force-color-profile=srgb',
		'--force-device-scale-factor=1',
	]
	if (viewport) args.push(`--window-size=${viewport.width},${viewport.height}`)

	const candidates = [process.env.EA_CHROMIUM_PATH, undefined, '/usr/bin/chromium']
	let lastErr
	for (const executablePath of candidates) {
		if (executablePath && !fs.existsSync(executablePath)) continue
		try {
			return await chromium.launch({ executablePath: executablePath || undefined, args })
		} catch (err) {
			lastErr = err
		}
	}
	throw lastErr
}

/**
 * Native frame capture via CDP Page.startScreencast. Frames land in
 * <framesDir>/ as NNNNNN.jpg plus timestamps.jsonl and markers.jsonl.
 */
export class FrameCapture {
	constructor(page, framesDir) {
		this.page = page
		this.framesDir = framesDir
		this.cdp = null
		this.index = 0
		this.t0 = 0
		// wall clock of the last captured frame, so a final hold on a static
		// frame (the tail after a fade to black) still ends up in the timeline
		this.lastFrameWall = 0
		this.tail = 0
	}

	async start() {
		fs.mkdirSync(this.framesDir, { recursive: true })
		// Clear leftovers from an aborted run: frames from two runs in one
		// directory cannot be told apart, and corrupt the encoded timeline.
		for (const file of fs.readdirSync(this.framesDir)) {
			if (file.endsWith('.jpg') || file.endsWith('.jsonl')) {
				fs.rmSync(path.join(this.framesDir, file), { force: true })
			}
		}
		fs.writeFileSync(path.join(this.framesDir, 'timestamps.jsonl'), '')
		fs.writeFileSync(path.join(this.framesDir, 'markers.jsonl'), '')
		this.cdp = await this.page.context().newCDPSession(this.page)
		this.cdp.on('Page.screencastFrame', (params) => {
			fs.writeFileSync(
				path.join(this.framesDir, `${String(this.index).padStart(6, '0')}.jpg`),
				Buffer.from(params.data, 'base64'),
			)
			const ts = params.metadata?.timestamp ?? Number.NaN
			fs.appendFileSync(path.join(this.framesDir, 'timestamps.jsonl'), `${this.index}\t${ts}\n`)
			this.lastFrameWall = Date.now()
			this.index++
			this.cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId }).catch(() => {})
		})
		await this.cdp.send('Page.startScreencast', {
			format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1,
		})
		this.t0 = Date.now()
	}

	mark(label) {
		fs.appendFileSync(
			path.join(this.framesDir, 'markers.jsonl'),
			`${((Date.now() - this.t0) / 1000).toFixed(3)}\t${label}\n`,
		)
	}

	/**
	 * Force one compositor frame at the end of the recording.
	 *
	 * A page that has stopped changing produces no frames, so without this the
	 * timeline would end at the *last* frame and any hold after it (the black
	 * tail after a fade to black) would be cut off. Repainting a 1px near-black
	 * pixel in the corner is invisible but makes the browser commit a frame whose
	 * timestamp marks where the recording really ends.
	 */
	async flush() {
		const before = this.index
		await this.page.evaluate(() => {
			const dot = document.createElement('div')
			dot.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;'
				+ 'background:#000;opacity:.02;pointer-events:none;z-index:2147483647'
			document.documentElement.appendChild(dot)
		}).catch(() => {})
		const deadline = Date.now() + 2000
		while (this.index === before && Date.now() < deadline) await sleep(25)
	}

	async stop() {
		const stopWall = Date.now()
		await this.cdp.send('Page.stopScreencast')
		await sleep(400) // let in-flight frames land on disk
		await this.cdp.detach().catch(() => {})
		// A static page produces no frames, so the last one was never followed by
		// anything, so without it the recording ends the instant it went static
		// (mid fade-to-black, or on the frame before a hold).
		this.tail = this.index ? Math.max(0, (stopWall - this.lastFrameWall) / 1000) : 0
		console.log(`\nCaptured ${this.index} frames → ${this.framesDir}`
			+ (this.tail > 0.05 ? ` (${this.tail.toFixed(2)}s trailing hold)` : ''))
		return { frames: this.index, tail: this.tail }
	}
}
