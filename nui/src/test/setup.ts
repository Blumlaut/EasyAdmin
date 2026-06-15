import '@testing-library/jest-dom'

// Mock FiveM NUI globals
window.GetParentResourceName = () => 'EasyAdmin'

// Mock fetch for NUI callbacks
const mockFetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ok: true }),
  })
)
global.fetch = mockFetch

// Mock window.addEventListener for NUI messages
beforeEach(() => {
  vi.clearAllMocks()
})
