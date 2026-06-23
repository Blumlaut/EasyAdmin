/**
 * EasyAdmin NUI Plugin Manifest
 *
 * ─────────────────────────────────────────────────────────────────
 *  THIS IS THE INSTALLATION POINT FOR NUI PLUGINS.
 * ─────────────────────────────────────────────────────────────────
 *
 * To install a plugin:
 *   1. Place the plugin package under `nui/src/plugins/<your-plugin>/`
 *   2. Import its default export here
 *   3. Call `registerPlugin(...)` with it
 *
 * Plugins are bundled at build time by Vite. There is no runtime
 * loading of untrusted code — every plugin must be present at build.
 *
 * Server/client Lua logic for plugins lives in `plugins/<your-plugin>/`
 * and is loaded automatically by `fxmanifest.lua`.
 */

import { registerPlugin } from './registry'

// --- Installed plugins ---
import easyInfoPlugin from './example'

registerPlugin(easyInfoPlugin)
