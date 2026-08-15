import { useState } from 'react'
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

  it('renders expanded dropdown children inline in horizontal mode', async () => {
    const user = userEvent.setup()
    render(<Navigation items={dropdownItems} activeId="main" onSelect={() => {}} orientation="horizontal" />)

    await user.click(screen.getByText('Statistics'))

    const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
    const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
    const childrenInner = dropdown?.querySelector('.nav-dropdown-children-inner')

    expect(dropdown).toBeInTheDocument()
    expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
    expect(childrenInner).toBeInTheDocument()
    expect(dropdown).toContainElement(screen.getByText('Player Statistics'))
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
      render(<Navigation items={dropdownItems} activeId="player-statistics" onSelect={() => {}} />)
      const dropdown = screen.getByText('Statistics').closest('.nav-dropdown')
      const childrenContainer = dropdown?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
    })

    it('collapses dropdown on second click', async () => {
      const user = userEvent.setup()
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

  describe('keyboard navigation', () => {
    /** Controlled wrapper so arrow-key navigation can advance across renders. */
    function ControlledNav({ items, orientation }: { items: Parameters<typeof Navigation>[0]['items']; orientation?: 'vertical' | 'horizontal' }) {
      const [active, setActive] = useState('main')
      return <Navigation items={items} orientation={orientation} activeId={active} onSelect={(id) => setActive(id)} />
    }

    function focusNavItem(label: string) {
      const btn = screen.getByText(label).closest('button')
      expect(btn).not.toBeNull()
      ;(btn as HTMLButtonElement).focus()
    }

    it('ArrowDown moves to the next item and focuses it', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} />)
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowDown}')
      const playersBtn = screen.getByText('Players').closest('button')
      expect(document.activeElement).toBe(playersBtn)
    })

    it('ArrowUp moves to the previous item', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} />)
      // Navigate down first so the controlled state is on 'players'
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowUp}')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })

    it('ArrowDown wraps from the last item to the first', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} />)
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}') // -> reports
      await user.keyboard('{ArrowDown}') // wraps
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })

    it('skips disabled items', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={items} />) // bans is disabled
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowDown}') // players (bans skipped, it's last)
      const playersBtn = screen.getByText('Players').closest('button')
      expect(document.activeElement).toBe(playersBtn)
      // From players, down wraps to main (bans still skipped)
      await user.keyboard('{ArrowDown}')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })

    it('Home focuses the first item and End the last', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} />)
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowDown}{ArrowDown}') // -> bans
      await user.keyboard('{End}')
      const reportsBtn = screen.getByText('Reports').closest('button')
      expect(document.activeElement).toBe(reportsBtn)
      await user.keyboard('{Home}')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })

    it('ignores non-nav keys', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} />)
      focusNavItem('Dashboard')
      await user.keyboard('{Enter} ')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })

    it('skips collapsed dropdown parents and navigates expanded children', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={dropdownItems} />)
      focusNavItem('Dashboard')
      // Collapsed: leaves are [Dashboard, Settings]
      await user.keyboard('{ArrowDown}')
      const settingsBtn = screen.getByText('Settings').closest('button')
      expect(document.activeElement).toBe(settingsBtn)
    })

    it('keyboard navigation traverses expanded dropdown children', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={dropdownItems} />)
      // Expand the dropdown — clicking it also auto-navigates to the first child
      await user.click(screen.getByText('Statistics'))
      const childrenContainer =
        screen.getByText('Statistics').closest('.nav-dropdown')?.querySelector('.nav-dropdown-children')
      expect(childrenContainer).toHaveClass('nav-dropdown-children-open')
      const childBtn = screen.getByText('Player Statistics').closest('button')

      // Leaves are now [Dashboard, Player Statistics, Settings] and the
      // active leaf is the child — ArrowUp exits it and moves to Dashboard
      await user.keyboard('{ArrowUp}')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)

      // ArrowDown re-enters the expanded dropdown child
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(childBtn)

      // And on again to Settings
      await user.keyboard('{ArrowDown}')
      const settingsBtn = screen.getByText('Settings').closest('button')
      expect(document.activeElement).toBe(settingsBtn)
    })

    it('horizontal orientation uses ArrowRight/ArrowLeft', async () => {
      const user = userEvent.setup()
      render(<ControlledNav items={itemsWithSeparators} orientation="horizontal" />)
      focusNavItem('Dashboard')
      await user.keyboard('{ArrowRight}')
      const playersBtn = screen.getByText('Players').closest('button')
      expect(document.activeElement).toBe(playersBtn)
      await user.keyboard('{ArrowLeft}')
      const mainBtn = screen.getByText('Dashboard').closest('button')
      expect(document.activeElement).toBe(mainBtn)
    })
  })
})
