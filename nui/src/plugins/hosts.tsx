/**
 * Host components for rendering runtime plugin contributions.
 *
 * Each host fetches a schema tree from the plugin's Lua render action and
 * renders it via {@link SchemaRenderer}. Buttons and other interactive nodes
 * call back to Lua via `dispatch`.
 *
 * Every host tells the refresh bus which contribution it is showing, so a
 * refresh addressed at one view does not reload the others.
 */

import { useMemo } from 'react'
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

export function PluginPageHost({
  pluginId,
  view,
  renderAction,
}: {
  pluginId: string
  /** The page's view, e.g. `plugin:my-plugin`. Addresses refreshes at this page. */
  view: string
  renderAction: string
}) {
  const context = useMemo<PluginRenderContext>(() => ({ target: 'page' }), [])
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context, view)

  if (loading) return <PluginLoading />
  if (error && schema.length === 0) return <PluginError message={error} />

  return (
    <div className="page-container">
      <SchemaRenderer schema={schema} onAction={dispatch} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PluginWidgetHost — dashboard widget
// ---------------------------------------------------------------------------

export function PluginWidgetHost({
  pluginId,
  widgetId,
  renderAction,
}: {
  pluginId: string
  /** The widget's id from the registration. Addresses refreshes at this widget. */
  widgetId: string
  renderAction: string
}) {
  const context = useMemo<PluginRenderContext>(() => ({ target: 'widget' }), [])
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context, widgetId)

  if (loading) return <Skeleton height={80} width="100%" />
  if (error && schema.length === 0) return <PluginError message={error} />

  return <SchemaRenderer schema={schema} onAction={dispatch} />
}

// ---------------------------------------------------------------------------
// PluginTabHost — player detail tab
// ---------------------------------------------------------------------------

export function PluginTabHost({
  pluginId,
  tabId,
  renderAction,
  playerId,
}: {
  pluginId: string
  /** The tab's id from the registration. Addresses refreshes at this tab. */
  tabId: string
  renderAction: string
  playerId: number
}) {
  const context = useMemo<PluginRenderContext>(() => ({ target: 'player-tab', playerId }), [playerId])
  const { schema, loading, error, dispatch } = usePluginSchema(pluginId, renderAction, context, tabId)

  if (loading) return <PluginLoading />
  if (error && schema.length === 0) return <PluginError message={error} />

  return <SchemaRenderer schema={schema} onAction={dispatch} />
}
