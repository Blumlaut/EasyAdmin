/**
 * EasyAdmin 8.0 upgrade guide, for the administrators doing the update.
 *
 * A presentation video: instruction slides carry the changes, and one short
 * section at the end shows the result in the real NUI. Every line on screen is
 * taken from the repo (docs/docs/updates/updating.md, fxmanifest.lua,
 * shared/permissions.lua), so keep it that way when editing.
 *
 *   npm run demo:video -- easyadmin-8.0-upgrade
 *
 * Presentation rules that keep this readable:
 *   - the synthetic cursor is hidden while slides are up, and only shown for
 *     the UI section at the end
 *   - steps that change a file get two cards, REMOVE and ADD, never one list
 *     with mixed colours
 *   - slides change with a plain fade and a gap long enough to finish it; the
 *     only dip to black is the one into the UI section, and the outro fades in
 *     over the app rather than dipping to black first (see the outro note)
 *   - each slide carries one idea and holds for 6-7 s
 */

import { defineVideo } from '../kit/video.mjs'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace'
const SANS = 'Inter,system-ui,-apple-system,sans-serif'

const TONES = {
	remove: { ink: '#f87171', bg: 'rgba(248,113,113,.07)' },
	add: { ink: '#4ade80', bg: 'rgba(74,222,128,.07)' },
	keep: { ink: '#67e8f9', bg: 'rgba(103,232,249,.06)' },
	expect: { ink: '#a5b4fc', bg: 'rgba(165,180,252,.06)' },
}

/** One labelled block of file content: REMOVE, ADD, KEEP or EXPECT. */
const card = (label, tone, lines) => {
	const { ink, bg } = TONES[tone]
	return `<div style="flex:1 1 0;min-width:0;max-width:900px">
<div style="font:600 20px/1 ${MONO};letter-spacing:2.5px;color:${ink}">${esc(label)}</div>
<div style="margin-top:12px;padding:24px 26px;border-radius:14px;background:${bg};border:1px solid ${ink}33;font:500 27px/1.7 ${MONO};color:#e2e8f0;white-space:pre">${esc(lines.join('\n'))}</div>
</div>`
}

/** A step slide: kicker, title, one or two cards, and why it changed. */
const step = ({ kicker, title, cards, note }) => `<div style="width:min(1540px,90vw);text-align:left;font-family:${SANS}">
<div style="font:600 20px/1 ${MONO};letter-spacing:3px;text-transform:uppercase;color:#22d3ee">${esc(kicker)}</div>
<div style="margin-top:12px;font:700 46px/1.15 ${SANS};color:#f8fafc">${esc(title)}</div>
<div style="display:flex;gap:26px;margin-top:32px">${cards.join('')}</div>
${note ? `<div style="margin-top:28px;max-width:1440px;font:500 26px/1.5 ${SANS};color:#94a3b8">${esc(note)}</div>` : ''}
</div>`

