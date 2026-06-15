import { render, screen } from '@testing-library/react'
import { PlayerListPage } from './PlayerListPage'
import type { Permissions, Player } from '../../types'

const mockPlayers: Player[] = [
  { id: 1, name: 'Alice', license: 'license:abc123' },
  { id: 2, name: 'Bob', license: 'license:def456', frozen: true },
  { id: 3, name: 'Charlie', license: 'license:ghi789' },
]

describe('PlayerListPage', () => {
  it('renders all players passed in', () => {
    render(
      <PlayerListPage
        players={mockPlayers}
        loading={false}
        permissions={{} as Permissions}
        onSelectPlayer={() => {}}
        onOpenCached={() => {}}
        onToast={() => {}}
        onRefresh={() => {}}
        refreshKey={0}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows an empty state when no players are connected', () => {
    render(
      <PlayerListPage
        players={[]}
        loading={false}
        permissions={{} as Permissions}
        onSelectPlayer={() => {}}
        onOpenCached={() => {}}
        onToast={() => {}}
        onRefresh={() => {}}
        refreshKey={0}
      />,
    )
    expect(screen.getByText('No players connected')).toBeInTheDocument()
  })

  it('shows a cached players button', () => {
    render(
      <PlayerListPage
        players={mockPlayers}
        loading={false}
        permissions={{} as Permissions}
        onSelectPlayer={() => {}}
        onOpenCached={() => {}}
        onToast={() => {}}
        onRefresh={() => {}}
        refreshKey={0}
      />,
    )
    expect(screen.getByText('Cached players')).toBeInTheDocument()
  })
})
