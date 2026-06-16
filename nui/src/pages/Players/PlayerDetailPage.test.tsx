import { render, screen } from '@testing-library/react'
import { PlayerDetailPage } from './PlayerDetailPage'
import { ModalProvider } from '../../ModalContext'
import type { Permissions, Player, ReasonShortcut } from '../../types'

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

const shortcuts: ReasonShortcut[] = []

function wrap(ui: React.ReactElement) {
  return (
    <ModalProvider
      cleanupTypes={['cars']}
      onToast={() => {}}
    >
      {ui}
    </ModalProvider>
  )
}

describe('PlayerDetailPage', () => {
  it('renders player info', () => {
    render(
      wrap(
        <PlayerDetailPage
          player={player}
          permissions={permissions}
          ipPrivacy={false}
          shortcuts={shortcuts}
          onToast={() => {}}
        />,
      ),
    )
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('hides IP when ipPrivacy is true', () => {
    render(
      wrap(
        <PlayerDetailPage
          player={player}
          permissions={permissions}
          ipPrivacy
          shortcuts={shortcuts}
          onToast={() => {}}
        />,
      ),
    )
    expect(screen.queryByText('127.0.0.1')).not.toBeInTheDocument()
    expect(screen.getByText(/IP hidden by ea_IpPrivacy/)).toBeInTheDocument()
  })

  it('shows the actions panel when permissions exist', () => {
    render(
      wrap(
        <PlayerDetailPage
          player={player}
          permissions={permissions}
          ipPrivacy={false}
          shortcuts={shortcuts}
          onToast={() => {}}
        />,
      ),
    )
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('shows teleport dropdown button with permission', () => {
    render(
      wrap(
        <PlayerDetailPage
          player={player}
          permissions={permissions}
          ipPrivacy={false}
          shortcuts={shortcuts}
          onToast={() => {}}
        />,
      ),
    )
    expect(screen.getByText('Teleport')).toBeInTheDocument()
  })

  it('hides teleport dropdown without permission', () => {
    render(
      wrap(
        <PlayerDetailPage
          player={player}
          permissions={{} as Permissions}
          ipPrivacy={false}
          shortcuts={shortcuts}
          onToast={() => {}}
        />,
      ),
    )
    expect(screen.queryByText('Teleport')).not.toBeInTheDocument()
  })
})
