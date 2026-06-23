/**
 * Lua bridge for runtime plugins.
 *
 * Routes `pluginCall` NUI requests to Lua handlers registered by external
 * plugin resources. The `server` flag forwards to the server bridge.
 */

import { callLua } from '../fivem'

export interface PluginCallResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
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
  return callLua<T>('pluginCall', {
    pluginId,
    action,
    data: data ?? {},
    server: server === true,
  })
}
