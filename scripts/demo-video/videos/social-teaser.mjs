/**
 * Social teaser: a square cut of the NUI for shorts/stories.
 *
 * Same kit, different delivery: a 1200x1200 page masked down to a 1080x1080
 * rounded card, with zoomed-in crop levels, a spotlight callout, a circular
 * scene transition and a corner watermark.
 *
 *   npm run demo:video -- social-teaser
 */

import { defineVideo } from '../kit/video.mjs'

export default defineVideo({
	name: 'social-teaser',
	viewport: { width: 1200, height: 1200 },
	background: '#0b1220',
	// Masks everything outside a 1080x1080 rounded window: the delivery crop.
	frame: { width: 1080, height: 1080, radius: 44 },
	encode: { crf: 20, fadeIn: 0.4, fadeOut: 0.6 },

	opening: {
		logo: 'logo.png',
		kicker: 'FiveM admin suite',
		title: 'EasyAdmin',
		version: '8.0',
		subtitle: 'Modern moderation for your server',
	},

	async run(v) {
		await v.hold(3800)
		await v.hideSlide({ gap: 600 })

		await v.click('button[aria-label="Maximize window"]', { after: 900 })
		await v.watermark({ src: 'logo.png', text: 'EasyAdmin', size: 36, opacity: 0.75 })

		// ---- Dashboard, zoomed in on a single stat tile ----
		await v.section('dashboard', async () => {
			await v.captionShow({ title: 'Dashboard', sub: 'Everything at a glance' })
			await v.hold(1600)
			await v.zoomTo('.dashboard-card-sm', { nth: 1, duration: 1000, hold: 900 })
			const callout = await v.callout('.dashboard-card-sm', 'Live server stats', {
				nth: 1, mode: 'spotlight', dim: 0.5, padding: 14,
			})
			await v.hold(2200)
			await callout.hide({ gap: 300 })
			await v.resetCamera({ duration: 800, hold: 500 })
			await v.captionHide()
		})

		// ---- Players: a circular transition into a zoomed player list ----
		// Nothing inside a cut is visible, so only the state change happens here.
		await v.cut({ mode: 'circle', duration: 550 }, async () => {
			await v.nav('players', { after: 250 })
		})
		await v.section('players', async () => {
			await v.captionShow({ title: 'Players', sub: 'Live player management', position: 'bottom-left' })
			await v.zoomTo('.list-item-interactive', { nth: 0, zoom: 1.5, duration: 900, hold: 1400 })
			const actions = await v.callout('.quick-action-btn', 'One-click actions', {
				nth: 0, mode: 'pulse', padding: 10,
			})
			await v.hold(2200)
			await actions.hide({ gap: 300 })
			await v.click('.list-item-interactive', { nth: 0, after: 1400 })
			await v.captionShow({ title: 'Player Detail', sub: 'Identifiers, notes & actions' })
			await v.hold(1800)
			await v.resetCamera({ duration: 800 })
			await v.captionHide()
		})

		// ---- Outro: the slide's own fade-in is the transition ----
		v.mark('outro')
		await v.stage.slide({
			logo: 'logo.png',
			kicker: 'Available now',
			title: 'EasyAdmin 8.0',
			subtitle: 'Faster. Cleaner. Built for your server.',
			link: 'github.com/Blumlaut/EasyAdmin',
			size: 'sm',
			theme: 'brand',
		})
		await v.hold(5200)
		await v.fade()
		await v.hold(1200)
		v.mark('end')
	},
})
