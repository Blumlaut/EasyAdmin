# Demo video kit

Records animated demo videos of the EasyAdmin NUI for the README, docs and
social. No FiveM server is needed: the walkthrough runs against the browser mock
environment (`?dev`).

Videos are plain scripts: you describe what happens (navigate, click, zoom,
caption, transition, slide) and the kit handles the dev server, the browser,
the overlay graphics, native frame capture and encoding. Writing a new video
means writing one file in [`videos/`](videos). The rendering pipeline is
already done.

```sh
npm run demo:video                    # build videos/easyadmin-8.0.mjs
npm run demo:video -- social-teaser   # build another video by name
npm run demo:video -- --list          # list every video
```

Requirements (unchanged from the screenshot script): `playwright` + a Chromium
binary, and `ffmpeg` on `PATH`:

```sh
npm run install:all
npm i -D playwright && npx playwright install chromium   # or set EA_CHROMIUM_PATH
```

Pass `--url http://127.0.0.1:5199` to reuse an already-running dev server,
`--keep-frames` to keep `out/frames/` for inspection or re-encoding.

The first run of a cold dev server pre-bundles dependencies (Vite) before it can
serve the app. The kit does that on a throwaway page *before* recording, so the
recorded load, and the intro that plays during it, starts immediately instead of
timing out.

## How it works

Frames are captured natively: the browser sends every compositor frame it
produces (up to 60 fps) over CDP (`Page.startScreencast`) as a JPEG with a
capture timestamp. Static stretches produce no frames at all, so the encoder
rebuilds an exact constant-60 fps timeline by repeating each frame for as long
as the next one takes to arrive. **No interpolation, ever**: the video shows
exactly what the page rendered.

That means: **wall-clock time is video time.** Every `await v.hold(1500)` is
1.5 seconds of footage. The video script *is* the edit.

A static page produces no frames, so a hold at the very end of a video (after a
`v.fade()`, say) has nothing to extend it. The capture records how long it stayed
static after the last frame and the encoder adds that as a trailing hold, so the
video ends when the recording ended instead of the instant it went black.

## Your first video

```js
// videos/my-video.mjs
import { defineVideo } from '../kit/video.mjs'

export default defineVideo({
	name: 'my-video',                                  // output: out/my-video.mp4
	viewport: { width: 1920, height: 1080 },           // recording resolution
	background: '#0f172a',                             // backdrop + transition colour
	frame: null,                                       // or { width: 1080, height: 1080, radius: 40 }

	opening: {                                         // shown in the first captured frame
		logo: 'logo.png',
		title: 'EasyAdmin',
		version: '8.0',
		subtitle: 'Modern moderation for FiveM',
	},

	async run(v) {
		await v.hold(4200)                             // let the intro play
		await v.hideSlide()
		await v.click('button[aria-label="Maximize window"]')
		await v.nav('players')                         // data-nav-id navigation
		await v.caption('Players', 'Live player management')
		await v.zoomTo('.list-item-interactive', { nth: 0, zoom: 1.5, hold: 2000 })
		await v.resetCamera()
		await v.slide({ title: 'EasyAdmin 8.0', link: 'github.com/Blumlaut/EasyAdmin' }, { hold: 4000 })
		await v.fade()                                 // fade to black
		await v.hold(1200)
	},
})
```

```sh
npm run demo:video -- my-video
```

`run(v)` receives a **Director**, the Node-side action API. It can reach
everything, including the raw Playwright page, so nothing is off limits.

## Video settings

