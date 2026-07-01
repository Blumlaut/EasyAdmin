import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import type { UpdateInfo } from '../../types'

const mockStats = {
  maxPlayers: 48,
  resources: { total: 85, started: 78, stopped: 7 },
  entities: { vehicles: 142, peds: 387, objects: 1253 },
}

const mockHistory: Array<{ timestamp: number; count: number }> = [
  { timestamp: Date.now() / 1000 - 3600, count: 3 },
  { timestamp: Date.now() / 1000 - 1800, count: 5 },
  { timestamp: Date.now() / 1000, count: 5 },
]

const defaultProps = {
  playerCount: 5,
  updateInfo: null as UpdateInfo | null,
  onDismissUpdate: vi.fn(),
}

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlString = url.toString()
    if (urlString.includes('requestServerStats')) {
      return Promise.resolve({ json: () => Promise.resolve(mockStats) } as Response)
    }
    if (urlString.includes('requestPlayerHistory')) {
      return Promise.resolve({ json: () => Promise.resolve(mockHistory) } as Response)
    }
    if (urlString.includes('requestUpdateInfo')) {
      return Promise.resolve({ json: () => Promise.resolve({ ok: true }) } as Response)
    }
    if (urlString.includes('requestIntegrityStatus')) {
      return Promise.resolve({ json: () => Promise.resolve({ checked: true, passed: true, totalFiles: 100 }) } as Response)
    }
    return Promise.resolve({ json: () => Promise.resolve({ ok: true }) } as Response)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Dashboard', () => {
  it('shows skeleton loaders while fetching stats', () => {
    render(<Dashboard {...defaultProps} />)
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders stat cards after stats load', async () => {
    render(<Dashboard {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
  })

  it('renders resource stats', async () => {
    render(<Dashboard {...defaultProps} playerCount={3} />)
    await waitFor(() => {
      expect(screen.queryByText('78/85')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('78/85')).toBeInTheDocument()
  })

  it('renders the player capacity gauge', async () => {
    render(<Dashboard {...defaultProps} playerCount={10} />)
    await waitFor(() => {
      expect(screen.queryByText(/% full/)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText(/% full/)).toBeInTheDocument()
  })

  it('renders the sparkline chart section', async () => {
    render(<Dashboard {...defaultProps} />)
    await waitFor(() => {
      expect(screen.queryByText('Players Over Time')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('Players Over Time')).toBeInTheDocument()
  })

  it('renders world entities section', async () => {
    render(<Dashboard {...defaultProps} />)
    await waitFor(() => {
      expect(screen.queryByText('World Entities')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('World Entities')).toBeInTheDocument()
    expect(screen.getByText('Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Peds')).toBeInTheDocument()
    expect(screen.getByText('Objects')).toBeInTheDocument()
  })

  it('shows update banner when update is available', async () => {
    render(<Dashboard
      {...defaultProps}
      updateInfo={{ currentVersion: '7.52', latestVersion: '7.53', available: true }}
    />)
    await waitFor(() => {
      expect(screen.queryByText('Update available')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('Update available')).toBeInTheDocument()
    expect(screen.getByText(/7.53 is available/)).toBeInTheDocument()
  })

  it('does not show update banner when no update', async () => {
    render(<Dashboard {...defaultProps} />)
    await waitFor(() => {
      expect(screen.queryByText('Update available')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('calls onDismissUpdate when dismiss button is clicked', async () => {
    const onDismissUpdate = vi.fn()
    render(<Dashboard
      {...defaultProps}
      updateInfo={{ currentVersion: '7.52', latestVersion: '7.53', available: true }}
      onDismissUpdate={onDismissUpdate}
    />)
    await waitFor(() => {
      expect(screen.queryByText('Update available')).toBeInTheDocument()
    }, { timeout: 3000 })
    const dismissBtn = screen.getByLabelText('Dismiss')
    dismissBtn.click()
    expect(onDismissUpdate).toHaveBeenCalled()
  })

  it('renders CopyButton in update banner', async () => {
    render(<Dashboard
      {...defaultProps}
      updateInfo={{ currentVersion: '7.52', latestVersion: '7.53', available: true }}
    />)
    await waitFor(() => {
      expect(screen.queryByText('Copy URL')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('Copy URL')).toBeInTheDocument()
  })
})
