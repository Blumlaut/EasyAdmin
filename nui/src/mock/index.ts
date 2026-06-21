/**
 * Barrel export for the mock system.
 */

export type { MockHandler, DomainMock } from './types'
export { bodyToString, jsonResponse, broadcastNotification } from './types'
export * from './domains'
