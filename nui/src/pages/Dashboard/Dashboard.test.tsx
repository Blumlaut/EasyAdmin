import { act, render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from './Dashboard'

// Mock callLua to return server stats immediately
vi.mock('../../fivem', () => ({
  callLua: vi.fn().mockResolvedValue({
    maxPlayers: 48,
    resources: { total: 85, started: 78, stopped: 7 },
    entities: { vehicles: 142, peds: 387, objects: 1253 },
  }),
}))

describe('Dashboard', () => {
  it('shows skeleton loaders while fetching stats', () => {
    render(<Dashboard playerCount={5} />)
    // Skeleton elements should be present during loading
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders stat cards after stats load', async () => {
    render(<Dashboard playerCount={5} />)
    await act(async () => {
      await waitFor(() => {
        expect(screen.queryByText('Players Online')).toBeInTheDocument()
      })
    })
    expect(screen.getByText('Players Online')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders resource stats', async () => {
    render(<Dashboard playerCount={3} />)
    await act(async () => {
      await waitFor(() => {
        expect(screen.queryByText('Resources')).toBeInTheDocument()
      })
    })
    expect(screen.getByText('Resources')).toBeInTheDocument()
    expect(screen.getByText('78/85')).toBeInTheDocument()
  })

  it('renders the player capacity gauge', async () => {
    render(<Dashboard playerCount={10} />)
    await act(async () => {
      await waitFor(() => {
        // The gauge shows "slots available" text
        expect(screen.queryByText(/slots available/)).toBeInTheDocument()
      })
    })
    expect(screen.getByText(/slots available/)).toBeInTheDocument()
  })

  it('renders the sparkline chart section', async () => {
    render(<Dashboard playerCount={5} />)
    await act(async () => {
      await waitFor(() => {
        expect(screen.queryByText('Players Over Time')).toBeInTheDocument()
      })
    })
    expect(screen.getByText('Players Over Time')).toBeInTheDocument()
  })

  it('renders world entities section', async () => {
    render(<Dashboard playerCount={5} />)
    await act(async () => {
      await waitFor(() => {
        expect(screen.queryByText('World Entities')).toBeInTheDocument()
      })
    })
    expect(screen.getByText('World Entities')).toBeInTheDocument()
    expect(screen.getByText('Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Peds')).toBeInTheDocument()
    expect(screen.getByText('Objects')).toBeInTheDocument()
  })
})
