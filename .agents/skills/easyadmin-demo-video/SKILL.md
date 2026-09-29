---
name: easyadmin-demo-video
description: >
  Write and build EasyAdmin demo/marketing videos with the scripts/demo-video kit.
  Covers video scripts, the Director action API (cursor, clicks, navigation, camera
  zooms/crops, captions, slides, transitions, spotlights), the browser-side stage
  overlay, delivery frames (square/vertical), and the record/encode pipeline.
  Use when creating or editing a video, changing overlay behaviour, or when asked
  for a demo/marketing video of the NUI.
---

# EasyAdmin demo videos

`scripts/demo-video/` is a small video kit. A **video** is one file in
`scripts/demo-video/videos/`; everything else (dev server, browser, overlay
graphics, native frame capture, h264 encoding) is already built.

**Read [`scripts/demo-video/README.md`](../../../scripts/demo-video/README.md)
before writing a video: it is the full API reference.** The two existing
videos (`videos/easyadmin-8.0.mjs`, `videos/social-teaser.mjs`) are the best
starting points: copy one and change it.

## Mental model

- Frames come from the browser's compositor over CDP; the encoder rebuilds an
  exact constant-fps timeline from capture timestamps. **No interpolation.**
- Therefore **wall-clock time is video time**: `await v.hold(1500)` is 1.5
  seconds of footage. The script *is* the edit.
- A static page produces no frames, so a hold after the last visible change
  (the black tail after a fade) is recorded as a trailing hold by the capture.
- Two layers to program:
  - **Director** (`v` in `run(v)`, Node, `kit/director.mjs`): Playwright
    actions + overlay control.
  - **Stage** (`window.__stage`, browser, `kit/stage.js`): the overlay runtime:
    cursor, captions, slides, transitions, camera, annotations, delivery frame.
    The Director forwards to it (`v.stage.<method>(arg)`), so a new overlay
    feature is one method in `kit/stage.js` and is instantly callable.

## Minimal video

```js
// scripts/demo-video/videos/my-video.mjs
import { defineVideo } from '../kit/video.mjs'

export default defineVideo({
	name: 'my-video',
	viewport: { width: 1920, height: 1080 },
	background: '#0f172a',
	opening: { logo: 'logo.png', title: 'EasyAdmin', version: '8.0', subtitle: 'Modern moderation for FiveM' },
	async run(v) {
		await v.hold(4200)
		await v.hideSlide()
		await v.nav('players')                                    // data-nav-id
		await v.caption('Players', 'Live player management')
		await v.zoomTo('.list-item-interactive', { nth: 0, zoom: 1.5, hold: 2000 })
		await v.resetCamera()
		await v.slide({ title: 'EasyAdmin 8.0', link: 'github.com/Blumlaut/EasyAdmin' }, { hold: 4000 })
		await v.fade()
		await v.hold(1200)
	},
})
```

```sh
npm run demo:video -- my-video          # record + encode
npm run demo:video -- my-video --keep-frames   # keep out/frames/ while iterating
node scripts/demo-video/record.mjs my-video    # record only (fast)
```

Wrap each beat in `v.section(name, fn)`: one bad selector then degrades to a
missing beat instead of killing the recording.

## Pacing

- `cursor: { duration: 380 }` is the pace knob: the drawn cursor takes that
  long to reach a target and **every click waits for it**.
- Every hold must be reading time or animation time. Never hold so the cursor
  can travel, and never hold "just in case".
- `warmPages: ['players', 'map', ...]` visits each page on the throwaway warm-up
  page first. A dev server compiles a route on first request, so without this a
  beat films a loading skeleton (the map looks broken until its tiles are warm).
- `v.waitFor(selector)` before a caption keeps the caption off a page that is
  still filling in. Waiting is video time, so warm the page instead where you can.
- Reference points: a caption wants 1.2-1.5 s of hold, an instruction slide that
  has to be read wants 6 s or more, and a feature tour should average a new beat
  every 3-6 s.
