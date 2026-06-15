import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

describe('Navigation', () => {
  it('renders all navigation items', () => {
    render(<Navigation currentView="main" onNavigate={() => {}} playerCount={5} />)
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Server')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows player count badge', () => {
    render(<Navigation currentView="main" onNavigate={() => {}} playerCount={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('highlights active view', () => {
    render(<Navigation currentView="players" onNavigate={() => {}} playerCount={5} />)
    const playersItem = screen.getByText('Players')
    // Active item has blue text color
    expect(playersItem.closest('button')).toHaveStyle('color: var(--accent-blue)')
  })

  it('calls onNavigate when players is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Navigation currentView="main" onNavigate={onNavigate} playerCount={5} />)
    await user.click(screen.getByText('Players'))
    expect(onNavigate).toHaveBeenCalledWith('players')
  })

  it('does not navigate for disabled items', () => {
    const onNavigate = vi.fn()
    render(<Navigation currentView="main" onNavigate={onNavigate} playerCount={5} />)
    // Server and Settings are disabled (no onClick handler)
    const serverItem = screen.getByText('Server')
    expect(serverItem.closest('button')).toHaveStyle('cursor: default')
  })

  it('highlights player-detail as players view', () => {
    render(<Navigation currentView="player-detail" onNavigate={() => {}} playerCount={5} />)
    const playersItem = screen.getByText('Players')
    expect(playersItem.closest('button')).toHaveStyle('color: var(--accent-blue)')
  })
})
