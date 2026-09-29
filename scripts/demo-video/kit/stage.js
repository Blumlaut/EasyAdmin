/**
 * Stage: the browser-side overlay runtime for EasyAdmin demo videos.
 *
 * Injected into the page before any app code runs (record/build do this with
 * Playwright's addInitScript), so the very first captured frame already shows
 * the backdrop, the delivery frame mask and an optional opening slide.
 *
 * Everything the viewer sees on top of the app is drawn here:
 *   - a synthetic animated cursor (Playwright's mouse is invisible to the
 *     compositor, so recordings need their own)
 *   - section captions / lower thirds
 *   - full-screen presentation slides (intro, outro, chapter cards)
 *   - transitions between scenes (fade, dip, wipe, circle)
 *   - the camera: crop, zoom and pan the app without re-recording
 *   - annotations: spotlights, outlines and labels pointing at UI elements
 *   - delivery-frame mask (square / vertical / rounded crops), watermark,
 *     progress bar and the final fade to black
 *
 * The Node-side director (kit/director.mjs) drives it through window.__stage.
 * Every method takes one plain object (or nothing), so it is safe to call over
 * page.evaluate; animated methods return a promise that settles when the
 * animation is done.
 *
 * Configuration arrives as window.__stageInit (set by the kit before this
 * script runs): { background, frame, opening, cursor: { duration, easing } }.
 */
