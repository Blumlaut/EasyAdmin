# NUI Known Issues

## Blur Effects

`backdrop-filter` (and `-webkit-backdrop-filter`) does render in FiveM's CEF, but the blur is
unreliable: it can flicker, keep repainting and cost frame rate. EasyAdmin uses it on the glass
panels, dialogs and the warning overlay.

If a blurred area flickers, or the UI stutters while a blurred panel is on screen:

- keep blurred layers few and static — do not animate or scroll large blurred surfaces
- remove the blur from the affected element and test again
- never rely on the blur for legibility, because the panels behind it are semi-transparent — text must
  stay readable without it

## OSR Rendering

### Backgrounded Rendering

The NUI runs in Off-Screen Rendering (OSR) mode. Elements rendered outside the visible block may not
paint correctly when the window is folded or backgrounded.

### Overlay Components

Full-screen overlays (the warning overlay and the screenshot viewer) must be inside the visible block
so they paint when the window is backgrounded. Panel streams are deliberately kept outside it so they
stay connected while the menu is closed — that is intentional, not a bug.

## Modal System

### Positioning

Dialogs render as siblings of the main window, not as nested children. The overlay uses:

```css
position: fixed;
inset: 0;
z-index: 9999;
```

The warning overlay uses `z-index: 10000`, so it always sits above dialogs.

### Background Colors

Dialog backgrounds are hardcoded solid colours rather than CSS variables, because variable backgrounds
may not resolve reliably in OSR mode:

- background `#161b22`
- border `#30363d`

### Shadow

Dialogs use the shared large shadow: `0 8px 24px rgba(0, 0, 0, 0.6)`.

## Window Positioning

Never use hardcoded pixel values for the main window or for layout inside it. The window is sized and
positioned in code, not CSS: it defaults to 1210x750, cannot shrink below 500x400, and maximises to the
viewport with a small margin. Use:

- CSS custom properties for spacing and sizing
- relative units (`rem`, `em`, `%`, `vh`) over absolute `px`

## CEF Limitations

### JavaScript

The UI is a normal JavaScript app and runs normally in CEF. Source changes only take effect after the
bundle is rebuilt and the resource restarted — editing source alone changes nothing in-game.

### WebGL

Charts in the Network Monitor are drawn with Canvas 2D, not WebGL. Screenshot capture and live
streaming do use WebGL, so blank or black frames in those features usually point to a GPU/WebGL problem
rather than a UI bug.

## Cross-Resolution Testing

Always test NUI changes on several screen resolutions:

- 1280x720 (720p) — low-res
- 1920x1080 (1080p) — standard
- 2560x1440 (1440p) — high-res
- 2560x1080 / 3440x1440 — ultrawide
- 3840x2160 (4K) — ultra high-res

The window is clamped to the viewport, so smaller screens shrink the panel instead of clipping it.
Check that nothing overflows at the smallest size.
