import type { NUIPayload } from './types'

// Fetch from the Lua backend (NUI callback)
// FiveM automatically parses JSON request/response
export async function callLua<TResponse>(action: string, data?: unknown): Promise<TResponse> {
  const response = await fetch(`https://${GetParentResourceName()}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(data ?? {}),
  })
  return response.json() as Promise<TResponse>
}

// Get the parent resource name (always "EasyAdmin" in production)
function GetParentResourceName(): string {
  // @ts-expect-error - FiveM global
  return window.parentResourceName || 'EasyAdmin'
}

// Listen for messages pushed from Lua via SendNUIMessage
export function on<N = unknown>(action: string, handler: (data: N) => void): void {
  window.addEventListener('message', (event: MessageEvent<NUIPayload>) => {
    const payload = event.data
    if (payload && payload.action === action) {
      handler(payload.data as N)
    }
  })
}

// Set a value that Lua can read (for convvar-like behavior)
export function setConvVar(key: string, value: string): void {
  // @ts-expect-error - FiveM global
  if (typeof SetConvar === 'function') {
    // @ts-expect-error
    SetConvar(key, value)
  }
}

// Set a resource-local convvar
export function setResourceConvVar(key: string, value: string): void {
  callLua('setResourceKvp', { key, value })
}
