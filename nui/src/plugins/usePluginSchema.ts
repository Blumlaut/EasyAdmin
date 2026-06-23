/**
 * usePluginSchema — fetches and manages a schema tree from a Lua render action.
 *
 * Called by the PluginPageHost, PluginWidgetHost, and PluginTabHost components.
 * Handles:
 *   - Initial schema fetch on mount
 *   - Action dispatch (calls Lua, optionally re-fetches schema)
 *   - Live updates via `plugin:<id>:update` NUI messages
 */

import { useCallback, useEffect, useState } from 'react'
import { on } from '../fivem'
import { pluginCall } from './bridge'
import { SchemaRenderer } from './SchemaRenderer'
import type { ComponentSchema } from './schema'
import type { PluginRenderContext } from './types'

function extractSchema(res: unknown): ComponentSchema[] {
  if (Array.isArray(res)) return res as ComponentSchema[]
  if (res && typeof res === 'object' && 'schema' in res) {
    return (res as { schema: ComponentSchema[] }).schema
  }
  return []
}

export interface UsePluginSchemaResult {
  schema: ComponentSchema[]
  loading: boolean
  error: string | null
  /** Dispatch an action to the plugin's Lua handler, then re-fetch schema. */
  dispatch: (action: string, data?: unknown, server?: boolean) => void
  /** Manually re-fetch the schema. */
  refresh: () => void
}

export function usePluginSchema(
  pluginId: string,
  renderAction: string,
  context: PluginRenderContext,
): UsePluginSchemaResult {
  const [schema, setSchema] = useState<ComponentSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const refresh = useCallback(() => {
    setRefreshNonce((n) => n + 1)
  }, [])

  // Fetch schema — runs on mount, context change, and when refreshNonce changes
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch requires setState in effect; using cancelled flag to avoid stale updates
    setLoading(true)
    pluginCall<unknown>(pluginId, renderAction, { context })
      .then((res) => {
        if (!cancelled) {
          setSchema(extractSchema(res))
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err ?? 'Failed to load plugin content'))
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [pluginId, renderAction, context, refreshNonce])

  // Listen for live updates pushed from Lua
  useEffect(() => {
    return on(`plugin:${pluginId}:update`, () => refresh())
  }, [pluginId, refresh])

  const dispatch = useCallback(
    (action: string, data?: unknown, server?: boolean) => {
      pluginCall<unknown>(pluginId, action, data, server)
        .then((res) => {
          // If the handler returns a schema, use it. Otherwise re-fetch.
          const next = extractSchema(res)
          if (next.length > 0) {
            setSchema(next)
          } else {
            refresh()
          }
        })
        .catch(() => refresh())
    },
    [pluginId, refresh],
  )

  return { schema, loading, error, dispatch, refresh }
}

// Re-export for host components
export { SchemaRenderer }
