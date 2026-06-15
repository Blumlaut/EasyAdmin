import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerList } from './PlayerList'
import type { Player } from '../types'

function renderPlayerList(players: Player[], searchQuery = '', onSelectPlayer?: (p: Player) => void) {
  return render(
    <PlayerList
      players={players}
      loading={false}
      searchQuery={searchQuery}
      onSearchChange={() => {}}
      onSelectPlayer={onSelectPlayer ?? (() => {})}
    />,
  )
}

const mockPlayers: Player[] = [
  { id: 1, name: 'Alice', license: 'license:abc123', frozen: false, muted: false },
  { id: 2, name: 'Bob Builder', license: 'license:def456', frozen: true, muted: false },
  { id: 3, name: 'Charlie', license: 'license:ghi789', frozen: false, muted: true },
  { id: 4, name: 'Dev User', license: 'license:dev000', frozen: false, muted: false, developer: true },
]

describe('PlayerList', () => {
  it('renders all players', () => {
    renderPlayerList(mockPlayers)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob Builder')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Dev User')).toBeInTheDocument()
  })

  it('shows player IDs', () => {
    renderPlayerList(mockPlayers)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('filters players by name', () => {
    renderPlayerList(mockPlayers, 'bob')
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Builder')).toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })

  it('filters players by name (exact match)', () => {
    // Search by a unique name that doesn't appear in other fields
    renderPlayerList(mockPlayers, 'Dev User')
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Builder')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
    expect(screen.getByText('Dev User')).toBeInTheDocument()
  })

  it('filters are case-insensitive', () => {
    renderPlayerList(mockPlayers, 'alice')
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows frozen badge', () => {
    renderPlayerList(mockPlayers)
    expect(screen.getByText('Frozen')).toBeInTheDocument()
  })

  it('shows muted badge', () => {
    renderPlayerList(mockPlayers)
    expect(screen.getByText('Muted')).toBeInTheDocument()
  })

  it('shows developer badge', () => {
    renderPlayerList(mockPlayers)
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('calls onSelectPlayer when row is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPlayerList(mockPlayers, '', onSelect)

    const rows = screen.getAllByText('Alice')
    await user.click(rows[0])
    expect(onSelect).toHaveBeenCalledWith(mockPlayers[0])
  })

  it('shows no results message when filter matches nothing', () => {
    renderPlayerList(mockPlayers, 'nonexistent')
    expect(screen.getByText('No players match your search')).toBeInTheDocument()
  })

  it('shows empty message when no players', () => {
    renderPlayerList([])
    expect(screen.getByText('No players online')).toBeInTheDocument()
  })

  it('shows loading spinner', () => {
    render(
      <PlayerList
        players={[]}
        loading={true}
        searchQuery=""
        onSearchChange={() => {}}
        onSelectPlayer={() => {}}
      />,
    )
    // Spinner has no text, check for the element
    const spinner = document.querySelector('.spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('truncates long identifiers in display', () => {
    const longIdPlayer: Player = {
      id: 1,
      name: 'Test',
      identifier: 'steam:110000112345678901234567890abcdef',
      frozen: false,
      muted: false,
    }
    renderPlayerList([longIdPlayer])
    // The identifier is displayed truncated
    const identifierCell = screen.getByText(/steam:11000011234567/)
    expect(identifierCell).toBeInTheDocument()
  })
})