| Field | Default | Purpose |
|---|---|---|
| `name` | required | Output name and marker label (`out/<name>.mp4`) |
| `run(v)` | required | The walkthrough |
| `output` | `<name>.mp4` | Output file name, relative to `--out` (e.g. `easyadmin-8.0-demo.mp4`) |
| `url` | `?dev` | Page to open on the dev server (`?dev` boots the mock FiveM env) |
| `viewport` | `1920x1080` | Recording resolution. Any aspect ratio |
| `fps` | `60` | Playback frame rate of the encoded video |
| `background` | `#0f172a` | Backdrop behind the NUI, and the default transition colour |
| `frame` | `null` | Delivery-frame mask, e.g. `{ width: 1080, height: 1080, radius: 40 }` or `{ aspect: '4:5', radius: 24 }` |
| `opening` | `null` | Slide rendered in the very first captured frame (no white flash) |
| `cursor` | `{ duration: 550 }` | Synthetic cursor travel time (ms). Every click waits for it, so this sets the pace of the whole video |
| `warmPages` | `[]` | Nav ids to visit on the throwaway warm-up page before recording. A dev server compiles a route's modules on first request, so without this the first visit to a page happens **in the video**, as a loading skeleton |
| `ready` | `.ea-window` | Selector that must be visible before `run()` starts (`false` to skip) |
| `readyTimeout` | `120000` | How long to wait for `ready`: a cold dev server pre-bundles dependencies before it serves the app |
| `settle` | `1200` | Extra time after `ready`, so late mock data settles |
| `encode` | see below | ffmpeg options: `crf`, `preset`, `fadeIn`, `fadeOut`, `scale`, `audio`, `audioFade` |
| `finish(v)` | none | Optional hook after `run()` (last fade, hold) |
| `onError(v, err)` | none | Optional hook when `run()` throws; the recording still encodes |

## Director API (`run(v)`)

Everything returns a promise and is awaited in real time. Targets are a CSS
selector, `{ selector, nth }` (`nth: -1` = last match) or a `{ x, y }` page
point.

### Timing & control

| Call | Does |
|---|---|
| `v.wait(ms)` / `v.hold(ms)` | Pause. This is video time |
| `v.mark(label)` | Write a named marker (printed with timestamps at encode time) |
| `v.section(name, fn)` | Run a step in isolation: one marker + try/catch, so a broken selector degrades to a missing beat instead of a dead recording |
| `v.page` | The raw Playwright page: any Playwright API |
| `v.eval(fn, arg)` | Run a function inside the page |
| `v.stage.<method>(arg)` | Call any stage method by name (see below) |

### Cursor & input

| Call | Options |
|---|---|
| `v.click(target)` | `nth`, `settle` (cursor travel), `pressMs`, `after`, `button` |

Before pressing, the Director waits for the target's box to stop moving and
follows it if it shifts while the cursor travels. Elements that are "visible"
mid-animation (a nav dropdown unfolding) would otherwise be measured too early
and the click would land on the item next to them.
| `v.move(target)` / `v.hover(target)` | `nth`, `settle`, `after` |
| `v.type(target, text)` | `delay`, `clear`, `after` |
| `v.fill(target, text)` | sets the value directly, no keystrokes |
| `v.press('Escape')` | keyboard |
| `v.scroll(target, { dy })` | wheel at the target |
| `v.scrollTo(target)` | scroll an element into view |

### Navigation (NUI specifics)

| Call | Does |
|---|---|
| `v.nav(id, { group, after })` | Click `[data-nav-id="id"]`, expanding `group` first if collapsed |
| `v.openGroup(group)` | Expand a nav dropdown (`server`, `statistics`, …) |

### Overlay

| Call | Does |
|---|---|
| `v.caption(title, sub, opts)` | Show, hold (`hold`, default 2400 ms), slide out (`gap`) |
| `v.captionShow(opts)` / `v.captionHide()` | Keep a caption up across other actions |
| `v.slide(opts, { hold, gap })` | Presentation slide: show, hold, fade out |
| `v.hideSlide()` | Hide the current slide |
| `v.annotate(target, opts)` → `{ id, hide() }` | Spotlight / outline / pulse + optional label |
| `v.callout(target, label, opts)` | Shorthand for `annotate` with a label |
| `v.spotlight(t)` / `v.outline(t)` / `v.pulse(t)` | Shorthand modes |
| `v.transition(opts)` | Cover the screen (one half of a cut) |
| `v.cut(opts, fn)` | Cover → `fn()` → uncover (see below) |
| `v.frame(opts)` | The delivery-frame mask |
| `v.watermark(opts)` | Corner logo/text watermark |
| `v.progress(opts)` | Bottom progress bar (`value` or `duration`) |
| `v.fade(opts)` / `v.unfade(opts)` | Fade to black / back |
| `v.background(colour)` | Change the backdrop |
| `v.cursor(visible)` | Show/hide the synthetic cursor (for pure presentation scenes) |

## Stage API (browser overlay)

