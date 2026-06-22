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
  it('renders no buttons when no relevant permissions are granted', () => {
    renderActions({})
    expect(screen.queryByText('Teleport everyone to me')).not.toBeInTheDocument()
    expect(screen.queryByText('Enable Emergency Mode')).not.toBeInTheDocument()
    expect(screen.queryByText('Disable Emergency Mode')).not.toBeInTheDocument()
  })

  it('renders the teleport button when player.teleport.everyone is granted', () => {
    renderActions({ 'player.teleport.everyone': true })
    expect(screen.getByText('Teleport everyone to me')).toBeInTheDocument()
  })

  it('renders the emergency mode button when server.mute.global is granted', () => {
    renderActions({ 'server.mute.global': true })
    expect(screen.getByText('Enable Emergency Mode')).toBeInTheDocument()
  })

  it('renders both buttons when both permissions are granted', () => {
    renderActions({
      'player.teleport.everyone': true,
      'server.mute.global': true,
    })
    expect(screen.getByText('Enable Emergency Mode')).toBeInTheDocument()
    expect(screen.getByText('Teleport everyone to me')).toBeInTheDocument()
  })

  it('shows the emergency mode button as danger variant when not muted', () => {
    renderActions({ 'server.mute.global': true })
    const btn = screen.getByRole('button', { name: /enable emergency mode/i })
    expect(btn).toHaveClass('btn-danger')
  })

  it('opens a confirmation modal when clicking Enable Emergency Mode', async () => {
    const user = userEvent.setup()
    renderActions({ 'server.mute.global': true })

    await user.click(screen.getByRole('button', { name: /enable emergency mode/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByText(/This will mute ALL player chat/)).toBeInTheDocument()
  })

  it('reflects global mute state from NUI event', async () => {
    renderActions({ 'server.mute.global': true })
    expect(screen.getByRole('button', { name: /enable emergency mode/i })).toBeInTheDocument()

    // Simulate the server pushing globalMuteState = true
    window.postMessage(
      { action: 'globalMuteState', data: { enabled: true } },
      '*',
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disable emergency mode/i })).toBeInTheDocument()
    })

    const btn = screen.getByRole('button', { name: /disable emergency mode/i })
    expect(btn).toHaveClass('btn-success')
  })

  it('opens a different confirmation modal when clicking Disable Emergency Mode', async () => {
    const user = userEvent.setup()
    renderActions({ 'server.mute.global': true })

    // Simulate global mute being active
    window.postMessage(
      { action: 'globalMuteState', data: { enabled: true } },
      '*',
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disable emergency mode/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /disable emergency mode/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByText(/This will restore chat/)).toBeInTheDocument()
  })
})
