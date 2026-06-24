import type { NUIPayload } from './types'

// Error thrown when a Lua NUI callback returns { error: "..." }
export class LuaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LuaError'
  }
}

// Fetch from the Lua backend (NUI callback)
// FiveM automatically parses JSON request/response
// Throws LuaError when the Lua side returns { error: "..." }
export async function callLua<TResponse>(action: string, data?: unknown): Promise<TResponse> {
  const response = await fetch(`https://${GetParentResourceName()}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(data ?? {}),
  })
  const result = await response.json()
  if (result && typeof result === 'object' && 'error' in result) {
    throw new LuaError(typeof result.error === 'string' ? result.error : String(result.error))
  }
  return result as TResponse
}

// Get the parent resource name (always "EasyAdmin" in production)
function GetParentResourceName(): string {
  // @ts-expect-error - FiveM global
  return window.parentResourceName || 'EasyAdmin'
}

// Listen for messages pushed from Lua via SendNUIMessage
// Returns an unsubscribe function
export function on<N = unknown>(action: string, handler: (data: N) => void): () => void {
  const listener = (event: MessageEvent<NUIPayload<N>>) => {
    const payload = event.data
    if (payload && payload.action === action) {
      handler(payload.data as N)
    }
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

// Set a resource KVP entry (persists setting to resource storage)
export function setResourceKvp(key: string, value: string): void {
  callLua('setResourceKvp', { key, value }).catch(() => {})
}
