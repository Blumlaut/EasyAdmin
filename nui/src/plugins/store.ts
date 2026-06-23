/**
 * Runtime plugin store.
 *
 * Holds plugin registrations received from Lua via the `pluginsRegistered`
 * NUI message. External resources call `exports['easyadmin']:RegisterPlugin()`
 * on the Lua side; EasyAdmin forwards the registrations to the NUI, which
 * stores them here.
 *
 * The store is a simple event-emitter so React hooks can subscribe to
 * changes. No React context needed — hooks call `getPlugins()` and
 * `subscribe()` directly.
 */

import { on } from '../fivem'
import type { RuntimePlugin } from './types'

let plugins: RuntimePlugin[] = []
const listeners = new Set<() => void>()

// ── NUI message listeners ─────────────────────────────────
// Receive plugin registrations pushed from Lua via SendNUIMessage.

// Single plugin registered (incremental)
on<RuntimePlugin>('pluginRegistered', (plugin) => {
  const idx = plugins.findIndex((p) => p.id === plugin.id)
  if (idx >= 0) {
    plugins = [...plugins.slice(0, idx), plugin, ...plugins.slice(idx + 1)]
  } else {
    plugins = [...plugins, plugin]
  }
  for (const fn of listeners) fn()
})

// Full plugin list synced (e.g. when menu opens)
on<{ plugins: RuntimePlugin[] }>('pluginsRegistered', (data) => {
  plugins = data.plugins ?? []
  for (const fn of listeners) fn()
})

// ── Request plugin list on mount (avoids race with push) ───
import { callLua } from '../fivem'
callLua('syncPlugins').catch(() => {})

/** Replace the full plugin list (called when Lua sends registrations). */
export function setPlugins(next: RuntimePlugin[]): void {
  plugins = next
  for (const fn of listeners) fn()
}

/** Get the current plugin list. */
export function getPlugins(): RuntimePlugin[] {
  return plugins
}

/** Snapshot for useSyncExternalStore (same reference if unchanged). */
export function getPluginsSnapshot(): RuntimePlugin[] {
  return plugins
}

/** Subscribe to plugin list changes. Returns an unsubscribe function. */
export function subscribePlugins(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
