/**
 * Capture NUI screenshots for README.md and the documentation gallery.
 *
 * Boots the Vite dev server with the NUI mock environment (?dev) and
 * screenshots each page with Playwright, clipped to the admin window on a
 * dark backdrop. Output goes to docs/docs/assets/screenshots/ by default —
 * that is where README.md and docs/docs/index.md reference images from.
 *
 * Usage:
 *   npm run capture:screenshots            # default: port 5199, out docs/docs/assets/screenshots
 *   npm run capture:screenshots -- --port 5200
 *   npm run capture:screenshots -- --out /tmp/shots
 *   npm run capture:screenshots -- --url http://127.0.0.1:5199  # reuse a running dev server
 *
 * Requirements:
 *   npm run install:all                    # once
 *   npm i -D playwright                    # once (not a repo dependency)
 *   npx playwright install chromium        # or set EA_CHROMIUM_PATH to a
 *                                          # system chromium binary
 *
 * After regenerating, review the images in a browser — the mock demo data
 * is static, but any UI change needs human eyes before commit.
 */

import { spawn } from 'node:child_process'
import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_OUT = path.join(ROOT, 'docs', 'docs', 'assets', 'screenshots')

// `group` is the parent nav id of a dropdown that must be expanded first.
const PAGES = [
	{ file: 'dashboard', nav: 'main' },
	{ file: 'players', nav: 'players' },
	{ file: 'reports', nav: 'reports' },
	{ file: 'bans', nav: 'bans' },
	{ file: 'server', nav: 'server', group: 'server' },
	{ file: 'resources', nav: 'resources', group: 'server' },
	{ file: 'profiler', nav: 'profiler', group: 'server' },
	{ file: 'player-statistics', nav: 'player-statistics', group: 'statistics' },
	{ file: 'map', nav: 'map', settle: 2500 }, // Leaflet tiles need extra time
]

function parseArgs(argv) {
	const args = { port: 5199, out: DEFAULT_OUT, url: null }
	for (let i = 0; i < argv.length; i++) {
		switch (argv[i]) {
			case '--port': args.port = Number(argv[++i]); break
			case '--out': args.out = path.resolve(argv[++i]); break
			case '--url': args.url = argv[++i].replace(/\/$/, ''); break
			default:
				console.error(`Unknown argument: ${argv[i]}`)
				process.exit(1)
		}
	}
	return args
}

async function fetchOk(url) {
	try {
		const res = await fetch(url)
		return res.ok
	} catch {
		return false
	}
}

async function waitForServer(url, timeoutMs = 30000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		if (await fetchOk(url)) return
		await new Promise((r) => setTimeout(r, 300))
	}
	throw new Error(`Timed out waiting for ${url}`)
}

function startVite(port) {
	console.log(`Starting Vite dev server on port ${port}...`)
	const bin = path.join(ROOT, 'nui', 'node_modules', '.bin', 'vite')
	if (!fs.existsSync(bin)) {
		throw new Error('nui/node_modules missing — run `npm run install:all` first')
	}
	return spawn(bin, ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
		cwd: path.join(ROOT, 'nui'),
		stdio: 'inherit',
	})
}

const repoRequire = createRequire(import.meta.url)

async function loadPlaywright() {
	try {
		return await import('playwright')
	} catch {
		// CJS fallback — honors NODE_PATH, so a globally-installed playwright
		// works without a local dependency
		try {
			return repoRequire('playwright')
		} catch {
			console.error('\nplaywright is not installed. Run:\n'
				+ '  npm i -D playwright && npx playwright install chromium\n'
				+ 'or set NODE_PATH to a directory containing playwright, and point\n'
				+ 'EA_CHROMIUM_PATH at a chromium binary if the bundled one mismatches.')
			process.exit(1)
		}
	}
}

async function launchBrowser(chromium) {
	const candidates = [process.env.EA_CHROMIUM_PATH, undefined, '/usr/bin/chromium']
	let lastErr
	for (const executablePath of candidates) {
		if (executablePath && !fs.existsSync(executablePath)) continue
		try {
			return await chromium.launch({
				executablePath: executablePath || undefined,
				args: ['--no-sandbox'],
			})
		} catch (err) {
			lastErr = err
		}
	}
	throw lastErr
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function ensureGroupOpen(page, group) {
	const grp = page.locator(`[data-nav-id="${group}"]`)
	if (await grp.locator('.nav-dropdown-chevron-open').count() === 0) {
		await grp.first().click()
		await sleep(400)
	}
}

async function navigate(page, { nav, group, settle }) {
	if (group) await ensureGroupOpen(page, group)
	// parent dropdowns share their id with a child (e.g. "server") — the leaf is last
	await page.locator(`[data-nav-id="${nav}"]`).last().click()
	await sleep(settle ?? 800)
}

async function snapshot(page, outDir, file) {
	await page.evaluate(() => {
		document.querySelectorAll('*').forEach((el) => { el.scrollTop = 0 })
	})
	await sleep(300)
	const box = await page.locator('.ea-window').boundingBox()
	const pad = 12
	const clip = {
		x: Math.max(0, box.x - pad),
		y: Math.max(0, box.y - pad),
		width: Math.min(1920, box.x + box.width + pad) - Math.max(0, box.x - pad),
		height: Math.min(1080, box.y + box.height + pad) - Math.max(0, box.y - pad),
	}
	await page.screenshot({ path: path.join(outDir, `${file}.png`), clip })
	console.log(`  captured ${file}.png`)
}

async function main() {
	const { port, out, url } = parseArgs(process.argv.slice(2))
	const base = url || `http://127.0.0.1:${port}`

	fs.mkdirSync(out, { recursive: true })

	const ownedServer = !url
	let vite = null
	if (ownedServer && await fetchOk(`${base}/`)) {
		console.log(`Reusing dev server already running at ${base}`)
	} else if (ownedServer) {
		vite = startVite(port)
		vite.on('error', (err) => {
			console.error(err.message)
			process.exit(1)
		})
	}
	try {
		await waitForServer(`${base}/`)

		const { chromium } = await loadPlaywright()
		const browser = await launchBrowser(chromium)
		const context = await browser.newContext({
			viewport: { width: 1920, height: 1080 },
			deviceScaleFactor: 1,
		})
		const page = await context.newPage()

		console.log(`Loading ${base}/?dev ...`)
		await page.goto(`${base}/?dev`, { waitUntil: 'domcontentloaded' })
		await page.waitForSelector('.ea-window', { state: 'visible', timeout: 15000 })
		// dark backdrop so the floating window looks like it is in-game
		await page.addStyleTag({ content: 'html, body, #root { background: #0f172a !important; }' })
		await sleep(1500) // let fonts and mock data settle

		for (const p of PAGES) {
			await navigate(page, p)
			await snapshot(page, out, p.file)
		}

		await browser.close()
		console.log(`\nDone — ${PAGES.length} screenshots written to ${out}`)
	} finally {
		if (vite) {
			console.log('Stopping Vite dev server...')
			vite.kill('SIGTERM')
		}
	}
}

main().catch((err) => {
	console.error(err.message)
	process.exit(1)
})
