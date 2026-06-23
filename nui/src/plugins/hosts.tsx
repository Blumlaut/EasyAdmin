/**
 * Host components for rendering runtime plugin contributions.
 *
 * Each host fetches a schema tree from the plugin's Lua render action
 * and renders it via {@link SchemaRenderer}. Buttons and other interactive
 * nodes call back to Lua via `dispatch`.
 */

import { usePluginSchema } from './usePluginSchema'
import { SchemaRenderer } from './SchemaRenderer'
import { Skeleton } from '../components/Skeleton'
import type { PluginRenderContext } from './types'

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------

function PluginLoading() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={48} width="100%" />
      <Skeleton height={48} width="100%" />
    </div>
  )
}

function PluginError({ message }: { message: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PluginPageHost — full page
// ---------------------------------------------------------------------------

export function PluginPageHost({ pluginId, renderAction }: { pluginId: string; renderAction: string }) {
  const context: PluginRenderContext = { target: 'page' }
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context)

  if (loading) return <PluginLoading />
  if (error) return <PluginError message={error} />

  return (
    <div className="page-container">
      <SchemaRenderer schema={schema} onAction={dispatch} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PluginWidgetHost — dashboard widget
// ---------------------------------------------------------------------------

export function PluginWidgetHost({ pluginId, renderAction }: { pluginId: string; renderAction: string }) {
  const context: PluginRenderContext = { target: 'widget' }
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context)

  if (loading) return <Skeleton height={80} width="100%" />
  if (error) return <PluginError message={error} />

  return <SchemaRenderer schema={schema} onAction={dispatch} />
}

// ---------------------------------------------------------------------------
// PluginTabHost — player detail tab
// ---------------------------------------------------------------------------

export function PluginTabHost({
  pluginId,
  renderAction,
  playerId,
}: {
  pluginId: string
  renderAction: string
  playerId: number
}) {
  const context: PluginRenderContext = { target: 'player-tab', playerId }
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context)

  if (loading) return <PluginLoading />
  if (error) return <PluginError message={error} />

  return <SchemaRenderer schema={schema} onAction={dispatch} />
}
