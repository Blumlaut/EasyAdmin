/**
 * usePluginSchema contract.
 *
 * The important behaviour is what happens on a second fetch: the tree that is
 * on screen must stay there until the new one arrives, a failed refresh must
 * not wipe it, and only refreshes addressed at this contribution may re-fetch.
 */

import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { callLua, listeners } = vi.hoisted(() => ({
  callLua: vi.fn(),
  listeners: new Map<string, (data: unknown) => void>(),
}))

vi.mock('../fivem', () => ({
  callLua: (...args: unknown[]) => callLua(...args),
  on: (action: string, handler: (data: unknown) => void) => {
    listeners.set(action, handler)
    return () => listeners.delete(action)
  },
  LuaError: class LuaError extends Error {},
}))

import { usePluginSchema } from './usePluginSchema'
import { dispatchRefresh } from './refresh'
import type { ComponentSchema } from './schema'

function Probe({ view = 'view-a' }: { view?: string }) {
  const { schema, loading } = usePluginSchema('p', 'renderA', { target: 'page' }, view)

  return (
    <div>
      {loading && <span>loading</span>}
      {schema.map((node, index) => (
        <span key={index}>{(node as ComponentSchema & { text?: string }).text}</span>
      ))}
    </div>
  )
}

function text(value: string): ComponentSchema[] {
  return [{ type: 'text', text: value }]
}

beforeEach(() => {
  callLua.mockReset()
  listeners.clear()
})

describe('usePluginSchema', () => {
  it('renders the first tree and stops loading', async () => {
    callLua.mockResolvedValueOnce(text('first'))
    render(<Probe />)

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('first')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('keeps the current tree visible while an addressed refresh is in flight', async () => {
    callLua.mockResolvedValueOnce(text('first'))
    render(<Probe />)
    await screen.findByText('first')

    let settle: (value: unknown) => void = () => {}
    callLua.mockImplementationOnce(() => new Promise((resolve) => { settle = resolve }))

    act(() => {
      dispatchRefresh({ pluginId: 'p', target: 'page', id: 'view-a' })
    })

    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()

    await act(async () => {
      settle(text('second'))
    })

    expect(await screen.findByText('second')).toBeInTheDocument()
    expect(screen.queryByText('first')).not.toBeInTheDocument()
  })

  it('keeps the last tree when a refresh fails', async () => {
    callLua.mockResolvedValueOnce(text('first'))
    render(<Probe />)
    await screen.findByText('first')

    callLua.mockRejectedValueOnce(new Error('bridge died'))
    act(() => {
      dispatchRefresh({ pluginId: 'p', target: 'page', id: 'view-a' })
    })

    await waitFor(() => expect(callLua).toHaveBeenCalledTimes(2))
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('ignores refreshes addressed at another contribution or plugin', async () => {
    callLua.mockResolvedValueOnce(text('first'))
    render(<Probe />)
    await screen.findByText('first')

    act(() => {
      dispatchRefresh({ pluginId: 'p', target: 'page', id: 'view-b' })
      dispatchRefresh({ pluginId: 'p', target: 'widget', id: 'view-a' })
      dispatchRefresh({ pluginId: 'other', target: 'page', id: 'view-a' })
    })

    expect(callLua).toHaveBeenCalledTimes(1)
  })

  it('still honours the legacy plugin:<id>:update channel', async () => {
    callLua.mockResolvedValueOnce(text('first'))
    render(<Probe />)
    await screen.findByText('first')

    callLua.mockResolvedValueOnce(text('second'))
    await act(async () => {
      listeners.get('plugin:p:update')?.({})
    })

    expect(await screen.findByText('second')).toBeInTheDocument()
  })
})
