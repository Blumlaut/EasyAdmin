/**
 * Director: the Node-side action API a video script is written against.
 *
 * A video's `run(director)` receives an instance of this class. Every method
 * wraps the Playwright page and the injected stage (kit/stage.js):
 *
 *   v.click('[data-nav-id="players"]')      real mouse events on the page
 *   v.caption('Players', 'Live player management')
 *   v.zoomTo('.list-item-interactive', { nth: 0, hold: 2000 })
 *   v.annotate('.quick-action-btn', { label: 'One click', mode: 'spotlight' })
 *   v.cut({ mode: 'circle' }, () => v.slide({ title: 'Chapter 2' }))
 *
 * Anything the Director does not cover is still reachable:
 *   v.page     the raw Playwright page (any Playwright API)
 *   v.stage.*  any stage method by name, forwarded as-is
 *   v.eval(fn, arg)  run a function inside the page
 *
 * Timing is literally what ends up in the video: an awaited `v.wait(2000)`
 * is 2 seconds of footage (the encoder rebuilds the timeline from real frame
 * timestamps), so sleeps are the editing timeline.
 */

import { setTimeout as delay } from 'node:timers/promises'

const isPoint = (t) => t && typeof t === 'object'
	&& Number.isFinite(t.x) && Number.isFinite(t.y) && t.selector === undefined

const targetToSelector = (target) => (typeof target === 'string' ? target : target?.selector)

export class Director {
	constructor({ page, background = '#0f172a', cursor = {}, mark = () => {}, log = console.log }) {
		this.page = page
		this.background = background
		this.log = log
		this.markFn = mark
		// The cursor is drawn, not the real pointer: wait for its transition to
		// finish before pressing. `cursor.duration` is the same value the stage
		// animates with, so video scripts tune pace in one place.
		this.settle = Math.max(120, (cursor.duration ?? 550) + 60)
		// Forward any stage method by name: v.stage.slide({...}), v.stage.sweep({...}),
		// v.stage.customThing(...). No wiring needed when the stage grows a method.
		this.stage = new Proxy({}, {
			get: (_, name) => (arg) => this.call(name, arg),
		})
	}

	// ---------------------------------------------------------------- plumbing

	/** Call a method on the injected stage (window.__stage). */
	async call(method, arg) {
		return this.page.evaluate(([m, a]) => window.__stage[m](a), [method, arg])
	}

	/** Run a function inside the page (must be self-contained, arg is serialized). */
	async eval(fn, arg) {
		return this.page.evaluate(fn, arg)
	}

	/** Pause. This is video time, not just a test wait. */
	async wait(ms) {
		if (ms > 0) await delay(ms)
		return this
	}

	/** Alias for wait(), reads better in video scripts. */
	hold(ms) {
		return this.wait(ms)
	}

	/** Write a named marker into markers.jsonl (useful for cutting/editing later). */
	mark(label) {
		this.markFn(label)
		return this
	}

	// ------------------------------------------------------------ page targets

	locator(target, { nth = 0 } = {}) {
		const selector = targetToSelector(target)
		if (!selector) throw new Error('expected a selector or { selector, nth }')
		const loc = this.page.locator(selector)
		if (nth === -1) return loc.last()
		return nth === 0 ? loc.first() : loc.nth(nth)
	}

	/** Wait for a selector to reach a state ('visible' by default). */
	async waitFor(selector, { state = 'visible', timeout = 15000 } = {}) {
		await this.page.locator(selector).first().waitFor({ state, timeout })
		return this
	}

	/** Resolve a target to viewport coordinates and move the cursor there. */
	async point(target, opts = {}) {
		const { settle = this.settle, steps = 8, timeout = 10000 } = opts
		if (isPoint(target)) {
			await this.moveCursor(target.x, target.y, { steps, settle })
			return { x: target.x, y: target.y }
		}
		const loc = this.locator(target, opts)
		await loc.waitFor({ state: 'visible', timeout })
		let box = await this.stableBox(loc)
		if (!box) throw new Error(`no bounding box for ${targetToSelector(target)}`)
		await this.moveCursor(box.x + box.width / 2, box.y + box.height / 2, { steps, settle })

		// Elements can still be moving after they are "visible" (a nav dropdown
		// unfolding, a page re-flowing). Waiting for a stable box first covers
		// most of it; if it moved anyway, follow it so the click lands on target.
		for (let attempt = 0; attempt < 2; attempt++) {
			const now = await loc.boundingBox()
			if (!now) break
			if (Math.abs(now.x - box.x) < 2 && Math.abs(now.y - box.y) < 2) break
			box = now
			await this.moveCursor(box.x + box.width / 2, box.y + box.height / 2, { steps: 4, settle: 220 })
		}
		return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
	}