`window.__stage` is the overlay runtime injected into the page: the animated
cursor, captions, slides, transitions, the camera, annotations, the delivery
frame, watermark and progress bar. The Director forwards to it, but it is fully
usable on its own: `v.stage.anything(arg)` and `v.eval(() => window.__stage.anything(arg))`
work for anything not wrapped above. **Adding a new overlay feature means adding
one method to [`kit/stage.js`](kit/stage.js). It is immediately callable from
video scripts without touching the Director.**

| Method | Options |
|---|---|
| `move({ x, y, duration })` | Animate the cursor |
| `press()` / `release()` | Click pulse + ripple |
| `cursor({ show })` | Toggle the cursor |
| `caption({ title, sub, position, accent, width })` | `position`: `bottom-left` (default), `bottom-center`, `bottom-right`, `top-left`, `top-center`, `center` |
| `hideCaption()` | |
| `slide({ logo, kicker, title, version, subtitle, bullets, chips, link, linkIcon, theme, mode, align, size, background, html })` | `theme`: `dark` (default), `light`, `brand`. `mode`: `full` (default) or `panel`. `size: 'sm'` for outro-style cards. `html` is a raw-HTML escape hatch. `link` gets a GitHub mark unless `linkIcon: false` |
| `hideSlide()` | |
| `sweep({ mode, color, duration, direction, origin })` | Cover: `mode` = `fade`, `wipe`, `slide`, `circle`; `direction` = `left` (default), `right`, `up`, `down` |
| `reveal({ mode, duration, direction, origin })` | Uncover; the cover exits opposite to how it entered |
| `camera({ zoom, x, y, duration })` | Zoom/pan crop. `x`/`y` is the page point to centre |
| `cameraTo({ selector, nth, zoom, pad, duration, maxZoom, offsetY })` | Fit/focus an element (`zoom` overrides the computed fit) |
| `resetCamera({ duration })` | Back to 1:1, centred |
| `cameraState()` | The current camera state |
| `annotate({ selector, nth, rect, label, mode, dim, padding, radius, accent, labelPosition, follow })` → id | `mode`: `outline` (default), `spotlight` (dims the rest), `pulse`. `follow` re-measures the element every frame while the camera moves |
| `removeAnnotation(id)` / `clearAnnotations()` | |
| `frame({ width, height, aspect, radius, color, border })` | Masks everything outside the frame: the delivery crop |
| `watermark({ src, text, position, size, opacity, inset })` | |
| `progress({ value, duration, label, height, show })` | |
| `background(colour)` | |
| `fade({ duration })` / `unfade({ duration })` | |
| `reset()` | Clear slides, captions, annotations, transitions, camera |

## Recipes

### Pacing

```js
cursor: { duration: 380 },           // faster cursor, every click waits for it
warmPages: ['players', 'map', 'reports', 'settings'],   // no first-load skeletons
```

Inside `run()`, a hold is reading time or animation time, never "wait for
something". Use `v.waitFor(selector)` when a page needs to fill in, and keep it
out of the video by visiting that page in `warmPages`. As a rule of thumb, a
caption wants 1.2-1.5 s of hold, and an instruction slide that has to be read
wants 6 s or more.

### Crop levels: zoom into parts of the UI

```js
await v.zoomTo('.dashboard-card-sm', { nth: 1, pad: 0.15 })   // fit the element
await v.zoomTo('.list-item-interactive', { nth: 0, zoom: 1.5 }) // fixed zoom, centred
await v.callout('.quick-action-btn', 'One-click actions', { mode: 'pulse' })
await v.resetCamera()
```

`pad` is the share of the viewport left as margin when fitting (default `0.12`);
`zoom` overrides the computed fit (clamped to `minZoom` 0.35 / `maxZoom` 3).
Camera moves are CSS transforms on `#root`, so they are smooth and capture
cleanly: no re-recording needed for a second crop.

### Square / vertical delivery

Record at any viewport, then mask to the delivery format:

```js
viewport: { width: 1200, height: 1200 },
frame: { width: 1080, height: 1080, radius: 44 },
```

Everything outside the frame is painted with `background`. Captions, watermark
and the progress bar automatically inset to sit inside the frame.

### Scene transitions

