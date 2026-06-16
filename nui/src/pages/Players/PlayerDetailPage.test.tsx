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

  it('shows IP in info panel regardless of ipPrivacy', () => {
    renderDefault(true)
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument()
  })

  it('shows the actions panel when permissions exist', () => {
    renderDefault()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('shows teleport section with permission', () => {
    renderDefault()
    expect(screen.getAllByText('Teleport').length).toBeGreaterThan(0)
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