	/**
	 * An element's box once it stops moving: two identical samples in a row.
	 * A single measurement can land mid-animation and put the cursor on the
	 * wrong item, so the click misses or hits its neighbour.
	 */
	async stableBox(loc, { interval = 70, maxWait = 2500 } = {}) {
		const deadline = Date.now() + maxWait
		let prev = null
		do {
			const box = await loc.boundingBox()
			if (box && prev && Math.abs(box.x - prev.x) < 0.5 && Math.abs(box.y - prev.y) < 0.5) return box
			prev = box
			await delay(interval)
		} while (Date.now() < deadline)
		return prev
	}

	async moveCursor(x, y, { steps = 8, settle = this.settle } = {}) {
		await this.call('move', { x, y })
		await this.page.mouse.move(x, y, { steps })
		await this.wait(settle)
		return { x, y }
	}

	/** Move the cursor without clicking. */
	async move(target, opts = {}) {
		return this.point(target, opts)
	}

	async click(target, opts = {}) {
		const { after = 700, pressMs = 110, button = 'left', ...pointOpts } = opts
		await this.point(target, pointOpts)
		await this.call('press')
		await this.page.mouse.down({ button })
		await this.wait(pressMs)
		await this.page.mouse.up({ button })
		await this.call('release')
		await this.wait(after)
		return this
	}

	/** Click without moving the synthetic cursor (for clicks under overlays). */
	async clickRaw(target, opts = {}) {
		const { after = 700, clickOpts = {} } = opts
		await this.locator(target, opts).click(clickOpts)
		await this.wait(after)
		return this
	}

	async hover(target, opts = {}) {
		const { after = 600, ...pointOpts } = opts
		await this.point(target, pointOpts)
		await this.wait(after)
		return this
	}

	/** Click a field and type into it. */
	async type(target, text, opts = {}) {
		const { delay: keyDelay = 60, after = 400, clear = false, focusAfter = 250 } = opts
		await this.click(target, { after: focusAfter, ...opts })
		if (clear) await this.page.keyboard.press('Control+A')
		await this.page.keyboard.type(text, { delay: keyDelay })
		await this.wait(after)
		return this
	}

	/** Set a field's value directly (no keystroke animation). */
	async fill(target, text, opts = {}) {
		const { after = 400 } = opts
		await this.locator(target, opts).fill(text)
		await this.wait(after)
		return this
	}

	async press(key, { after = 400 } = {}) {
		await this.page.keyboard.press(key)
		await this.wait(after)
		return this
	}

	/** Move the cursor over a target and scroll the wheel there. */
	async scroll(target, { dx = 0, dy = 0, after = 500, settle = 200 } = {}) {
		if (target) await this.point(target, { settle })
		await this.page.mouse.wheel(dx, dy)
		await this.wait(after)
		return this
	}

	async scrollTo(target, { after = 400, settle = 0 } = {}) {
		if (settle) await this.point(target, { settle })
		await this.locator(target).scrollIntoViewIfNeeded()
		await this.wait(after)
		return this
	}

	// ------------------------------------------------------------- navigation

	/** Expand a nav dropdown (e.g. "server", "statistics") if it is collapsed. */
	async openGroup(group, { after = 400 } = {}) {
		const grp = this.page.locator(`[data-nav-id="${group}"]`).first()
		if (await grp.locator('.nav-dropdown-chevron-open').count() === 0) {
			await this.click(`[data-nav-id="${group}"]`, { nth: 0, after })
		}
		return this
	}

	/** Navigate by nav id. Parent dropdowns share an id with a child, so the leaf wins. */
	async nav(id, { group, after = 900, ...clickOpts } = {}) {
		if (group) await this.openGroup(group, { after: 400 })
		await this.click(`[data-nav-id="${id}"]`, { nth: -1, after, ...clickOpts })
		return this
	}

	// ----------------------------------------------------------------- camera

	/** Crop/zoom to an element (or {x,y} page point): a "crop level" change. */
	async zoomTo(target, { nth = 0, zoom, pad, duration = 900, hold = 0, maxZoom, offsetY } = {}) {
		if (isPoint(target)) {
			await this.call('camera', { zoom: zoom ?? 1.6, x: target.x, y: target.y, duration })
		} else {
			await this.call('cameraTo', {
				selector: targetToSelector(target), nth, zoom, pad, duration, maxZoom, offsetY,
			})
		}
		if (hold) await this.wait(hold)
		return this
	}

