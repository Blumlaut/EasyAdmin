import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'

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

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlString = url.toString()
    if (urlString.includes('requestServerStats')) {
      return Promise.resolve({ json: () => Promise.resolve(mockStats) } as Response)
    }
    if (urlString.includes('requestPlayerHistory')) {
      return Promise.resolve({ json: () => Promise.resolve(mockHistory) } as Response)
    }
    return Promise.resolve({ json: () => Promise.resolve({ ok: true }) } as Response)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Dashboard', () => {
  it('shows skeleton loaders while fetching stats', () => {
    render(<Dashboard playerCount={5} />)
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders stat cards after stats load', async () => {
    render(<Dashboard playerCount={5} />)
    await waitFor(() => {
      expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
  })

  it('renders resource stats', async () => {
    render(<Dashboard playerCount={3} />)
    await waitFor(() => {
      expect(screen.queryByText('78/85')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('78/85')).toBeInTheDocument()
  })

  it('renders the player capacity gauge', async () => {
    render(<Dashboard playerCount={10} />)
    await waitFor(() => {
      expect(screen.queryByText(/% full/)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText(/% full/)).toBeInTheDocument()
  })

  it('renders the sparkline chart section', async () => {
    render(<Dashboard playerCount={5} />)
    await waitFor(() => {
      expect(screen.queryByText('Players Over Time')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('Players Over Time')).toBeInTheDocument()
  })

  it('renders world entities section', async () => {
    render(<Dashboard playerCount={5} />)
    await waitFor(() => {
      expect(screen.queryByText('World Entities')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByText('World Entities')).toBeInTheDocument()
    expect(screen.getByText('Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Peds')).toBeInTheDocument()
    expect(screen.getByText('Objects')).toBeInTheDocument()
  })
})
