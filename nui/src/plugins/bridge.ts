/**
 * Lua bridge for runtime plugins.
 *
 * Routes `pluginCall` NUI requests to Lua handlers registered by external
 * plugin resources. The `server` flag forwards to the server bridge.
 */

import { callLua, LuaError } from '../fivem'

export interface PluginCallResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

// ── Pending server requests ─────────────────────────────────
// When a server action is dispatched, the Lua bridge returns immediately
// with { ok: true, deferred: true }. The real response arrives later via
// a `pluginResponse` NUI message. We track pending requests here so the
// response can resolve the original promise.
//
// Key format: "pluginId:::action" (colon-separated; triple-colon delimiter
// avoids ambiguity if pluginId or action contains colons).
interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const pendingRequests = new Map<string, PendingRequest>()

/** Build a unique key for a pending server request. */
function pendingKey(pluginId: string, action: string): string {
  return `${pluginId}:::${action}`
}

/** Clear a pending request (on resolution or timeout). */
function clearPending(key: string): void {
  const req = pendingRequests.get(key)
  if (req) {
    clearTimeout(req.timer)
    pendingRequests.delete(key)
  }
}

/**
 * Call a Lua handler for a plugin action.
 *
 * @param pluginId  The plugin id
 * @param action    The action name (e.g. a renderAction or button action)
 * @param data      Payload sent to the handler
 * @param server    When true, routes to a server-side handler
 */
export function pluginCall<T = unknown>(
  pluginId: string,
  action: string,
  data?: unknown,
  server?: boolean,
): Promise<T> {
  // Server-side handler: the Lua bridge returns immediately with
  // { ok: true, deferred: true }. The real response arrives later
  // via a `pluginResponse` NUI message, so we wait for that instead.
  if (server === true) {
    const key = pendingKey(pluginId, action)

    // Fire-and-forget the Lua call (starts the server-side dispatch).
    callLua('pluginCall', {
      pluginId,
      action,
      data: data ?? {},
      server: true,
    }).catch(() => {
      // If the initial call itself fails (e.g. Lua bridge error),
      // clear the pending request so it times out cleanly.
      clearPending(key)
    })

    return new Promise<T>((resolve, reject) => {
      // Timeout after 600ms (server bridge fallback is 500ms).
      const timer = setTimeout(() => {
        clearPending(key)
        reject(new LuaError('Server action timed out'))
      }, 600)

      // Store with type-safe adapters so the generic T is bridged through unknown.
      pendingRequests.set(key, {
        resolve: (v: unknown) => resolve(v as T),
        reject,
        timer,
      })
    })
  }

  // Client-side handler: response comes directly from the NUI callback.
  return callLua<T>('pluginCall', {
    pluginId,
    action,
    data: data ?? {},
    server: false,
  })
}

/**
 * Resolve a pending server request with the actual response.
 * Called by the `pluginResponse` NUI message handler.
 */
export function resolvePendingRequest(
  pluginId: string,
  action: string,
  response: unknown,
): void {
  const key = pendingKey(pluginId, action)
  const req = pendingRequests.get(key)
  if (!req) return

  clearPending(key)

  // If the response contains an error, reject with LuaError.
  if (response && typeof response === 'object' && 'error' in response) {
    req.reject(
      new LuaError(typeof response.error === 'string' ? response.error : String(response.error)),
    )
  } else {
    req.resolve(response)
  }
}

// ── NUI message listener for server responses ───────────────
import { on } from '../fivem'

on<{ pluginId: string; action: string; response: unknown }>('pluginResponse', (data) => {
  resolvePendingRequest(data.pluginId, data.action, data.response)
})
