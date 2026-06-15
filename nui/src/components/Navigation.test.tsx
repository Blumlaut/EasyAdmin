import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

const items = [
  { id: 'main', label: 'Dashboard', icon: 'home' as const },
  { id: 'players', label: 'Players', icon: 'users' as const, badge: 5 },
  { id: 'bans', label: 'Bans', icon: 'ban' as const, disabled: true },
]

describe('Navigation', () => {
  it('renders all navigation items', () => {
    render(<Navigation items={items} activeId="main" onSelect={() => {}} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Bans')).toBeInTheDocument()
  })

  it('shows badge when provided', () => {
    render(<Navigation items={items} activeId="main" onSelect={() => {}} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('highlights active item', () => {
    render(<Navigation items={items} activeId="players" onSelect={() => {}} />)
    const btn = screen.getByText('Players').closest('button')
    expect(btn).toHaveClass('nav-item-active')
  })

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Navigation items={items} activeId="main" onSelect={onSelect} />)
    await user.click(screen.getByText('Players'))
    expect(onSelect).toHaveBeenCalledWith('players')
  })

  it('marks disabled items as disabled', () => {
    render(<Navigation items={items} activeId="main" onSelect={() => {}} />)
    const bansBtn = screen.getByText('Bans').closest('button')
    expect(bansBtn).toBeDisabled()
  })
})
