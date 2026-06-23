/**
 * EasyAdmin NUI Plugin Registry
 *
 * Plugins are registered at build time via {@link registerPlugin}.
 * The central manifest (`manifest.ts`) imports every installed plugin
 * and registers it — that file is the single "installation" point.
 *
 * The registry is a plain module (no React) so contributions can be
 * read from anywhere, including hooks that run outside the provider tree.
 */

import type { EasyAdminPlugin } from './types'

const registered: EasyAdminPlugin[] = []
const errors: Array<{ pluginId: string; error: string }> = []

/** Validate the shape of a plugin definition. Returns an error string or null. */
function validate(plugin: unknown): string | null {
  if (typeof plugin !== 'object' || plugin === null) {
    return 'Plugin must be an object'
  }
  const p = plugin as Partial<EasyAdminPlugin>
  if (typeof p.id !== 'string' || p.id.length === 0) {
    return 'Plugin must have a non-empty string `id`'
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) {
    return `Plugin id "${p.id}" must be kebab-case (lowercase, hyphen-separated)`
  }
  if (typeof p.name !== 'string' || p.name.length === 0) {
    return 'Plugin must have a non-empty string `name`'
  }
  if (typeof p.version !== 'string' || p.version.length === 0) {
    return 'Plugin must have a non-empty string `version`'
  }
  return null
}

/**
 * Register a plugin.
 *
 * Called from `manifest.ts` for each installed plugin. Safe to call
 * multiple times — duplicate ids are ignored with a console warning.
 */
export function registerPlugin(plugin: EasyAdminPlugin): void {
  const error = validate(plugin)
  if (error) {
    errors.push({ pluginId: '<unknown>', error })
    console.error(`[EasyAdmin Plugin] ${error}`)
    return
  }

  if (registered.some((p) => p.id === plugin.id)) {
    console.warn(`[EasyAdmin Plugin] Plugin "${plugin.id}" is already registered — skipping duplicate`)
    return
  }

  registered.push(plugin)
}

/** All registered plugins (read-only). */
export function getRegisteredPlugins(): readonly EasyAdminPlugin[] {
  return registered
}

/** Validation errors collected during registration. */
export function getPluginErrors(): ReadonlyArray<{ pluginId: string; error: string }> {
  return errors
}

/** Reset the registry (test-only). */
export function _resetRegistry(): void {
  registered.length = 0
  errors.length = 0
}
