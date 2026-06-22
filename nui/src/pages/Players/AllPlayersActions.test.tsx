import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllPlayersActions } from './AllPlayersActions'
import { ModalProvider } from '../../ModalContext'
import type { Permissions } from '../../types'

const wrapWithModal = (ui: React.ReactNode) => (
  <ModalProvider>{ui}</ModalProvider>
)

const renderActions = (permissions: Permissions) =>
  render(wrapWithModal(<AllPlayersActions permissions={permissions} />), {
    wrapper: ({ children }) => <>{children}</>,
  })

describe('AllPlayersActions', () => {
  it('renders nothing when no relevant permissions are granted', () => {
    renderActions({})
    expect(screen.queryByText('Teleport everyone to me')).not.toBeInTheDocument()
  })

  it('renders the teleport button when player.teleport.everyone is granted', () => {
    renderActions({ 'player.teleport.everyone': true })
    expect(screen.getByText('Teleport everyone to me')).toBeInTheDocument()
  })

  it('renders nothing when only server.mute.global is granted (moved to Server page)', () => {
    renderActions({ 'server.mute.global': true })
    expect(screen.queryByText('Teleport everyone to me')).not.toBeInTheDocument()
    expect(screen.queryByText('Enable Emergency Mode')).not.toBeInTheDocument()
    expect(screen.queryByText('Disable Emergency Mode')).not.toBeInTheDocument()
  })

  it('renders only the teleport button when both permissions are granted', () => {
    renderActions({
      'player.teleport.everyone': true,
      'server.mute.global': true,
    })
    expect(screen.getByText('Teleport everyone to me')).toBeInTheDocument()
    expect(screen.queryByText('Enable Emergency Mode')).not.toBeInTheDocument()
  })

  it('opens a confirmation modal when clicking Teleport everyone', async () => {
    const user = userEvent.setup()
    renderActions({ 'player.teleport.everyone': true })

    await user.click(screen.getByRole('button', { name: /teleport everyone to me/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByText(/This will teleport every player/)).toBeInTheDocument()
  })
})