	/** Center a page point (or the viewport) at a given zoom. */
	async camera({ zoom, x, y, duration = 900, hold = 0 } = {}) {
		await this.call('camera', { zoom, x, y, duration })
		if (hold) await this.wait(hold)
		return this
	}

	async resetCamera({ duration = 900, hold = 0 } = {}) {
		await this.call('resetCamera', { duration })
		if (hold) await this.wait(hold)
		return this
	}

	// ---------------------------------------------------------------- overlay

	/** Show a caption/lower third for `hold` ms, then slide it out. */
	async caption(title, sub, opts = {}) {
		if (typeof title === 'object' && title !== null) {
			opts = title
			;({ title, sub = opts.sub } = opts)
		} else if (typeof sub === 'object' && sub !== null) {
			opts = { ...sub }
			sub = opts.sub
		}
		const { hold = 2400, gap = 520 } = opts
		await this.captionShow({ ...opts, title, sub })
		await this.wait(hold)
		await this.captionHide({ gap })
		return this
	}

	async captionShow(o = {}) {
		await this.call('caption', {
			title: o.title, sub: o.sub, position: o.position, accent: o.accent, width: o.width,
		})
		return this
	}

	async captionHide({ gap = 520 } = {}) {
		await this.call('hideCaption')
		await this.wait(gap)
		return this
	}

	/** Show a presentation slide, hold it, then fade it out. */
	async slide(o = {}, { hold = 3000, gap = 700, hide = true } = {}) {
		await this.call('slide', o)
		await this.wait(hold)
		if (hide) {
			await this.call('hideSlide')
			await this.wait(gap)
		}
		return this
	}

	async hideSlide({ gap = 700 } = {}) {
		await this.call('hideSlide')
		await this.wait(gap)
		return this
	}

	/** Highlight or point at an element. Returns { id, hide() }. */
	async annotate(target, opts = {}) {
		const base = typeof target === 'string' ? { selector: target }
			: isPoint(target) ? { rect: target.rect || { x: target.x, y: target.y, w: 0, h: 0 } }
				: { ...target }
		const id = await this.call('annotate', { ...base, ...opts })
		return {
			id,
			hide: async ({ gap = 0 } = {}) => {
				await this.call('removeAnnotation', id)
				if (gap) await this.wait(gap)
			},
		}
	}

	/** Annotate with a text label: a callout box next to the element. */
	callout(target, label, opts = {}) {
		return this.annotate(target, { label, ...opts })
	}

	spotlight(target, opts = {}) {
		return this.annotate(target, { mode: 'spotlight', ...opts })
	}

	outline(target, opts = {}) {
		return this.annotate(target, { mode: 'outline', ...opts })
	}

	pulse(target, opts = {}) {
		return this.annotate(target, { mode: 'pulse', ...opts })
	}

	/** One transition. mode: fade | dip | wipe | slide | circle. */
	async transition(o = {}) {
		await this.call('sweep', { color: this.background, ...o })
		return this
	}

	/**
	 * Cover the screen, run fn (the scene change), then uncover.
	 *
	 * Anything awaited inside fn is invisible dead time. Keep it to the state
	 * change itself (short action waits), not to holds. `hold` adds a deliberate
	 * beat on the cover.
	 */
	async cut(opts, fn) {
		if (typeof opts === 'function') {
			fn = opts
			opts = {}
		}
		const mode = opts.mode || 'fade'
		const duration = opts.duration ?? 600
		await this.call('sweep', {
			color: opts.color || this.background, mode, duration, direction: opts.direction, origin: opts.origin,
		})
		const result = await fn()
		if (opts.hold) await this.wait(opts.hold)
		await this.call('reveal', {
			mode: opts.revealMode || mode,
			direction: opts.revealDirection || opts.direction,
			origin: opts.origin,
			duration: opts.revealDuration ?? duration,
		})
		return result
	}

	async frame(o) {
		await this.call('frame', o)
		return this
	}

	async watermark(o) {
		await this.call('watermark', o)
		return this
	}

	async progress(o) {
		await this.call('progress', o)
		return this
	}

	async background(color) {
		this.background = color
		await this.call('background', color)
		return this
	}

	async fade(o = {}) {
		await this.call('fade', o)
		return this
	}

	async unfade(o = {}) {
		await this.call('unfade', o)
		return this
	}

	cursor(show) {
		return this.call('cursor', { show })
	}

	// ------------------------------------------------------------- resilience

	/**
	 * Run a step in isolation: a marker plus a try/catch, so one broken
	 * selector degrades to a missing beat instead of a dead recording.
	 */
	async section(name, fn) {
		this.mark(name)
		try {
			return await fn()
		} catch (err) {
			this.log(`  [skip] ${name}: ${err.message}`)
			return null
		}
	}
}
