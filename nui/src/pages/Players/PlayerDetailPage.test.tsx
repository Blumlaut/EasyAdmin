import { render, screen } from '@testing-library/react'
import { PlayerDetailPage } from './PlayerDetailPage'
import type { Permissions, Player } from '../../types'

const player: Player = {
  id: 1,
  name: 'Alice',
  license: 'license:abc',
  ip: '127.0.0.1',
  discord: 'alice#0001',
  frozen: true,
}

const permissions: Permissions = {
  'player.kick': true,
  'player.teleport.single': true,
}

describe('PlayerDetailPage', () => {
  it('renders player info', () => {
    render(
      <PlayerDetailPage
        player={player}
        permissions={permissions}
        ipPrivacy={false}
        onToast={() => {}}
      />,
    )
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('hides IP when ipPrivacy is true', () => {
    render(
      <PlayerDetailPage
        player={player}
        permissions={permissions}
        ipPrivacy
        onToast={() => {}}
      />,
    )
    expect(screen.queryByText('127.0.0.1')).not.toBeInTheDocument()
    expect(screen.getByText(/IP hidden by ea_IpPrivacy/)).toBeInTheDocument()
  })

  it('shows the teleport menu when player.teleport.single is permitted', () => {
    render(
      <PlayerDetailPage
        player={player}
        permissions={permissions}
        ipPrivacy={false}
        onToast={() => {}}
      />,
    )
    expect(screen.getByText('Teleport')).toBeInTheDocument()
  })

  it('hides the teleport menu without permission', () => {
    render(
      <PlayerDetailPage
        player={player}
        permissions={{} as Permissions}
        ipPrivacy={false}
        onToast={() => {}}
      />,
    )
    expect(screen.queryByText('Teleport')).not.toBeInTheDocument()
  })
})
