import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerListPage } from './PlayerListPage'
import { ModalProvider } from '../../ModalContext'
import type { Permissions, Player } from '../../types'

const mockPlayers: Player[] = [
  { id: 1, name: 'Alice', license: 'license:abc123' },
  { id: 2, name: 'Bob', license: 'license:def456', frozen: true },
  { id: 3, name: 'Charlie', license: 'license:ghi789' },
]

const defaultProps = {
  loading: false,
  permissions: {} as Permissions,
  onSelectPlayer: () => {},
  onOpenCached: () => {},
  onToast: () => {},
  onRefresh: () => {},
  refreshKey: 0,
}

describe('PlayerListPage', () => {
  it('renders all players passed in', () => {
    render(
      <ModalProvider>
        <PlayerListPage
          players={mockPlayers}
          {...defaultProps}
        />
      </ModalProvider>,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows an empty state when no players are connected', () => {
    render(
      <ModalProvider>
        <PlayerListPage
          players={[]}
          {...defaultProps}
        />
      </ModalProvider>,
    )
    expect(screen.getByText('No players connected')).toBeInTheDocument()
  })

  it('shows a cached players button', () => {
    render(
      <ModalProvider>
        <PlayerListPage
          players={mockPlayers}
          {...defaultProps}
        />
      </ModalProvider>,
    )
    expect(screen.getByText('Cached players')).toBeInTheDocument()
  })

  describe('keyboard navigation', () => {
    // Full quick-action set: kick, ban, spectate, mute + slap (dropdown)
    // → zones per row = 1 (body) + 4 (quick actions) + 1 (dropdown) = 6
    const fullPermissions = {
      'player.kick': true,
      'player.ban.temporary': true,
      'player.spectate': true,
      'player.mute': true,
      'player.slap': true,
    } satisfies Permissions

    function renderWithActions() {
      return render(
        <ModalProvider>
          <PlayerListPage
            players={mockPlayers}
            {...defaultProps}
            permissions={fullPermissions}
          />
        </ModalProvider>,
      )
    }

    function rowButtons(row: Element): HTMLButtonElement[] {
      return Array.from(row.querySelectorAll<HTMLButtonElement>('button'))
    }

    beforeEach(() => {
      document.body.innerHTML = ''
    })

    it('search bridges into the grid with ArrowDown and back out with ArrowUp', async () => {
      const user = userEvent.setup()
      renderWithActions()

      const search = screen.getByLabelText('Search players') as HTMLInputElement
      const rows = screen.getAllByRole('button', { name: /Alice/ })
      const aliceRow = rows[0] as HTMLElement

      expect(document.activeElement).toBe(search)

      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(aliceRow)

      // Walk back to the search bar from the first row body
      await user.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(search)
    })

    it('zones align per row (body + quick actions + dropdown)', async () => {
      const user = userEvent.setup()
      renderWithActions()

      const search = screen.getByLabelText('Search players') as HTMLInputElement
      const aliceRow = screen.getByRole('button', { name: /Alice/ }) as HTMLElement
      const bobRow = screen.getByRole('button', { name: /Bob/ }) as HTMLElement

      // Row body + kick + ban + spectate + mute + dropdown chevron
      const aliceButtons = rowButtons(aliceRow)
      expect(aliceButtons).toHaveLength(5)
      const bobButtons = rowButtons(bobRow)
      expect(bobButtons).toHaveLength(5)

      expect(document.activeElement).toBe(search)
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(aliceRow)

      // Across the zones of Alice's row
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(aliceButtons[0]) // kick
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(aliceButtons[1]) // ban

      // Down keeps the same zone (ban) on the next row
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(bobButtons[1])

      // Up returns to the same zone on the previous row
      await user.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(aliceButtons[1])

      // Back to the row body, then up to the search bar
      await user.keyboard('{ArrowLeft}{ArrowLeft}')
      expect(document.activeElement).toBe(aliceRow)
      await user.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(search)
    })

    it('down from the last zone lands on the last zone of the next row', async () => {
      const user = userEvent.setup()
      renderWithActions()

      const search = screen.getByLabelText('Search players') as HTMLInputElement
      const aliceRow = screen.getByRole('button', { name: /Alice/ }) as HTMLElement
      const bobRow = screen.getByRole('button', { name: /Bob/ }) as HTMLElement
      const aliceButtons = rowButtons(aliceRow)
      const bobButtons = rowButtons(bobRow)

      expect(document.activeElement).toBe(search)
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(aliceRow)

      // Walk to the dropdown chevron (last zone) on Alice's row
      for (let i = 0; i < aliceButtons.length; i++) {
        await user.keyboard('{ArrowRight}')
      }
      expect(document.activeElement).toBe(aliceButtons[4])

      // Down keeps the same (last) zone on Bob's row
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(bobButtons[4])

      // At the right edge — stays
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(bobButtons[4])
    })
  })
})
