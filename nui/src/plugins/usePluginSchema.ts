/**
 * usePluginSchema — fetches and manages a schema tree from a Lua render action.
 *
 * Called by the PluginPageHost, PluginWidgetHost and PluginTabHost components.
 * Handles:
 *   - the first fetch for the contribution being shown
 *   - action dispatch (calls Lua, optionally replaces the tree, otherwise re-fetches)
 *   - addressed refreshes pushed from Lua via {@link subscribeRefresh}
 *
 * A re-fetch never blanks the view: the current tree stays mounted until the new
 * one arrives, and a failed refresh keeps whatever is already on screen. Only the
 * first fetch for a contribution shows a loading state.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { on } from '../fivem'
import { pluginCall } from './bridge'
import { subscribeRefresh } from './refresh'
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
  /** True only until the first response for this contribution arrives. */
  loading: boolean
  error: string | null
  /** Dispatch an action to the plugin's Lua handler, then re-fetch schema. */
  dispatch: (action: string, data?: unknown, server?: boolean) => void
  /** Re-fetch without clearing the view. */
  refresh: () => void
}

export function usePluginSchema(
  pluginId: string,
  renderAction: string,
  context: PluginRenderContext,
  /** The contribution on screen: page view, widget id or tab id. Used to address refreshes. */
  contributionId: string,
): UsePluginSchemaResult {
  const [schema, setSchema] = useState<ComponentSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // One request at a time per host. A refresh that lands mid-flight is queued and
  // runs once the current one settles, so bursts cannot pile up.
  const requestId = useRef(0)
  const inFlight = useRef(false)
  const queued = useRef(false)

  // keyed on the context's fields, not the object: an inline context from a caller
  // would otherwise rebuild `load` every render and refetch forever
  const { target, playerId } = context

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (inFlight.current) {
        queued.current = true
        return
      }

      inFlight.current = true
      const id = (requestId.current += 1)
      if (mode === 'initial') setLoading(true)

      try {
        const result = await pluginCall<unknown>(pluginId, renderAction, { context: { target, playerId } })
        if (id !== requestId.current) return
        setSchema(extractSchema(result))
        setError(null)
      } catch (err) {
        if (id !== requestId.current) return
        // keep the last good tree: a failed refresh must not wipe the view
        setError(String(err ?? 'Failed to load plugin content'))
      } finally {
        if (id === requestId.current) {
          inFlight.current = false
          setLoading(false)
          if (queued.current) {
            queued.current = false
            void load('refresh')
          }
        }
      }
    },
    [pluginId, renderAction, target, playerId],
  )

  // First fetch, and a fresh start whenever the host switches contribution
  useEffect(() => {
    requestId.current += 1
    inFlight.current = false
    queued.current = false
    setSchema([])
    setError(null)
    void load('initial')
  }, [load])

  // Addressed refreshes from Lua
  useEffect(() => {
    return subscribeRefresh({ pluginId, target, id: contributionId, playerId }, () => {
      void load('refresh')
    })
  }, [pluginId, target, playerId, contributionId, load])

  // Legacy unaddressed channel, kept so plugins written before addressing still work
  useEffect(() => {
    return on(`plugin:${pluginId}:update`, () => {
      void load('refresh')
    })
  }, [pluginId, load])

  const dispatch = useCallback(
    (action: string, data?: unknown, server?: boolean) => {
      pluginCall<unknown>(pluginId, action, data, server)
        .then((res) => {
          // A schema replaces the view; anything else means "re-fetch in place".
          const next = extractSchema(res)
          if (next.length > 0) {
            setSchema(next)
            setError(null)
          } else {
            void load('refresh')
          }
        })
        .catch(() => {
          void load('refresh')
        })
    },
    [pluginId, load],
  )

  const refresh = useCallback(() => {
    void load('refresh')
  }, [load])

  return { schema, loading, error, dispatch, refresh }
}

// Re-export for host components
export { SchemaRenderer }
