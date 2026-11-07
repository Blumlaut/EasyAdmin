import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerListPage } from './PlayerListPage'
import { ModalProvider } from '../../ModalContext'
import { callLua } from '../../fivem'
import type { Permissions, Player } from '../../types'

vi.mock('../../fivem', () => ({
  callLua: vi.fn(() => Promise.resolve({ ok: true })),
  on: vi.fn(() => () => {}),
}))

const players: Player[] = [
  { id: 1, name: 'Alice', license: 'license:abc123' },
  { id: 2, name: 'Bob', license: 'license:def456' },
]

function renderList() {
  return render(
    <ModalProvider>
      <PlayerListPage
        players={players}
        loading={false}
        permissions={{ 'player.spectate': true } as Permissions}
        onSelectPlayer={() => {}}
        onOpenCached={() => {}}
        onRefresh={() => {}}
      />
    </ModalProvider>,
  )
}

describe('PlayerListPage spectate button', () => {
  beforeEach(async () => {
    // The spectate store keeps module state, so leave spectator mode first
    await act(async () => {
      await callLua('stopSpectate')
    })
    vi.mocked(callLua).mockClear()
  })

  it('starts spectating on the first click and stops on the second', async () => {
    const user = userEvent.setup()
    const { container } = renderList()
    const eye = container.querySelectorAll('.quick-action-btn')[0]

    await user.click(eye)
    expect(callLua).toHaveBeenCalledWith('spectatePlayer', { id: 1 })

    await user.click(eye)
    expect(callLua).toHaveBeenCalledWith('stopSpectate')
  })

  it('marks the row it is watching', async () => {
    const user = userEvent.setup()
    const { container } = renderList()
    const eye = container.querySelectorAll('.quick-action-btn')[0]

    await user.click(eye)
    expect(eye).toHaveClass('quick-action-btn--active')
  })
})
