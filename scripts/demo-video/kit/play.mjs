/**
 * Play a video: boot the page, capture native frames, drive the walkthrough.
 *
 * This is the whole recording half of the pipeline. A video script (see
 * videos/*.mjs) only describes what happens; this file handles the dev server,
 * the browser, the injected stage, frame capture and the run manifest.
 *
 *   import { play } from './kit/play.mjs'
 *   await play(resolvedVideo)      // resolved by kit/video.mjs: resolveVideo()
 */

import fs from 'node:fs'
import path from 'node:path'
import { Director } from './director.mjs'
import {
	FrameCapture, HERE, fetchOk, launchBrowser, loadPlaywright, sleep, startVite, waitForServer,
} from './browser.mjs'

const STAGE_SOURCE = fs.readFileSync(path.join(HERE, 'kit', 'stage.js'), 'utf8')

export async function play(video) {
	const { base, framesDir, stageInit } = video
	fs.mkdirSync(video.out, { recursive: true })

	let vite = null
	try {
		if (video.ownsServer) {
			if (await fetchOk(`${base}/`)) console.log(`Reusing dev server already running at ${base}`)
			else vite = startVite(video.port)
		}
		await waitForServer(`${base}/`)

		const { chromium } = await loadPlaywright()
		const browser = await launchBrowser(chromium, video.viewport)
		try {
			const context = await browser.newContext({
				viewport: video.viewport,
				deviceScaleFactor: video.deviceScaleFactor,
			})
			const url = `${base}/${String(video.url).replace(/^\//, '')}`

			// A cold dev server pre-bundles dependencies and reloads the page while
			// doing it. Get that over with on a throwaway page, so the recorded load
			// and the intro that plays during it, starts immediately.
			if (video.ready) {
				console.log('Warming up the app (a cold dev server has to pre-bundle dependencies) ...')
				const warm = await context.newPage()
				try {
					await warm.goto(url, { waitUntil: 'commit' })
					await awaitApp(warm, video)
					// Visiting each page here means the recorded walkthrough never
					// films a first-load: Vite compiles a route's modules on first
					// request, and dev-mode lazy routes are slow exactly once.
					for (const page of warmPages(video)) {
						const nav = warm.locator(`[data-nav-id="${page}"]`).last()
						await nav.click({ timeout: 5000 }).catch(() => {})
						await sleep(500)
					}
					await warm.goto(url, { waitUntil: 'commit' }).catch(() => {})
					await awaitApp(warm, video)
					await sleep(video.settle)
				} finally {
					await warm.close().catch(() => {})
				}
			}

			const page = await context.newPage()
			// Surface uncaught page errors as they happen: a silently broken stage
			// would otherwise just record a dark rectangle.
			page.on('pageerror', (err) => console.error(`[page] ${err.message}`))

			// The stage is injected before any app code runs, so the backdrop,
			// frame mask and opening slide are already on screen in frame one.
			await page.addInitScript({ content: `window.__stageInit = ${JSON.stringify(stageInit)};\n${STAGE_SOURCE}` })

			console.log(`Loading ${url} ...`)
			// 'commit' resolves before the document's first paint, so capture is
			// live before the opening slide plays.
			await page.goto(url, { waitUntil: 'commit' })

			const capture = new FrameCapture(page, framesDir)
			await capture.start()
			writeManifest(framesDir, video)

			await awaitApp(page, video)
			await sleep(video.settle)

			const director = new Director({
				page,
				background: video.background,
				cursor: video.cursor,
				mark: (label) => capture.mark(label),
				log: console.log,
			})

			console.log(`Recording "${video.name}" ...`)
			try {
				await video.run(director, page)
			} catch (err) {
				// Keep whatever was captured: a half-recorded video beats no video.
				console.error(`\n[video] run() failed: ${err.message}`)
				if (typeof video.onError === 'function') await video.onError(director, err).catch(() => {})
			}
			if (typeof video.finish === 'function') await video.finish(director)

			await capture.flush()
			const { frames, tail } = await capture.stop()
			writeManifest(framesDir, video, frames, tail)
			return { framesDir, outputPath: video.outputPath, captured: frames, tail }
		} finally {
			await browser.close()
		}
	} finally {
		if (vite) {
			console.log('Stopping Vite dev server...')
			vite.kill('SIGTERM')
		}
	}
}

/**
 * Wait until the app has rendered `video.ready`, reloading if the dev server is
 * still pre-bundling. Fails with a pointer to the dev server once the deadline
 * (`readyTimeout`) passes.
 */
async function awaitApp(page, video) {
	const deadline = Date.now() + video.readyTimeout
	for (let attempt = 1; ; attempt++) {
		const left = deadline - Date.now()
		try {
			await page.waitForSelector(video.ready, {
				state: 'visible',
				timeout: Math.max(5000, Math.min(30000, left)),
			})
			return
		} catch (err) {
			if (Date.now() >= deadline || left <= 0) {
				throw new Error(`the NUI did not render "${video.ready}" within ${Math.round(video.readyTimeout / 1000)}s`
					+ '\n  Check the app by hand: npm --prefix nui run dev'
					+ ` and open ${video.base}/${String(video.url).replace(/^\//, '')}`)
			}
			console.log(`  still booting (attempt ${attempt + 1}), reloading the page`)
			await page.reload({ waitUntil: 'commit' }).catch(() => {})
		}
	}
}

/** Routes to visit on the throwaway page before recording (see DEFAULTS.warmPages). */
function warmPages(video) {
	return Array.isArray(video.warmPages) ? video.warmPages : []
}

/** Settings the encoder needs, written next to the frames. */
function writeManifest(framesDir, video, capturedFrames, tail = 0) {
	fs.writeFileSync(path.join(framesDir, 'manifest.json'), JSON.stringify({
		name: video.name,
		output: video.output,
		fps: video.fps,
		encode: video.encode,
		viewport: video.viewport,
		capturedFrames,
		tail,
	}, null, '\t'))
}
