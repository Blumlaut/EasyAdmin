import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callLua } from '../fivem'
import { stopSpectate, toggleSpectate } from './spectate'

vi.mock('../fivem', () => ({
  callLua: vi.fn(() => Promise.resolve({ ok: true })),
  on: vi.fn(() => () => {}),
}))

describe('spectate store', () => {
  beforeEach(async () => {
    // The store is module state, so reset it between tests
    await stopSpectate()
    vi.mocked(callLua).mockClear()
  })

  it('starts spectating a player it is not watching yet', async () => {
    await toggleSpectate(4)
    expect(callLua).toHaveBeenCalledWith('spectatePlayer', { id: 4 })
  })

  it('leaves spectator mode when the same player is clicked again', async () => {
    await toggleSpectate(4)
    vi.mocked(callLua).mockClear()

    await toggleSpectate(4)
    expect(callLua).toHaveBeenCalledWith('stopSpectate')
    expect(callLua).not.toHaveBeenCalledWith('spectatePlayer', expect.anything())
  })

  it('switches target instead of stopping when another player is clicked', async () => {
    await toggleSpectate(4)
    await toggleSpectate(7)
    expect(callLua).toHaveBeenLastCalledWith('spectatePlayer', { id: 7 })
  })

  it('keeps the current target when the Lua call fails', async () => {
    await toggleSpectate(4)
    vi.mocked(callLua).mockRejectedValueOnce(new Error('denied'))
    await expect(toggleSpectate(7)).rejects.toThrow('denied')

    vi.mocked(callLua).mockClear()
    await toggleSpectate(4)
    expect(callLua).toHaveBeenCalledWith('stopSpectate')
  })

  it('tells Lua to stop when stopSpectate is called', async () => {
    await toggleSpectate(3)
    vi.mocked(callLua).mockClear()

    await stopSpectate()
    expect(callLua).toHaveBeenCalledWith('stopSpectate')
  })
})
