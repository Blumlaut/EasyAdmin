/**
 * Shared types and utilities for the mock system.
 */

import type { Notification } from '../types'

/**
 * A mock handler for a single Lua action.
 * Receives the parsed request body and returns a Response.
 */
export type MockHandler = (body: Record<string, unknown>) => Promise<Response>

/**
 * A domain mock exports demo data (mutable state) and a map of action → handler.
 */
export interface DomainMock {
  handlers: Record<string, MockHandler>
}

/**
 * Convert a body param to string (handles FormData, plain strings, objects).
 */
export function bodyToString(body: unknown): string {
  if (typeof body === 'string') return body
  if (body instanceof FormData) {
    const parts: string[] = []
    for (const [k, v] of body.entries()) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    }
    return parts.join('&')
  }
  return JSON.stringify(body)
}

/**
 * Return a JSON Response with 200 status.
 */
export function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Broadcast a notification to the NUI message bus.
 */
export function broadcastNotification(notification: Notification) {
  window.postMessage({ action: 'notification', data: notification }, '*')
}
