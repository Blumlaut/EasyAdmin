/**
 * EasyAdmin 8.0: the main NUI demo video (README / docs / social).
 *
 * Runs against the browser mock environment (`?dev`), so no FiveM server is
 * needed. Animated intro, cursor walkthrough of the main sections with click
 * ripples and sliding captions, real interactions (UI density, layout switch),
 * fold-in and an animated outro that fades to black.
 *
 *   npm run demo:video
 *
 * Pacing notes (the video is the edit, and wall-clock time is video time):
 *   - `cursor.duration` is how long the drawn cursor takes to reach a target and
 *     every click waits for it, so it sets the pace of the whole video.
 *   - `warmPages` visits each page before recording, so no beat films a
 *     first-load skeleton: a dev server compiles a route's modules on demand.
 *   - Holds are reading time or animation time, nothing else. `v.waitFor()`
 *     before a caption keeps the caption off a page that is still filling in.
 */

import { defineVideo } from '../kit/video.mjs'

export default defineVideo({
	name: 'easyadmin-8.0',
	output: 'easyadmin-8.0-demo.mp4',
	viewport: { width: 1920, height: 1080 },
	background: '#0f172a',
	cursor: { duration: 380 },
	warmPages: ['players', 'map', 'reports', 'bans', 'statistics', 'resources', 'settings'],
	encode: { crf: 18, preset: 'slow', fadeIn: 0.4 },

	// On screen in the very first captured frame (no white flash, no dead time).
	opening: {
		logo: 'logo.png',
		title: 'EasyAdmin',
		version: '8.0',
		subtitle: 'The next-generation admin suite for FiveM',
		chips: ['React-based NUI', 'Modern design system', 'Plugin-ready'],
	},

	async run(v) {
		// ---- Intro ----
		await v.hold(2600) // the opening slide's own animation, plus a beat on the logo
		await v.hideSlide({ gap: 450 })

		await v.section('maximize', () => v.click('button[aria-label="Maximize window"]', { after: 500 }))

		await v.section('dashboard', async () => {
			await v.caption('Dashboard', 'Server vitals at a glance', { hold: 1200 })
		})

		await v.section('players', async () => {
			await v.nav('players', { after: 250 })
			await v.waitFor('.list-item-interactive')
			await v.captionShow({ title: 'Players', sub: 'Live player management' })
			await v.hold(800)
			// rest on a quick action once, so the hover tooltip appears
			await v.hover('.list-item-interactive .quick-action-btn', { after: 400 })
			await v.click('.list-item-interactive', { nth: 0, after: 250 })
			await v.caption('Player Detail', 'Profiles, identifiers & quick actions', { hold: 1300 })
		})

		await v.section('map', async () => {
			await v.nav('map', { after: 250 })
			await v.waitFor('.ea-map')
			await v.caption('Map', 'See players live on the map', { hold: 1500 })
		})

		await v.section('reports', async () => {
			await v.nav('reports', { after: 250 })
			await v.waitFor('.list-item-interactive')
			await v.captionShow({ title: 'Reports', sub: 'Moderation queue, one click away' })
			await v.hold(800)
			await v.click('.list-item-interactive', { nth: 0, after: 250 })
			await v.caption('Report Detail', 'Claim, resolve & take action', { hold: 1300 })
		})

		await v.section('bans', async () => {
			await v.nav('bans', { after: 250 })
			await v.waitFor('.list-item-interactive')
			await v.caption('Ban List', 'Temp & permanent bans, evasion-proof', { hold: 1400 })
		})

		await v.section('statistics', async () => {
			// one click: opening the dropdown also navigates to its first tab
			await v.nav('statistics', { after: 250 })
			await v.waitFor('.statistics-chart-card')
			await v.caption('Statistics', 'Charts & insights over time', { hold: 1500 })
		})

		await v.section('resources', async () => {
			await v.click('[data-nav-id="server"]', { after: 200 })
			await v.nav('resources', { after: 250 })
			await v.caption('Resources', 'Start, stop & monitor', { hold: 1500 })
		})

		await v.section('settings', async () => {
			await v.nav('settings', { after: 250 })
			await v.caption('Settings', 'Make EasyAdmin yours', { hold: 1100 })

			// try Cozy then Default density: the whole menu re-spaces live
			await v.section('ui density', async () => {
				await v.scrollTo('[role="radiogroup"][aria-label="UI density"]', { after: 200 })
				await v.click('label.density-option:has(input[value="cozy"])', { after: 750 })
				await v.click('label.density-option:has(input[value="default"])', { after: 650 })
			})

			// switch the sidebar to the top taskbar: the layout re-flows live
			await v.section('top taskbar', async () => {
				await v.scrollTo('label.layout-grid-option', { nth: 2, after: 200 })
				await v.click('label.layout-grid-option', { nth: 2, after: 1000 })
			})
		})

		await v.hold(150)
		await v.section('fold in', () => v.click('button[aria-label="Fold in"]', { after: 450 }))
		await v.hold(150)

		// ---- Outro ----
		v.mark('outro')
		await v.stage.slide({
			logo: 'logo.png',
			title: 'EasyAdmin 8.0',
			subtitle: 'Faster. Cleaner. Built for your server.',
			link: 'github.com/Blumlaut/EasyAdmin',
			size: 'sm',
		})
		await v.hold(2600) // logo pop, title, tagline, floating link
		await v.fade()
		await v.hold(800) // settle on black (kept in the timeline as a trailing hold)
		v.mark('end')
	},
})
