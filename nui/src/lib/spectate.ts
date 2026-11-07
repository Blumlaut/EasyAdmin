/**
 * Spectate store.
 *
 * The client keeps the authoritative spectate state and pushes it here as
 * `spectateState`. Toggling from the UI updates the store right away so the
 * button flips without waiting for the round trip.
 */

import { useSyncExternalStore } from 'react'
import { callLua, on } from '../fivem'

let targetId: number | null = null
const listeners = new Set<() => void>()

function set(next: number | null): void {
  if (targetId === next) return
  targetId = next
  for (const fn of listeners) fn()
}

on<{ targetId?: number | null }>('spectateState', (data) => set(data?.targetId ?? null))

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot(): number | null {
  return targetId
}

/** Server id of the player being spectated, null when not spectating. */
export function useSpectatingTarget(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Spectate a player, or leave spectator mode when they are already the target. */
export async function toggleSpectate(id: number): Promise<void> {
  if (targetId === id) {
    await stopSpectate()
    return
  }
  await callLua('spectatePlayer', { id })
  set(id)
}

export async function stopSpectate(): Promise<void> {
  await callLua('stopSpectate')
  set(null)
}

// The menu can reconnect to a session that is already spectating.
callLua<{ targetId?: number | null }>('syncSpectate')
  .then((res) => set(res?.targetId ?? null))
  .catch(() => {})
