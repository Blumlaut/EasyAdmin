import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from './Dashboard'
import type { View } from '../../types'

describe('Dashboard', () => {
  it('renders welcome card', () => {
    render(<Dashboard onNavigate={() => {}} playerCount={0} availableViews={['main']} />)
    expect(screen.getByText(/Welcome to EasyAdmin/i)).toBeInTheDocument()
  })

  it('shows player count badge when players are online', () => {
    render(<Dashboard onNavigate={() => {}} playerCount={5} availableViews={['main', 'players']} />)
    expect(screen.getByText('5 online')).toBeInTheDocument()
  })

  it('navigates when a quick action is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <Dashboard
        onNavigate={onNavigate}
        playerCount={3}
        availableViews={['main', 'players', 'bans', 'reports', 'server', 'settings']}
      />,
    )
    await user.click(screen.getByText('Player Management'))
    expect(onNavigate).toHaveBeenCalledWith<[View]>('players')
  })

  it('hides quick actions that are not available', () => {
    render(<Dashboard onNavigate={() => {}} playerCount={0} availableViews={['main']} />)
    expect(screen.queryByText('Ban List')).not.toBeInTheDocument()
  })
})
