import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CachedPlayersPage } from './CachedPlayersPage'
import { ModalProvider } from '../../ModalContext'
import type { CachedPlayer } from '../../types'

const players: CachedPlayer[] = [
  { id: 11, name: 'Zed' },
  { id: 12, name: 'Yan' },
  { id: 13, name: 'Xan' },
]

function renderPage() {
  return render(
    <ModalProvider>
      <CachedPlayersPage cachedPlayers={players} loading={false} onRefresh={() => {}} />
    </ModalProvider>,
  )
}

describe('CachedPlayersPage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders all cached players', () => {
    renderPage()
    expect(screen.getByText('Zed')).toBeInTheDocument()
    expect(screen.getByText('Yan')).toBeInTheDocument()
    expect(screen.getByText('Xan')).toBeInTheDocument()
  })

  it('shows an empty state when there are no cached players', () => {
    render(
      <ModalProvider>
        <CachedPlayersPage cachedPlayers={[]} loading={false} onRefresh={() => {}} />
      </ModalProvider>,
    )
    expect(screen.getByText('No cached players')).toBeInTheDocument()
  })

  it('keyboard: search bridges into the grid and one zone per row', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByLabelText('Search cached players') as HTMLInputElement
    const banButtons = screen.getAllByRole('button', { name: 'Ban' })
    expect(banButtons).toHaveLength(3)

    // useInitialFocus puts focus on the search bar when the page mounts
    expect(document.activeElement).toBe(search)

    // The row bodies are not interactive here — the only focusable element
    // per row is the Ban button, so the grid must be one zone per row.
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(banButtons[0])

    // Must land on the NEXT row's button — not skip a row
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(banButtons[1])

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(banButtons[2])

    // At the bottom — stays
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(banButtons[2])

    // Bridge back up: from the first row's button, ArrowUp returns to search
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(document.activeElement).toBe(banButtons[0])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(search)
  })

  it('keyboard: ArrowLeft/Right do not cross row boundaries', async () => {
    const user = userEvent.setup()
    renderPage()

    const search = screen.getByLabelText('Search cached players') as HTMLInputElement
    const banButtons = screen.getAllByRole('button', { name: 'Ban' })

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(banButtons[0])

    // Single-zone rows: horizontal keys are no-ops, focus must not jump
    // to the next row's button
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(banButtons[0])
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(banButtons[0])
  })
})
