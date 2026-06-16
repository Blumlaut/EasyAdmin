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

const shortcuts: ReasonShortcut[] = []

function wrap(ui: React.ReactElement, permissions: Permissions = { 'player.kick': true, 'player.teleport.single': true }) {
  return (
    <ModalProvider
      cleanupTypes={['cars']}
      onToast={() => {}}
    >
      <PlayerDetailPage
        player={player}
        permissions={permissions}
        ipPrivacy={false}
        shortcuts={shortcuts}
        onToast={() => {}}
      >
        {ui}
      </PlayerDetailPage>
    </ModalProvider>
  )
}

function renderDefault(ipPrivacy = false) {
  return render(
    <ModalProvider
      cleanupTypes={['cars']}
      onToast={() => {}}
    >
      <PlayerDetailPage
        player={player}
        permissions={{ 'player.kick': true, 'player.teleport.single': true }}
        ipPrivacy={ipPrivacy}
        shortcuts={shortcuts}
        onToast={() => {}}
      />
    </ModalProvider>
  )
}

describe('PlayerDetailPage', () => {
  it('renders player info', () => {
    renderDefault()
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('hides IP when ipPrivacy is true', () => {
    renderDefault(true)
    expect(screen.queryByText('127.0.0.1')).not.toBeInTheDocument()
    expect(screen.getByText(/IP hidden by ea_IpPrivacy/)).toBeInTheDocument()
  })

  it('shows the actions panel when permissions exist', () => {
    renderDefault()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('shows teleport dropdown button with permission', () => {
    renderDefault()
    expect(screen.getByText('Teleport')).toBeInTheDocument()
  })

  it('hides teleport dropdown without permission', () => {
    render(
      <ModalProvider
        cleanupTypes={['cars']}
        onToast={() => {}}
      >
        <PlayerDetailPage
          player={player}
          permissions={{} as Permissions}
          ipPrivacy={false}
          shortcuts={shortcuts}
          onToast={() => {}}
        />
      </ModalProvider>
    )
    expect(screen.queryByText('Teleport')).not.toBeInTheDocument()
  })
})