```js
await v.cut({ mode: 'circle', duration: 550 }, async () => {
	await v.nav('players', { after: 250 })   // only the state change
})
await v.transition({ mode: 'wipe', direction: 'right' })  // cover only
```

> **Covered time is invisible time.** Anything you `await` inside a `cut`'s
> callback happens behind the cover. Keep it to the state change (short action
> waits), never holds. Use `cut({ ..., hold: 400 })` for a deliberate beat.
> [`videos/social-teaser.mjs`](videos/social-teaser.mjs) shows the pattern.

A full-screen slide does not need a sweep at all: its own fade-in is the
transition.

### Escape hatch

```js
await v.eval(() => window.__stage.watermark({ text: 'custom' }))
await v.eval((sel) => document.querySelectorAll(sel).length, '.list-item-interactive')
await v.page.keyboard.press('Tab')
```

## CLI reference

```sh
npm run demo:video                                  # default video, out/easyadmin-8.0-demo.mp4
npm run demo:video -- <video> [options]             # any video name or path to a .mjs file
node scripts/demo-video/record.mjs [video] [...]    # record frames only (fast iteration)
node scripts/demo-video/encode.mjs <frames> <mp4>   # encode existing frames
node scripts/demo-video/build.mjs [video] [...]     # record + encode (what build.sh runs)
```

| Option | Meaning |
|---|---|
| `--port <n>` | Dev server port (default 5199) |
| `--out <dir>` | Output directory (default `scripts/demo-video/out`) |
| `--url <url>` | Use an already-running dev server |
| `--list` | List available videos |
| `--keep-frames` | Keep `out/frames/` after encoding |
| `--fps`, `--crf`, `--preset`, `--fade-in`, `--fade-out`, `--scale`, `--audio` | Encoder overrides (`encode.mjs` only) |

## Layout

| Path | Purpose |
|---|---|
| `build.sh` / `build.mjs` | Record + encode in one step |
| `record.mjs` | Record frames only: iterate on a script without paying for encoding |
| `encode.mjs` | Frames → h264 mp4 (also a module: `encodeFrames()`) |
| `kit/stage.js` | Browser overlay runtime: cursor, captions, slides, transitions, camera, annotations, frame, watermark, progress |
| `kit/director.mjs` | Node action API handed to `run(v)` |
| `kit/video.mjs` | `defineVideo()` + defaults/resolution |
| `kit/play.mjs` | Boots the page, injects the stage, captures frames, runs the script |
| `kit/browser.mjs` | Vite/Playwright boot + `FrameCapture` |
| `kit/cli.mjs` | Argument parsing and video discovery |
| `videos/` | One file per video, and **this is where you work**: `easyadmin-8.0`, `easyadmin-8.0-upgrade` (slides of config diffs) and `social-teaser` |
| `out/` | Built mp4s (each build's frames live in `out/frames/<video>/` and are deleted after encoding unless `--keep-frames`) |

While recording, the kit also writes `out/frames/manifest.json` (encoder
settings + frame count) and `out/frames/markers.jsonl` (`v.mark()` calls),
the encoder prints the markers as timestamps, which is handy for chapters or
for cutting the mp4 later.

## Concurrency

Each video records into its own `out/frames/<video>/` directory and takes a
`out/.<video>.lock` while it runs, so two videos can be built at the same time
(they share the one dev server) but **two builds of the same video can't**: the
second one fails immediately with the pid that holds the lock, rather than
mixing frames into a corrupt mp4. Locks left behind by a killed run are stolen
automatically.

## Gotchas

- **Always watch the encoded mp4 before committing.** Timing, crops and
  overlays cannot be verified by reading code. The layout only exists once the
  page renders.
- The NUI runs in FiveM's CEF build: `backdrop-filter` is unsupported. Keep
  overlay effects to transforms, opacity and solid colours.
- The cursor in recordings is synthetic (`v.click()` drives both the real
  Playwright mouse and the drawn cursor). Playwright's own pointer never
  appears in a capture.
- A slide's entrance animations only play when it is *shown*, so showing a slide
  behind a transition cover wastes them.
- Add `--keep-frames` when iterating, then re-encode with different `--crf`
  without re-recording.
- Videos are silent by default; `encode.audio` (e.g. `'track.mp3'`) loops a
  music bed to the video length with 1 s / 2 s fades (`audioFade`).