export default defineVideo({
	name: 'easyadmin-8.0-upgrade',
	output: 'easyadmin-8.0-upgrade-guide.mp4',
	viewport: { width: 1920, height: 1080 },
	background: '#0b1220',
	cursor: { duration: 380 },
	warmPages: ['players', 'map', 'reports', 'bans', 'statistics', 'resources', 'settings'],
	encode: { crf: 18, preset: 'slow', fadeIn: 0.5 },

	opening: {
		logo: 'logo.png',
		kicker: 'Upgrade guide',
		title: 'EasyAdmin',
		version: '8.0',
		subtitle: 'For server administrators',
	},

	async run(v) {
		await v.cursor(false) // no cursor while the slides are up
		await v.hold(3200)
		// keep the slide up from here on: each step replaces its content, so the
		// audience never sees the app flash between two steps
		await v.fade({ duration: 500 })
		await v.hold(600)

		// -------------------------------------------------- 1. back up first
		await v.slide({
			html: step({
				kicker: 'Step 1 of 6',
				title: 'Back up your data',
				cards: [card('STOP THE SERVER AND COPY THESE', 'keep', [
					'resources/EasyAdmin/banlist.json',
					'resources/EasyAdmin/data/',
					'resources/EasyAdmin/actions.json',
					'resources/EasyAdmin/notes.json',
				])],
			}),
		}, { hold: 0, hide: false })
		await v.hold(900) // its entrance animation finishes behind the cover
		await v.unfade({ duration: 500 })
		await v.hold(4600)

		// ------------------------------------------------- 2. replace the files
		await v.slide({
			html: step({
				kicker: 'Step 2 of 6',
				title: 'Replace the resource folder',
				cards: [
					card('DELETE FROM YOUR 7.x INSTALL', 'remove', [
						'client/         dependencies/',
						'dist/           docs/',
						'plugins/        server/',
						'shared/         src/',
					]),
					card('KEEP THESE', 'keep', [
						'banlist.json',
						'data/',
						'actions.json',
						'notes.json',
					]),
				],
			}),
		}, { hold: 6600, hide: false })

		// ---------------------------------------------- 3. server.cfg, removed
		await v.slide({
			html: step({
				kicker: 'Step 3 of 6  /  server.cfg',
				title: 'Delete these options',
				cards: [card('REMOVE FROM server.cfg', 'remove', [
					'setr ea_screenshotOptions "..."',
					'setr ea_alwaysShowButtons "true"',
				])],
			}),
		}, { hold: 4000, hide: false })

		// ---------------------------------------------- 3. server.cfg, added
		await v.slide({
			html: step({
				kicker: 'Step 3 of 6  /  server.cfg',
				title: 'Add these instead',
				cards: [card('ADD TO server.cfg', 'add', [
					'setr ea_screenshotMaxResolution 1280',
					'setr ea_screenshotQuality 0.8',
				])],
				note: 'screenshot-basic is no longer needed, and ea_screenshoturl and ea_screenshotfield still work.',
			}),
		}, { hold: 4600, hide: false })

		await v.slide({
			html: step({
				kicker: 'Step 3 of 6  /  optional',
				title: 'New options worth setting',
				cards: [card('OPTIONAL, DEFAULTS SHOWN', 'add', [
					'setr ea_enableActionHistory true',
					'setr ea_actionHistoryExpiry 120',
					'setr ea_enableAdminNotes true',
					'setr ea_botGuild 123456789012345678',
				])],
				note: 'The bot registers its commands globally in 8.0, so ea_botGuild is what keeps them in your server. ea_defaultKey no longer opens the menu: use /easyadmin.',
			}),
		}, { hold: 6400, hide: false })

		// ------------------------------------------ 4. permissions, removed
		await v.slide({
			html: step({
				kicker: 'Step 4 of 6  /  permissions',
				title: 'Two permissions are gone',
				cards: [card('REMOVED IN 8.0', 'remove', [
					'easyadmin.server.permissions.read',
					'easyadmin.server.permissions.write',
				])],
			}),
		}, { hold: 3800, hide: false })

		// ------------------------------------------ 4. permissions, added
		await v.slide({
			html: step({
				kicker: 'Step 4 of 6  /  permissions',
				title: 'Grant the new ones',
				cards: [card('NEW IN 8.0, GRANT WHAT YOUR STAFF NEED', 'add', [
					'easyadmin.player.actionhistory.view',
					'easyadmin.player.adminnotes.view',
					'easyadmin.player.namehistory.view',
					'easyadmin.server.map.view',
					'easyadmin.server.statistics.view',
					'easyadmin.server.resources.monitor',
				])],
				note: 'For example: add_ace group.moderator easyadmin.server.map.view allow. Admins with add_ace group.admin easyadmin allow already have all of it.',
			}),
		}, { hold: 7000, hide: false })

		// ------------------------------------- 5. GTA V Enhanced file access
		await v.slide({
			html: step({
				kicker: 'Step 5 of 6  /  GTA V Enhanced',
				title: 'Allow file access',
				cards: [card('ADD TO server.cfg, ONLY ON ENHANCED', 'add', [
					'add_filesystem_permission EasyAdmin write EasyAdmin',
				])],
				note: 'Without this line the resource cannot save its data.',
			}),
		}, { hold: 4400, hide: false })

		// ------------------------------------------------- 6. restart and verify
		await v.slide({
			html: step({
				kicker: 'Step 6 of 6',
				title: 'Restart and check',
				cards: [card('WHAT YOU SHOULD SEE', 'expect', [
					'EasyAdmin 8.0          splash',
					'Logged in as <you>!    admin session',
					'data/actions.json      imported',
					'data/notes.json        imported',
				])],
				note: 'Plugins written for 7.x no longer load: in 8.0 they are separate resources that register with exports.EasyAdmin:RegisterPlugin.',
			}),
		}, { hold: 7000, hide: false })

		// -------------------------------------------- the result, in the real UI
		await v.fade({ duration: 700 })
		await v.hold(750)
		await v.hideSlide({ gap: 0 })
		await v.cursor(true)
		await v.unfade({ duration: 700 })
		await v.hold(250)

		await v.caption('Dashboard', { hold: 2800 })
		await v.nav('players', { after: 250 })
		await v.waitFor('.list-item-interactive')
		await v.caption('Players', { hold: 3000 })
		await v.nav('map', { after: 250 })
		await v.waitFor('.ea-map')
		await v.caption('Map', { hold: 2800 })
		await v.nav('statistics', { after: 250 })
		await v.waitFor('.statistics-chart-card')
		await v.caption('Statistics', { hold: 2800 })

		// --------------------------------------------------------------- outro
		// No dip to black here: the slide and the black cover both fade over
		// 700 ms, so covering the swap would lift the cover onto the app for
		// half a second. The slide's own fade is the transition.
		v.mark('outro')
		await v.cursor(false)
		await v.stage.slide({
			logo: 'logo.png',
			title: 'EasyAdmin 8.0',
			link: 'easyadmin.readthedocs.io',
			linkIcon: false,
			size: 'sm',
			theme: 'brand',
		})
		await v.hold(3400)
		await v.fade({ duration: 900 })
		await v.hold(800)
		v.mark('end')
	},
})
