import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigation } from './Navigation'

const items = [
  { id: 'main', label: 'Dashboard', icon: 'home' as const },
  { id: 'players', label: 'Players', icon: 'users' as const, badge: 5 },
  { id: 'bans', label: 'Bans', icon: 'ban' as const, disabled: true },
]

const itemsWithSeparators = [
  { id: 'main', label: 'Dashboard', icon: 'home' as const },
  { id: 'players', label: 'Players', icon: 'users' as const },
  { type: 'separator' as const },
  { type: 'header' as const, label: 'Moderation' },
  { id: 'bans', label: 'Bans', icon: 'ban' as const },
  { id: 'reports', label: 'Reports', icon: 'flag' as const },
]

const dropdownItems = [
  { id: 'main', label: 'Dashboard', icon: 'home' as const },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: 'chart-bar' as const,
    children: [
      { id: 'player-statistics', label: 'Player Statistics', icon: 'users' as const },
      { id: 'server-metrics', label: 'Server Metrics', icon: 'activity' as const },
    ],
  },
  { id: 'settings', label: 'Settings', icon: 'settings' as const },
]

describe('Navigation', () => {
  it('renders all navigation items', () => {
    render(<Navigation items={items} activeId="main" onSelect={() => {}} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Bans')).toBeInTheDocument()
  })

  it('applies horizontal navigation class when requested', () => {
    render(<Navigation items={items} activeId="main" onSelect={() => {}} orientation="horizontal" />)
    expect(screen.getByRole('navigation')).toHaveClass('navigation--horizontal')
  })

  it('applies upward dropdown class for horizontal navigation when requested', () => {
    render(
      <Navigation
        items={dropdownItems}
        activeId="main"
        onSelect={() => {}}
        orientation="horizontal"
        dropdownDirection="up"
      />,
    )
    expect(screen.getByRole('navigation')).toHaveClass('navigation--dropdown-up')
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

  describe('dropdown items', () => {
    it('renders dropdown parent with children collapsed by default', () => {
      render(<Navigation items={dropdownItems} activeId="main" onSelect={() => {}} />)
      expect(screen.getByText('Statistics')).toBeInTheDocument()
      // Children are in DOM for animation but hidden via grid-template-rows: 0fr
      const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
      expect(dropdown).toBeInTheDocument()
      const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).not.toHaveClass('nav-dropdown-children-open')
    })

    it('expands dropdown when clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<Navigation items={dropdownItems} activeId="main" onSelect={onSelect} />)
      await user.click(screen.getByText('Statistics'))
      const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
      const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
      // Should navigate to first enabled child
      expect(onSelect).toHaveBeenCalledWith('player-statistics')
    })

    it('highlights parent when a child is active', () => {
      render(<Navigation items={dropdownItems} activeId="player-statistics" onSelect={() => {}} />)
      const parentBtn = screen.getByText('Statistics').closest('button')
      expect(parentBtn).toHaveClass('nav-dropdown-parent-active')
      const childBtn = screen.getByText('Player Statistics').closest('button')
      expect(childBtn).toHaveClass('nav-item-active')
    })

    it('auto-expands dropdown when child is active', () => {
      render(<Navigation items={dropdownItems} activeId="server-metrics" onSelect={() => {}} />)
      const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
      const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
    })

    it('collapses dropdown on second click', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<Navigation items={dropdownItems} activeId="player-statistics" onSelect={() => {}} />)
      // Dropdown should be expanded (auto-expand because child is active)
      const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
      const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
      // Click to collapse
      await user.click(screen.getByText('Statistics'))
      expect(childrenContainer).not.toHaveClass('nav-dropdown-children-open')
    })
  })

  describe('separators and headers', () => {
    it('renders separator elements', () => {
      render(<Navigation items={itemsWithSeparators} activeId="main" onSelect={() => {}} />)
      const separators = document.querySelectorAll('.nav-separator')
      expect(separators.length).toBe(1)
    })

    it('renders header elements with label', () => {
      render(<Navigation items={itemsWithSeparators} activeId="main" onSelect={() => {}} />)
      expect(screen.getByText('Moderation')).toBeInTheDocument()
      const header = screen.getByText('Moderation').closest('.nav-header')
      expect(header).toBeInTheDocument()
      // Header should not be a button
      expect(header?.tagName).not.toBe('BUTTON')
    })

    it('renders nav items alongside separators and headers', () => {
      render(<Navigation items={itemsWithSeparators} activeId="main" onSelect={() => {}} />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Players')).toBeInTheDocument()
      expect(screen.getByText('Bans')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Moderation')).toBeInTheDocument()
    })

    it('calls onSelect for items after separator', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<Navigation items={itemsWithSeparators} activeId="main" onSelect={onSelect} />)
      await user.click(screen.getByText('Bans'))
      expect(onSelect).toHaveBeenCalledWith('bans')
    })
  })
})
