/**
 * Addressed refresh bus for plugin views.
 *
 * A plugin resource cannot send NUI messages to EasyAdmin (its own
 * `SendNUIMessage` goes to its own page, and it has none), so refresh requests
 * come through EasyAdmin's client as one `pluginRefresh` message. Each host
 * subscribes with the contribution it is showing, and only matching hosts
 * re-fetch — a plugin page refresh must not reload its dashboard widget.
 *
 * An unaddressed request (`target`/`id`/`playerId` all omitted) matches every
 * view of that plugin, which is what the legacy `plugin:<id>:update` channel
 * used to do.
 */

import { on } from '../fivem'

/** Where a contribution is mounted. Mirrors {@link PluginRenderContext.target}. */
export type PluginRefreshTarget = 'page' | 'widget' | 'player-tab'

export interface PluginRefreshRequest {
  pluginId: string
  /** Omit to refresh every view of the plugin. `tab` is accepted for `player-tab`. */
  target?: PluginRefreshTarget | 'tab'
  /** Page view, widget id or tab id. Omit to refresh every view of the target. */
  id?: string
  /** Narrow a player tab refresh to one player. */
  playerId?: number
}

export interface PluginRefreshSubscription {
  pluginId: string
  target: PluginRefreshTarget
  /** Contribution id: page view, widget id or tab id. */
  id: string
  playerId?: number
}

function normalizeTarget(target: PluginRefreshRequest['target']): PluginRefreshTarget | undefined {
  if (target === 'tab') return 'player-tab'
  return target
}

export function matchesRefresh(request: PluginRefreshRequest, subscription: PluginRefreshSubscription): boolean {
  if (request.pluginId !== subscription.pluginId) return false

  const target = normalizeTarget(request.target)
  if (target && target !== subscription.target) return false
  if (request.id != null && request.id !== subscription.id) return false
  if (request.playerId != null && request.playerId !== subscription.playerId) return false

  return true
}

const subscriptions = new Set<{ subscription: PluginRefreshSubscription; notify: () => void }>()

/** Subscribe a mounted host to the refresh requests addressed at it. */
export function subscribeRefresh(subscription: PluginRefreshSubscription, notify: () => void): () => void {
  const entry = { subscription, notify }
  subscriptions.add(entry)
  return () => {
    subscriptions.delete(entry)
  }
}

/** Notify every host the request addresses. Returns how many were notified. */
export function dispatchRefresh(request: PluginRefreshRequest): number {
  let notified = 0
  for (const entry of subscriptions) {
    if (!matchesRefresh(request, entry.subscription)) continue
    notified += 1
    entry.notify()
  }
  return notified
}

on<PluginRefreshRequest>('pluginRefresh', (data) => {
  if (!data || typeof data.pluginId !== 'string' || data.pluginId === '') return
  dispatchRefresh(data)
})