- Clicks measure a **stable** box and follow the element if it moves while the
  cursor travels, so `{ after: 250 }` is enough after a nav click, even for a
  dropdown that unfolds.

## Presentation videos (instruction slides)

For a guide made of slides rather than a walkthrough
(`videos/easyadmin-8.0-upgrade.mjs`):

- `await v.cursor(false)` while slides are up. A cursor floating over a slide
  reads as a ghost.
- Show the first slide, then swap content in place with
  `v.slide(html, { hold, hide: false })`. Hiding between slides shows the app
  for a second and costs ~3 s of unreadable transition each time.
- Show a change as two cards, REMOVE and ADD, in different colours. Never one
  list with mixed inline colours: the reader cannot tell what to delete.
- Use one cover style; mixed wipes and circles look accidental.
- `fade()`/`unfade()` and showing a slide are both 700 ms transitions, so a dip
  to black around a slide swap lifts the cover onto the app while the new slide
  is still fading in: half a second of the page you were already on, then the
  slide. To replace the app *with* a slide, skip the cover and let the slide's
  own fade be the transition. Cover only when the thing underneath is what you
  want revealed (e.g. `hideSlide()` to get back to the app).
- `v.fade({ duration: 700 })` / `v.unfade({ duration: 700 })` take
  **milliseconds**, and they return immediately, so hold ~750 ms after each.
- Build the slide body as one HTML string (`slide({ html })`) when you need a
  layout the built-in slide parts do not cover.
- `link` carries a GitHub mark. Pass `linkIcon: false` when it points at the docs,
  and write the closing line to the viewer, not about the documentation: the
  person watching has just done the upgrade and wants to know where to go if a
  step failed.

## Common asks → API

| Want | Use |
|---|---|
| Crop/zoom to a detail | `v.zoomTo(target, { nth, zoom | pad, hold })`, `v.resetCamera()` |
| Square/vertical/social cut | `frame: { width, height, radius }` or `{ aspect: '4:5' }` in the video config (record at any viewport) |
| Text over the UI | `v.caption(title, sub, { position, hold })`, `v.captionShow/captionHide` |
| Presentation cards | `v.slide({ kicker, title, version, subtitle, bullets, chips, link, linkIcon, theme, size })` |
| Instruction slide | `v.slide({ html: '<div style="…">…</div>' }, { hold: 6500, hide: false })` |
| Scene change | `v.cut({ mode: 'fade'|'wipe'|'circle', duration }, async () => { await v.nav(...) })` |
| Point at something | `v.callout(sel, 'Label', { mode: 'spotlight'|'outline'|'pulse' })`, `v.spotlight/outline/pulse(sel)` |
| Branding / progress | `v.watermark({ src, text })`, `v.progress({ duration })` |
| Anything else | `v.stage.<method>(arg)`, `v.eval(fn, arg)`, `v.page` (raw Playwright) |

## Rules

- **Never rebuild the rendering pipeline** (server boot, capture, encode) inside
  a video script. Add a video, or extend `kit/stage.js` / `kit/director.mjs`.
- Covered time is invisible: inside `v.cut(fn)` only do the state change with
  short action waits (`{ after: 250 }`); holds go outside the cut.
- Overlay CSS must stay CEF-safe: no `backdrop-filter`, no hardcoded viewport
  pixels: use transforms, opacity and solid colours.
- Never invent selectors: check the NUI source (`data-nav-id`, `aria-label`,
  `.list-item-interactive`, …) or reuse what an existing video already clicks.
  `nav('dashboard')` does not exist: the dashboard is the landing page.
- Inline styles inside HTML strings must not contain a double quote:
  `style="font: ... 'DejaVu Sans Mono' ..."` ends the attribute early and
  silently drops the rest (this is how `white-space: pre` gets lost and every
  code card collapses onto one line).
- **Humans must watch the encoded mp4.** Crops, timing and overlays cannot be
  verified by reading code. Say so when handing the change over, and list the
  exact build command plus which beats to check.
