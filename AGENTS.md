# AI Agents
This repository follows a human-first development philosophy. AI agents are assistants to developers, not replacements. Every code change, no matter how small, must be reviewed, validated, and approved by a human developer before being merged.

Every change requires manual testing. AI agents cannot verify that changes work correctly by reading code. When suggesting changes, you must:

1. Clearly identify all files modified
2. Explain what functionality is affected
3. Provide specific testing steps for the developer to verify the changes

## Contributing Guidelines

Always read [CONTRIBUTING.md](CONTRIBUTING.md) before suggesting changes. It covers issue templates, code organization, PR requirements, AI disclosure rules, and documentation expectations.

## Repository Layout

| Path | Description |
|---|---|
| `fxmanifest.lua` | Resource manifest — defines scripts, dependencies, convars, and entry points |
| `client/` | Client-side FiveM logic (Lua). Only runs on connected clients. |
| `server/` | Server-side FiveM logic (Lua). Only runs on the server. |
| `shared/` | Code shared between client and server. Functions and variables defined here are available across all Lua files. |
| `nui/` | Frontend UI built with React/TypeScript, runs inside FiveM's CEF browser. |
| `language/` | Internationalization (i18n) translation files. |
| `src/` | Discord bot code (Node.js), bundled into `dist/`. |
| `docs/` | EasyAdmin user and developer documentation. |
| `plugins/` | Plugin system — `*_shared.lua`, `*_client.lua`, `*_server.lua` naming conventions. |

## Handy Commands

Run from the respective subdirectories after installing dependencies (`npm install`).

### NUI (`nui/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run dev:browser` | Start dev server and open in browser |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint on `src/` |
| `npm run lint:css` | Stylelint on CSS files |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run test` | Run Vitest test suite |
| `npm run check` | Run all checks (lint, CSS lint, typecheck, tests) |

### Discord Bot (`src/`)

| Command | Description |
|---|---|
| `npm run build` | Install deps + bundle with esbuild into `dist/` |

## FiveM Documentation

When working on any code related to FiveM, always consult the official documentation:

- **FiveM Docs**: https://docs.fivem.net/docs/ — Server framework, client/server API, resources, events, etc.
- **GTA V Native Reference**: https://docs.fivem.net/natives/ — Complete reference for all GTA V natives available in FiveM

Never guess at API behavior or native signatures. Always verify against the official docs before suggesting changes.

## Merge Requests

**AI usage must ALWAYS be clearly indicated.** When creating merge requests.

Remember: AI is a tool to assist developers, not replace human judgment and responsibility.

## FiveM NUI / CEF UI Known Issues

The NUI runs inside FiveM's Chromium Embedded Framework (CEF) which has several rendering quirks. **All changes to NUI CSS require in-game testing** — they cannot be verified by reading code alone.

### CEF Rendering Bugs

**`transform` in `@keyframes` causes full element invisibility.** Animations that use `transform: scale()`, `translateY()`, or any transform property inside `@keyframes` will render the element completely invisible in CEF. The DOM exists and is interactive (cursor changes correctly) but nothing is painted. **Never use `transform` inside CSS animations for NUI elements.**

**`@keyframes` with `opacity` also causes invisibility.** Even opacity-only animations can trigger the same compositing bug. **Avoid CSS `animation` on modal/overlay elements entirely.**

**`box-shadow` with large blur radius can cause invisibility.** The value `0 8px 32px rgba(0, 0, 0, 0.5)` (the original `--shadow` variable) makes `.dialog` invisible. Use smaller values like `0 4px 16px rgba(0, 0, 0, 0.4)` instead.

**`backdrop-filter` and `-webkit-backdrop-filter` are safe** — `blur(4px)` works fine on `.dialog-overlay`.

### Modal/Dialog CSS Rules

- Modals render via `ModalProvider` as siblings of `.ea-window` inside `#root` (not nested children)
- `.dialog-overlay` uses `position: fixed; inset: 0; z-index: 9999`
- `.dialog` uses hardcoded solid background `#1e293b` (CSS variable backgrounds may not resolve reliably)
- No `animation` property on either element
- `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4)` is the safe shadow value

### Viewport Coordinates — No Hardcoded Pixels

**Never use hardcoded `px` values for the main window or layout dimensions.** The NUI must scale across different screen resolutions. Use:

- `min(92vw, 1210px)` for width (scales with viewport, caps at 1210px)
- `min(85vh, 750px)` for height (scales with viewport, caps at 750px)
- CSS custom properties for spacing and sizing where possible
- Relative units (`rem`, `em`, `%`, `vw`, `vh`) over absolute `px`

This ensures the UI works on everything from 720p ultrawide to 4K displays.