;(() => {
	if (window.__stage) return

	const doc = document
	const init = window.__stageInit || {}
	const BG = init.background || '#0f172a'
	const CURSOR_DURATION = (init.cursor && init.cursor.duration) || 550
	const CURSOR_EASING = (init.cursor && init.cursor.easing) || 'cubic-bezier(.22, 1, .36, 1)'
	const EASE = 'cubic-bezier(.4, 0, .2, 1)'

	// Backdrop before the first paint, so early capture frames are never white.
	// At document-start there may be no <html> yet, so watch for it and paint as
	// soon as it exists.
	const paintBackdrop = () => {
		if (!doc.documentElement) return false
		doc.documentElement.style.background = BG
		return true
	}
	if (!paintBackdrop()) {
		const observer = new MutationObserver(() => { if (paintBackdrop()) observer.disconnect() })
		observer.observe(doc, { childList: true, subtree: true })
	}

	const vw = () => window.innerWidth
	const vh = () => window.innerHeight
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
	const esc = (v) => String(v == null ? '' : v)
		.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

	const GITHUB_ICON = '<svg viewBox="0 0 16 16" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>'

	const CSS = `
		html, body, * { cursor: none !important; }
		#stage {
			font-family: -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, oxygen, ubuntu, cantarell, sans-serif;
			-webkit-font-smoothing: antialiased;
		}
		#stage, #stage * { pointer-events: none !important; }

		/* ---- Delivery frame mask (crops the recording to a delivery format) ---- */
		/* Sits above every other layer (cursor and black excluded) so the whole
		   recording (app, slides and transitions) is cropped to the frame. */
		#stage-frame {
			position: fixed; left: 50%; top: 50%; z-index: 2147483634;
			transform: translate(-50%, -50%);
			display: none; overflow: visible;
		}
		#stage-frame.on { display: block; }

		/* ---- Annotations (spotlights, outlines, labels) ---- */
		#stage-annotations { position: fixed; inset: 0; z-index: 2147483625; }
		.stage-annot {
			position: absolute; border-radius: 10px;
			opacity: 0; transition: opacity .35s ease;
		}
		.stage-annot.show { opacity: 1; }
		.stage-annot.mode-outline {
			border: 2px solid var(--accent, #22d3ee);
			box-shadow: 0 0 0 4px rgba(34, 211, 238, .16), 0 0 26px rgba(34, 211, 238, .45);
		}
		.stage-annot.mode-spotlight {
			border: 2px solid var(--accent, #22d3ee);
			box-shadow: 0 0 0 6000px rgba(2, 6, 15, var(--dim, .55));
		}
		.stage-annot.mode-pulse::after {
			content: ''; position: absolute; inset: -7px; border-radius: inherit;
			border: 2px solid var(--accent, #22d3ee);
			animation: stagePulse 1.8s ease-out infinite;
		}
		@keyframes stagePulse {
			0%   { transform: scale(.96); opacity: .85; }
			100% { transform: scale(1.12); opacity: 0; }
		}
		.stage-annot-label {
			position: absolute; padding: 8px 14px;
			background: #0b1220; border: 1px solid rgba(148, 163, 184, .28);
			border-left: 3px solid var(--accent, #22d3ee);
			border-radius: 10px; box-shadow: 0 10px 26px rgba(0, 0, 0, .45);
			color: #e2e8f0; font-size: 15px; font-weight: 600; letter-spacing: .2px;
			white-space: nowrap; opacity: 0;
			transition: opacity .3s ease;
		}
		.stage-annot-label.show { opacity: 1; }

		/* ---- Section captions / lower thirds ---- */
		#stage-caption {
			position: fixed; z-index: 2147483627;
			min-width: 260px; max-width: 46vw; padding: 16px 24px 18px;
			background: rgba(11, 18, 32, .82);
			border: 1px solid rgba(148, 163, 184, .18);
			border-left: 3px solid var(--accent, #22d3ee);
			border-radius: 12px;
			box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
			opacity: 0;
			transform: translate(calc(var(--ox, 0px) + var(--hide-x, 0px)), calc(var(--oy, 0px) + var(--hide-y, 28px)));
			transition: opacity .45s ease, transform .55s cubic-bezier(.22, 1, .36, 1);
		}
		#stage-caption.show { opacity: 1; transform: translate(var(--ox, 0px), var(--oy, 0px)); }
		#stage-caption .cap-title { font-size: 27px; font-weight: 700; color: #f8fafc; letter-spacing: .3px; line-height: 1.15; }
		#stage-caption .cap-sub { margin-top: 4px; font-size: 15px; color: #94a3b8; }

		/* ---- Presentation slides ---- */
		#stage-slide {
			position: fixed; inset: 0; z-index: 2147483628;
			display: flex; align-items: center; justify-content: center;
			opacity: 0; visibility: hidden;
			transition: opacity .7s ease, visibility .7s;
		}
		#stage-slide.show { opacity: 1; visibility: visible; }
		#stage-slide.mode-full {
			background: radial-gradient(1200px 640px at 50% 32%, #13223d 0%, #0b1220 62%);
		}
		#stage-slide.mode-full.theme-light {
			background: linear-gradient(158deg, #f8fafc 0%, #dbe3ef 100%);
		}
		#stage-slide.mode-full.theme-brand {
			background: radial-gradient(90% 70% at 50% 8%, #1d4ed8 0%, rgba(11, 18, 32, 0) 72%), #0b1220;
		}
		#stage-slide.mode-panel { background: rgba(6, 10, 19, var(--scrim, .58)); }
		#stage-slide .sl-inner {
			display: flex; flex-direction: column; align-items: center; text-align: center;
			padding: 0 24px; max-width: 82vw;
		}
		#stage-slide.mode-panel .sl-inner {
			padding: 44px 60px; border-radius: 18px;
			background: #1e293b; border: 1px solid rgba(148, 163, 184, .18);
			box-shadow: 0 24px 60px rgba(0, 0, 0, .45);
		}
		#stage-slide.align-left .sl-inner { align-items: flex-start; text-align: left; }
		.sl-item { opacity: 0; }
		#stage-slide.show .sl-item {
			animation: stageFadeUp .7s ease both;
			animation-delay: calc(.25s + var(--i, 0) * .32s);
		}
		/* Swapping the content of a slide that is already up: the old items have
		   just gone, so the entrance delay would leave the slide blank for a
		   quarter of a second. Swapped items come in at once. */
		#stage-slide.swap .sl-item {
			animation-duration: .4s;
			animation-delay: calc(var(--i, 0) * .06s);
		}
		#stage-slide.swap .sl-item-version {
			animation-duration: .5s;
			animation-delay: calc(var(--i, 0) * .06s);
		}
		#stage-slide.swap .sl-item-link {
			animation-duration: .4s;
			animation-delay: calc(var(--i, 0) * .06s);
		}
		#stage-slide.show .sl-item-logo {
			animation: stageLogoIn .9s cubic-bezier(.34, 1.56, .64, 1) .15s both,
			           stageGlow 2.6s ease-in-out 1.3s infinite;
		}
		#stage-slide.show .sl-item-version {
			animation: stagePop .8s cubic-bezier(.34, 1.56, .64, 1) both;
			animation-delay: calc(.3s + var(--i, 0) * .32s);
		}
		#stage-slide.show .sl-item-link {
			animation: stageFadeUp .7s ease both, stageFloat 3s ease-in-out 2.4s infinite;
			animation-delay: calc(.25s + var(--i, 0) * .32s);
		}
		@keyframes stageLogoIn {
			0%   { opacity: 0; transform: scale(.55) rotate(-8deg); filter: blur(10px); }
			70%  { opacity: 1; transform: scale(1.04) rotate(1deg); filter: blur(0); }
			100% { opacity: 1; transform: scale(1) rotate(0); }
		}
		@keyframes stageGlow {
			0%, 100% { filter: drop-shadow(0 0 14px rgba(34, 211, 238, .35)); }
			50%      { filter: drop-shadow(0 0 34px rgba(34, 211, 238, .75)); }
		}
		@keyframes stageFadeUp {
			from { opacity: 0; transform: translateY(22px); }
			to   { opacity: 1; transform: translateY(0); }
		}
		@keyframes stagePop {
			0%   { opacity: 0; transform: scale(.6); }
			70%  { opacity: 1; transform: scale(1.06); }
			100% { opacity: 1; transform: scale(1); }
		}
		@keyframes stageFloat {
			0%, 100% { transform: translateY(0); }
			50%      { transform: translateY(-6px); }
		}
		.sl-logo { width: 132px; height: 132px; margin-bottom: 22px; }
		.sl-logo img { width: 100%; height: 100%; display: block; }
		#stage-slide.mode-panel .sl-logo { width: 76px; height: 76px; margin-bottom: 16px; }
		#stage-slide.size-sm .sl-logo { width: 84px; height: 84px; margin-bottom: 18px; }
		#stage-slide.size-sm .sl-title { font-size: 52px; letter-spacing: 1px; }
		#stage-slide.size-sm .sl-version { font-size: 64px; }
		#stage-slide.size-sm .sl-sub { margin-top: 12px; font-size: 21px; }
		.sl-kicker {
			font-size: 15px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
			color: #22d3ee; margin-bottom: 10px;
		}
		.sl-title { font-size: 46px; font-weight: 800; color: #f8fafc; letter-spacing: 2px; line-height: 1.1; }
		.sl-version {
			margin-top: 2px; font-size: 84px; font-weight: 800; line-height: 1; letter-spacing: -2px;
			background: linear-gradient(92deg, #22d3ee 10%, #818cf8 90%);
			-webkit-background-clip: text; background-clip: text; color: transparent;
		}
		.sl-sub { margin-top: 18px; font-size: 20px; color: #94a3b8; }
		.sl-bullets { margin: 22px 0 0; padding: 0; list-style: none; text-align: left; }
		.sl-bullets li {
			position: relative; padding-left: 26px; margin-top: 12px;
			font-size: 19px; color: #cbd5e1;
		}
		.sl-bullets li::before {
			content: ''; position: absolute; left: 4px; top: 9px;
			width: 8px; height: 8px; border-radius: 50%; background: #22d3ee;
		}
		.sl-chips { margin-top: 30px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
		.sl-chips span {
			padding: 8px 18px; border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, .3);
			background: rgba(30, 41, 59, .55);
			color: #cbd5e1; font-size: 15px; font-weight: 500;
		}
		.sl-link {
			margin-top: 34px; font-size: 17px; color: #22d3ee; font-weight: 600; letter-spacing: .4px;
			display: flex; align-items: center; gap: .55rem;
		}
		.sl-link svg { flex: none; }
		#stage-slide.theme-light .sl-title { color: #0b1220; }
		#stage-slide.theme-light .sl-sub,
		#stage-slide.theme-light .sl-bullets li { color: #475569; }

		/* ---- Transitions ---- */
		#stage-sweep {
			position: fixed; inset: 0; z-index: 2147483630;
			background: #05070d; opacity: 0; visibility: hidden;
			will-change: transform, opacity;
		}

		/* ---- Progress bar ---- */
		#stage-progress {
			position: fixed; left: 0; right: 0; bottom: 0; height: var(--bar-h, 4px);
			z-index: 2147483631; opacity: 0; transition: opacity .4s ease;
		}
		#stage-progress.show { opacity: 1; }
		#stage-progress .pg-track { position: absolute; inset: 0; background: rgba(148, 163, 184, .18); }
		#stage-progress .pg-fill {
			height: 100%; width: 0;
			background: linear-gradient(90deg, #22d3ee, #818cf8);
			transition: width .6s linear;
		}
		#stage-progress .pg-label {
			position: absolute; right: 16px; bottom: calc(var(--bar-h, 4px) + 10px);
			font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: .4px;
		}

		/* ---- Watermark ---- */
		#stage-watermark {
			position: fixed; z-index: 2147483629;
			display: none; align-items: center; gap: 10px;
			opacity: var(--wm-opacity, .8);
		}
		#stage-watermark.on { display: flex; }
		#stage-watermark img { display: block; width: var(--wm-size, 40px); height: var(--wm-size, 40px); }
		#stage-watermark span { font-size: 15px; font-weight: 700; color: #e2e8f0; letter-spacing: .3px; }

		/* ---- Custom cursor ---- */
		#stage-cursor {
			position: fixed; left: 0; top: 0;
			z-index: 2147483633;
			transform: translate(-300px, -300px);
			transition: transform var(--cursor-duration, 550ms) var(--cursor-easing, ease), opacity .3s ease;
			will-change: transform;
		}
		#stage-cursor.off { opacity: 0; }
		#stage-cursor svg {
			display: block; filter: drop-shadow(0 2px 8px rgba(0, 0, 0, .7));
			transition: transform .1s ease;
		}
		#stage-cursor.pressing svg { transform: scale(.82); }
		.stage-ripple {
			position: fixed; z-index: 2147483632;
			width: 16px; height: 16px; margin: -8px 0 0 -8px;
			border-radius: 50%; background: rgba(34, 211, 238, .7);
			animation: stageRipple .55s ease-out forwards;
		}
		@keyframes stageRipple {
			from { transform: scale(.6); opacity: .9; }
			to   { transform: scale(4.5); opacity: 0; }
		}

		/* ---- Final fade ---- */
		#stage-black {
			position: fixed; inset: 0; z-index: 2147483640;
			background: #000; opacity: 0; transition: opacity var(--fade-duration, 1.1s) ease;
		}
		#stage-black.show { opacity: 1; }
	`

	const CAPTION_POSITIONS = {
		'bottom-left': { left: 44, bottom: 48, hideX: '0px', hideY: '28px' },
		'bottom-center': { left: '50%', bottom: 48, originX: '-50%', hideX: '0px', hideY: '28px' },
		'bottom-right': { right: 44, bottom: 48, hideX: '24px', hideY: '0px' },
		'top-left': { left: 44, top: 48, hideX: '0px', hideY: '-28px' },
		'top-center': { left: '50%', top: 48, originX: '-50%', hideX: '0px', hideY: '-28px' },
		'center': { left: '50%', top: '50%', originX: '-50%', originY: '-50%', hideX: '0px', hideY: '18px' },
	}

	const WATERMARK_POSITIONS = {
		'bottom-right': ['right', 'bottom'],
		'bottom-left': ['left', 'bottom'],
		'top-right': ['right', 'top'],
		'top-left': ['left', 'top'],
	}

	/**
	 * Run a WAAPI animation and hand styling back to inline styles afterwards.
	 * `finalize` sets the resting state before the animation is cancelled, so
	 * there is never a frame showing the pre-animation style.
	 */
	async function anim(el, frames, opts, finalize) {
		const a = el.animate(frames, { duration: 0, easing: 'linear', fill: 'forwards', ...opts })
		try { await a.finished } catch { /* cancelled, a newer transition took over */ }
		if (finalize) finalize()
		a.cancel()
	}

	function mount() {
		doc.documentElement.style.background = BG
		doc.body.style.background = BG
		const root = doc.getElementById('root')
		if (root) root.style.background = BG

		const style = doc.createElement('style')
		style.textContent = CSS
		doc.head.appendChild(style)

		const ui = doc.createElement('div')
		ui.id = 'stage'
		ui.innerHTML = `
			<div id="stage-frame"></div>
			<div id="stage-annotations"></div>
			<div id="stage-caption"><div class="cap-title"></div><div class="cap-sub"></div></div>
			<div id="stage-slide"><div class="sl-inner"></div></div>
			<div id="stage-watermark"><img src="" alt=""><span></span></div>
			<div id="stage-sweep"></div>
			<div id="stage-progress"><div class="pg-track"></div><div class="pg-fill"></div><div class="pg-label"></div></div>
			<div id="stage-cursor"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M5.5 3.2V20.6c0 .45.54.67.86.35l4.6-4.6a.5.5 0 0 1 .35-.15h6.75c.45 0 .67-.54.35-.86L6.35 2.85a.5.5 0 0 0-.85.35Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
			<div id="stage-black"></div>
		`
		doc.body.appendChild(ui)

		const el = {
			frame: doc.getElementById('stage-frame'),
			annotations: doc.getElementById('stage-annotations'),
			caption: doc.getElementById('stage-caption'),
			captionTitle: ui.querySelector('#stage-caption .cap-title'),
			captionSub: ui.querySelector('#stage-caption .cap-sub'),
			slide: doc.getElementById('stage-slide'),
			slideInner: ui.querySelector('#stage-slide .sl-inner'),
			watermark: doc.getElementById('stage-watermark'),
			sweep: doc.getElementById('stage-sweep'),
			progress: doc.getElementById('stage-progress'),
			progressFill: ui.querySelector('#stage-progress .pg-fill'),
			progressLabel: ui.querySelector('#stage-progress .pg-label'),
			cursor: doc.getElementById('stage-cursor'),
			black: doc.getElementById('stage-black'),
		}
		el.cursor.style.setProperty('--cursor-duration', `${CURSOR_DURATION}ms`)
		el.cursor.style.setProperty('--cursor-easing', CURSOR_EASING)

		// ---- cursor ----
		const pos = { x: -300, y: -300 }
		function move(o = {}) {
			pos.x = o.x ?? pos.x
			pos.y = o.y ?? pos.y
			if (o.duration) el.cursor.style.setProperty('--cursor-duration', `${o.duration}ms`)
			el.cursor.classList.remove('off')
			el.cursor.style.transform = `translate(${pos.x - 2}px, ${pos.y - 2}px)`
		}
		function ripple(scale = 1) {
			const r = doc.createElement('div')
			r.className = 'stage-ripple'
			r.style.left = `${pos.x + 11}px`
			r.style.top = `${pos.y + 11}px`
			r.style.transform = `scale(${scale})`
			ui.appendChild(r)
			r.addEventListener('animationend', () => r.remove())
		}

		// ---- camera (crop / zoom / pan) ----
		const cam = { zoom: 1, x: vw() / 2, y: vh() / 2, tx: 0, ty: 0 }
		function applyCamera(o = {}) {
			const zoom = o.zoom ?? cam.zoom
			const x = o.x ?? cam.x
			const y = o.y ?? cam.y
			const target = doc.getElementById('root')
			if (!target) return
			cam.zoom = zoom
			cam.x = x
			cam.y = y
			cam.tx = vw() / 2 - x * zoom
			cam.ty = vh() / 2 - y * zoom
			target.style.transformOrigin = '0 0'
			target.style.transition = o.duration ? `transform ${o.duration}ms ${o.easing || EASE}` : 'none'
			target.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${zoom})`
		}
		function camera(o = {}) {
			applyCamera({ duration: 900, ...o })
		}
		function cameraTo(o = {}) {
			const nodes = o.selector ? doc.querySelectorAll(o.selector) : []
			const node = nodes[o.nth ?? 0]
			if (!node) throw new Error(`cameraTo: no element matches ${o.selector}`)
			const r = node.getBoundingClientRect()
			const layoutW = r.width / cam.zoom
			const layoutH = r.height / cam.zoom
			const pad = o.pad ?? 0.12
			const maxZoom = o.maxZoom ?? 3
			const fit = Math.min((vw() * (1 - 2 * pad)) / layoutW, (vh() * (1 - 2 * pad)) / layoutH)
			const zoom = clamp(o.zoom ?? Math.min(fit, maxZoom), o.minZoom ?? 0.35, maxZoom)
			// undo the current transform to get the element's centre in page coords
			const cx = (r.left + r.width / 2 - cam.tx) / cam.zoom + (o.offsetX || 0)
			const cy = (r.top + r.height / 2 - cam.ty) / cam.zoom + (o.offsetY || 0)
			applyCamera({ zoom, x: cx, y: cy, duration: o.duration ?? 900, easing: o.easing })
		}
		function resetCamera(o = {}) {
			applyCamera({ zoom: o.zoom ?? 1, x: vw() / 2, y: vh() / 2, duration: o.duration ?? 900, easing: o.easing })
		}

		// ---- annotations ----
		const annotations = new Map()
		let annotSeq = 0
		function measure(target) {
			if (!target) return null
			const t = typeof target === 'string' ? { selector: target } : target
			if (t.rect) return t.rect
			if (!t.selector) return null
			const node = doc.querySelectorAll(t.selector)[t.nth ?? 0]
			if (!node) return null
			const r = node.getBoundingClientRect()
			return { x: r.left, y: r.top, w: r.width, h: r.height }
		}
		function placeLabel(label, rect, anchor) {
			const gap = 14
			const lw = label.offsetWidth
			const lh = label.offsetHeight
			let mode = anchor || 'auto'
			if (mode === 'auto') {
				mode = rect.x + rect.w + gap + lw + 8 < vw() ? 'right'
					: rect.x - gap - lw > 8 ? 'left'
						: rect.y + rect.h + gap + lh + 8 < vh() ? 'bottom' : 'top'
			}
			const styles = {
				right: { left: `${rect.x + rect.w + gap}px`, top: `${rect.y + rect.h / 2 - lh / 2}px` },
				left: { left: `${rect.x - gap - lw}px`, top: `${rect.y + rect.h / 2 - lh / 2}px` },
				bottom: { left: `${rect.x + rect.w / 2 - lw / 2}px`, top: `${rect.y + rect.h + gap}px` },
				top: { left: `${rect.x + rect.w / 2 - lw / 2}px`, top: `${rect.y - gap - lh}px` },
				inside: { left: `${rect.x + 12}px`, top: `${rect.y + rect.h - lh - 12}px` },
			}[mode] || { left: `${rect.x + rect.w + gap}px`, top: `${rect.y + rect.h / 2 - lh / 2}px` }
			label.style.left = styles.left
			label.style.top = styles.top
		}
		function annotate(o = {}) {
			const rect = measure(o)
			if (!rect) throw new Error(`annotate: no element matches ${o.selector ?? '(no target)'}`)
			const pad = o.padding ?? 8
			const id = `annot-${++annotSeq}`
			const node = doc.createElement('div')
			node.className = `stage-annot mode-${o.mode || 'outline'}`
			node.style.setProperty('--accent', o.accent || '#22d3ee')
			if (o.dim != null) node.style.setProperty('--dim', String(o.dim))
			node.style.borderRadius = `${o.radius ?? 10}px`
			let label = null
			if (o.label) {
				label = doc.createElement('div')
				label.className = 'stage-annot-label'
				label.textContent = o.label
				if (o.accent) label.style.setProperty('--accent', o.accent)
			}
			const paint = () => {
				const r = follow ? measure(o) : rect
				if (!r) return
				node.style.left = `${r.x - pad}px`
				node.style.top = `${r.y - pad}px`
				node.style.width = `${r.w + pad * 2}px`
				node.style.height = `${r.h + pad * 2}px`
				if (label) placeLabel(label, { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }, o.labelPosition)
			}
			const follow = o.follow !== false && !!o.selector
			el.annotations.appendChild(node)
			if (label) el.annotations.appendChild(label)
			paint()
			let raf = null
			if (follow) {
				let last = null
				const tick = () => {
					const r = measure(o)
					const key = r && `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`
					if (key && key !== last) { last = key; paint() }
					raf = requestAnimationFrame(tick)
				}
				raf = requestAnimationFrame(tick)
			}
			annotations.set(id, { nodes: [node, label].filter(Boolean), stop: () => raf && cancelAnimationFrame(raf) })
			if (o.duration !== 0) requestAnimationFrame(() => { node.classList.add('show'); label && label.classList.add('show') })
			return id
		}
		function removeAnnotation(id) {
			const entry = annotations.get(id)
			if (!entry) return
			entry.stop()
			entry.nodes.forEach((n) => {
				n.classList.remove('show')
				setTimeout(() => n.remove(), 400)
			})
			annotations.delete(id)
		}
		function clearAnnotations() {
			for (const id of [...annotations.keys()]) removeAnnotation(id)
		}

		// ---- slides ----
		const slideParts = (s) => {
			const parts = []
			if (s.logo) parts.push(['sl-item-logo', `<div class="sl-logo"><img src="${esc(s.logo)}" alt=""></div>`])
			if (s.kicker) parts.push(['sl-item-kicker', `<div class="sl-kicker">${esc(s.kicker)}</div>`])
			if (s.title) parts.push(['sl-item-title', `<div class="sl-title">${esc(s.title)}</div>`])
			if (s.version) parts.push(['sl-item-version', `<div class="sl-version">${esc(s.version)}</div>`])
			if (s.subtitle) parts.push(['sl-item-sub', `<div class="sl-sub">${esc(s.subtitle)}</div>`])
			if (s.bullets && s.bullets.length) {
				parts.push(['sl-item-bullets', `<ul class="sl-bullets">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`])
			}
			if (s.chips && s.chips.length) {
				parts.push(['sl-item-chips', `<div class="sl-chips">${s.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>`])
			}
			// The link defaults to a GitHub mark; pass `linkIcon: false` when it points
			// somewhere else (the docs), so the icon does not contradict the URL.
			if (s.link) {
				const icon = s.linkIcon === false ? '' : GITHUB_ICON
				parts.push(['sl-item-link', `<div class="sl-link">${icon}${esc(s.link)}</div>`])
			}
			return parts
		}
		function slide(o = {}, opts = {}) {
			const parts = []
			if (typeof o.html === 'string') parts.push(['sl-item-html', o.html])
			else {
				slideParts(o).forEach(([cls, html]) => parts.push([cls, html]))
			}
			el.slideInner.innerHTML = parts
				.map(([cls, html], i) => `<div class="sl-item ${cls}" style="--i: ${i}">${html}</div>`)
				.join('')
			el.slide.classList.toggle('swap', el.slide.classList.contains('show'))
			el.slide.classList.toggle('mode-panel', (o.mode || 'full') === 'panel')
			el.slide.classList.toggle('mode-full', (o.mode || 'full') === 'full')
			el.slide.classList.toggle('theme-light', o.theme === 'light')
			el.slide.classList.toggle('theme-brand', o.theme === 'brand')
			el.slide.classList.toggle('align-left', o.align === 'left')
			el.slide.classList.toggle('size-sm', o.size === 'sm')
			el.slide.style.background = o.background || ''
			if (o.scrim != null) el.slide.style.setProperty('--scrim', String(o.scrim))
			if (opts.instant) {
				el.slide.style.transition = 'none'
				el.slide.classList.add('show')
				void el.slide.offsetWidth
				el.slide.style.transition = ''
			} else {
				el.slide.classList.add('show')
			}
		}
		function hideSlide() {
			el.slide.classList.remove('show')
		}

		// ---- transitions ----
		/** Distance from the viewport edge to the delivery frame (0 when unframed). */
		function frameInsets() {
			if (!frameBox) return { x: 0, y: 0 }
			return { x: Math.max(0, (vw() - frameBox.w) / 2), y: Math.max(0, (vh() - frameBox.h) / 2) }
		}
		function originPx(origin) {
			if (origin && typeof origin === 'object') return { x: origin.x, y: origin.y }
			const px = (value, size) => (String(value).endsWith('%')
				? (parseFloat(value) / 100) * size
				: parseFloat(value))
			const parts = String(origin || '50% 50%').trim().split(/\s+/)
			return { x: px(parts[0], vw()), y: px(parts[1] ?? parts[0], vh()) }
		}
		// A circle transition is a huge round div scaled up from the origin point.
		// Transform animations are smooth and produce reliable frames everywhere.
		function circlePrepare(origin) {
			const { x, y } = originPx(origin)
			const radius = Math.hypot(Math.max(x, vw() - x), Math.max(y, vh() - y))
			const sweepEl = el.sweep
			sweepEl.style.left = `${x - radius}px`
			sweepEl.style.top = `${y - radius}px`
			sweepEl.style.width = `${radius * 2}px`
			sweepEl.style.height = `${radius * 2}px`
			sweepEl.style.borderRadius = '50%'
			sweepEl.style.transformOrigin = '50% 50%'
		}
		function circleClear() {
			for (const key of ['left', 'top', 'width', 'height', 'borderRadius', 'transformOrigin', 'transform']) {
				el.sweep.style[key] = ''
			}
		}
		function sweepHide() {
			const sweepEl = el.sweep
			sweepEl.style.visibility = 'hidden'
			sweepEl.style.opacity = '0'
			sweepEl.style.transform = 'none'
			circleClear()
		}

		async function sweep(o = {}) {
			const sweepEl = el.sweep
			const mode = o.mode || 'fade'
			const duration = o.duration ?? 600
			const easing = o.easing || EASE
			const direction = o.direction || 'left'
			const axis = direction === 'up' || direction === 'down' ? 'Y' : 'X'
			const from = direction === 'right' || direction === 'up' ? 101 : -101
			sweepEl.style.background = o.color || BG
			sweepEl.style.visibility = 'visible'
			sweepEl.style.opacity = '1'
			if (mode === 'wipe' || mode === 'slide') {
				sweepEl.style.transform = `translate${axis}(${from}%)`
				await anim(sweepEl,
					[{ transform: `translate${axis}(${from}%)` }, { transform: `translate${axis}(0%)` }],
					{ duration, easing },
					() => { sweepEl.style.transform = 'none' })
			} else if (mode === 'circle') {
				circlePrepare(o.origin)
				sweepEl.style.transform = 'scale(0)'
				await anim(sweepEl, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
					{ duration, easing },
					() => { sweepEl.style.transform = 'none' })
			} else {
				sweepEl.style.transform = 'none'
				sweepEl.style.opacity = '0'
				await anim(sweepEl, [{ opacity: 0 }, { opacity: 1 }], { duration, easing }, () => { sweepEl.style.opacity = '1' })
			}
		}

		async function reveal(o = {}) {
			const sweepEl = el.sweep
			const mode = o.mode || 'fade'
			const duration = o.duration ?? 600
			const easing = o.easing || EASE
			const direction = o.direction || 'left'
			const axis = direction === 'up' || direction === 'down' ? 'Y' : 'X'
			const from = direction === 'right' || direction === 'up' ? 101 : -101
			// the cover exits the opposite way it entered
			const to = -from
			if (mode === 'wipe' || mode === 'slide') {
				await anim(sweepEl, [{ transform: `translate${axis}(0%)` }, { transform: `translate${axis}(${to}%)` }],
					{ duration, easing }, sweepHide)
			} else if (mode === 'circle') {
				if (!sweepEl.style.width) circlePrepare(o.origin)
				await anim(sweepEl, [{ transform: 'scale(1)' }, { transform: 'scale(0)' }],
					{ duration, easing }, sweepHide)
			} else {
				await anim(sweepEl, [{ opacity: 1 }, { opacity: 0 }], { duration, easing }, sweepHide)
			}
		}

		// ---- misc ----
		let frameBox = null
		function background(color) {
			const c = color || BG
			doc.documentElement.style.background = c
			doc.body.style.background = c
			const root = doc.getElementById('root')
			if (root) root.style.background = c
		}
		function frame(o) {
			if (!o) {
				el.frame.classList.remove('on')
				el.frame.style.boxShadow = ''
				frameBox = null
				return
			}
			let width = o.width
			let height = o.height
			if (o.aspect) {
				const [aw, ah] = String(o.aspect).split(':').map(Number)
				const maxW = o.width || vw()
				const maxH = o.height || vh()
				if (maxW / maxH > aw / ah) width = Math.round(maxH * aw / ah), height = maxH
				else width = maxW, height = Math.round(maxW * ah / aw)
			}
			el.frame.style.width = `${width ?? vw()}px`
			el.frame.style.height = `${height ?? vh()}px`
			el.frame.style.borderRadius = `${o.radius ?? 0}px`
			el.frame.style.border = o.border || 'none'
			const spread = o.color || BG
			el.frame.style.boxShadow = `0 0 0 6000px ${spread}`
			el.frame.classList.add('on')
			frameBox = { w: width ?? vw(), h: height ?? vh() }
		}
		function watermark(o = {}) {
			if (o.show === false) { el.watermark.classList.remove('on'); return }
			const img = el.watermark.querySelector('img')
			const text = el.watermark.querySelector('span')
			if (o.src === null) img.style.display = 'none'
			else if (o.src) { img.style.display = ''; img.src = o.src }
			if (o.text != null) text.textContent = o.text
			const inset = o.inset ?? 28
			const fi = frameInsets()
			const sides = WATERMARK_POSITIONS[o.position || 'bottom-right']
			for (const key of ['left', 'right', 'top', 'bottom']) {
				const edge = key === 'left' || key === 'right' ? fi.x : fi.y
				el.watermark.style[key] = sides.includes(key) ? `${edge + inset}px` : ''
			}
			if (o.size) el.watermark.style.setProperty('--wm-size', `${o.size}px`)
			if (o.opacity != null) el.watermark.style.setProperty('--wm-opacity', String(o.opacity))
			el.watermark.classList.add('on')
		}
		function progress(o = {}) {
			if (o.show === false) { el.progress.classList.remove('show'); return }
			const fi = frameInsets()
			el.progress.style.left = `${fi.x}px`
			el.progress.style.right = `${fi.x}px`
			el.progress.style.bottom = `${fi.y}px`
			el.progress.style.setProperty('--bar-h', `${o.height ?? 4}px`)
			el.progressLabel.textContent = o.label || ''
			el.progress.classList.add('show')
			if (o.duration) {
				el.progressFill.style.transition = `width ${o.duration}ms linear`
				requestAnimationFrame(() => { el.progressFill.style.width = '100%' })
			} else if (o.value != null) {
				el.progressFill.style.transition = o.instant ? 'none' : 'width .6s linear'
				requestAnimationFrame(() => { el.progressFill.style.width = `${clamp(o.value, 0, 1) * 100}%` })
			}
		}
		function caption(o = {}) {
			const cfg = CAPTION_POSITIONS[o.position || 'bottom-left'] || CAPTION_POSITIONS['bottom-left']
			const fi = frameInsets()
			const edge = (value, extra) => (typeof value === 'number' ? `${value + extra}px` : value)
			el.caption.style.left = cfg.left == null ? '' : edge(cfg.left, fi.x)
			el.caption.style.right = cfg.right == null ? '' : edge(cfg.right, fi.x)
			el.caption.style.top = cfg.top == null ? '' : edge(cfg.top, fi.y)
			el.caption.style.bottom = cfg.bottom == null ? '' : edge(cfg.bottom, fi.y)
			el.caption.style.setProperty('--ox', cfg.originX || '0px')
			el.caption.style.setProperty('--oy', cfg.originY || '0px')
			el.caption.style.setProperty('--hide-x', cfg.hideX || '0px')
			el.caption.style.setProperty('--hide-y', cfg.hideY ?? '28px')
			if (o.accent) el.caption.style.setProperty('--accent', o.accent)
			if (o.width) el.caption.style.maxWidth = `${o.width}px`
			el.captionTitle.textContent = o.title ?? ''
			el.captionSub.textContent = o.sub ?? ''
			el.captionSub.style.display = o.sub ? '' : 'none'
			el.caption.classList.remove('show')
			void el.caption.offsetWidth // restart the transition
			el.caption.classList.add('show')
		}
		function fade(o = {}) {
			el.black.style.setProperty('--fade-duration', `${o.duration ?? 1100}ms`)
			el.black.classList.add('show')
		}
		function unfade(o = {}) {
			el.black.style.setProperty('--fade-duration', `${o.duration ?? 900}ms`)
			el.black.classList.remove('show')
		}
		function reset() {
			hideSlide()
			el.caption.classList.remove('show')
			clearAnnotations()
			sweepHide()
			el.progress.classList.remove('show')
			el.black.classList.remove('show')
			resetCamera({ duration: 0 })
		}

		window.__stage = {
			// cursor
			move,
			press(o) { el.cursor.classList.add('pressing'); ripple((o && o.scale) || 1) },
			release() { el.cursor.classList.remove('pressing') },
			cursor(o = {}) { el.cursor.classList.toggle('off', o.show === false) },
			// captions
			caption, hideCaption() { el.caption.classList.remove('show') },
			// slides
			slide, hideSlide,
			// transitions
			sweep, reveal,
			// camera
			camera, cameraTo, resetCamera, cameraState: () => ({ ...cam }),
			// annotations
			annotate, removeAnnotation, clearAnnotations,
			// chrome
			frame, watermark, progress, background, fade, unfade, reset,
		}

		if (init.frame) frame(init.frame)
		if (init.opening) slide(init.opening, { instant: true })
	}

	// addInitScript runs at document start, before <body> exists.
	const boot = () => {
		try {
			mount()
		} catch (err) {
			console.error('[stage] mount failed:', err)
		}
	}
	if (doc.body) boot()
	else doc.addEventListener('DOMContentLoaded', boot, { once: true })
})()
