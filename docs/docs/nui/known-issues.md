# NUI Known Issues

## Unsupported CSS Features

### `backdrop-filter`

The `backdrop-filter` and `-webkit-backdrop-filter` CSS properties are not supported in FiveM's CEF build. The blur effect is not applied. Do not use `backdrop-filter` in NUI styles.

## OSR Rendering

### Backgrounded Rendering

The NUI runs in Off-Screen Rendering (OSR) mode. Elements rendered outside the visible conditional in the main App component may not paint correctly when the window is folded or backgrounded.

### Overlay Components

Toast notifications and warning overlays must be inside the visible block in App.tsx to render correctly when the NUI is backgrounded.

## Modal System

### Positioning

Modals render via `ModalProvider` as siblings of the main `.ea-window` element, not as nested children. The overlay uses:

```css
position: fixed;
inset: 0;
z-index: 9999;
```

### Background Colors

Dialog backgrounds use hardcoded solid colors (`#1e293b`) rather than CSS variables, as variable backgrounds may not resolve reliably in OSR mode.

### Shadow

Dialogs use a hardcoded box-shadow: `0 4px 16px rgba(0, 0, 0, 0.4)`

## Window Positioning

Never use hardcoded pixel values for the main window or layout dimensions. Use:

- `min(92vw, 1210px)` for width
- `min(85vh, 750px)` for height
- CSS custom properties for spacing and sizing
- Relative units (`rem`, `em`, `%`, `vw`, `vh`) over absolute `px`

## CEF Limitations

### JavaScript

The FiveM CEF build does not execute JavaScript for NUI pages — the React app is pre-built and served from `nui/dist/`. Dynamic script injection is not supported.

### WebGL

WebGL support may be limited depending on the FiveM build and GPU drivers. Charts in the Network Monitor use Canvas 2D, not WebGL.

## Cross-Resolution Testing

Always test NUI changes on multiple screen resolutions:

- 720p (1280x720) — ultrawide and common lower-res
- 1080p (1920x1080) — standard
- 1440p (2560x1440) — high-res
- 4K (3840x2160) — ultra high-res

The NUI should scale appropriately on all resolutions.
