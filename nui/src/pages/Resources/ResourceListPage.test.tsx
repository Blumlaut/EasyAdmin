import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResourceListPage } from './ResourceListPage'
import { ModalProvider } from '../../ModalContext'
import type { Permissions, ResourceEntry, ResourceMetadata } from '../../types'

const resources: ResourceEntry[] = [
  // started + repository + actionable → body + copy + restart + stop = 4 zones
  { name: 'alpha', state: 'started', repository: 'https://github.com/acme/alpha' },
  // stopped, no repository, actionable → body + start = 2 zones
  { name: 'bravo', state: 'stopped' },
  // started + repository + PROTECTED → body + copy only = 2 zones
  { name: 'charlie', state: 'started', isProtected: true, repository: 'https://github.com/acme/charlie' },
]

/** Point callLua at per-action fixtures. */
function mockBackend(fixtures: Record<string, unknown>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const action = url.split('/').pop() ?? ''
    const body = fixtures[action] ?? { ok: true }
    return { json: () => Promise.resolve(body) } as Response
  }) as unknown as typeof fetch
}

function renderPage(permissions: Permissions = {
  'server.resources.start': true,
  'server.resources.stop': true,
}) {
  mockBackend({
    requestResources: { resources, protected: '' },
    requestResourceMetadataBatch: { metadata: [] as ResourceMetadata[] },
  })
  return render(
    <ModalProvider>
      <ResourceListPage permissions={permissions} onSelectResource={() => {}} />
    </ModalProvider>,
  )
}

function rowsOf(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.list-item'))
}

function buttonsOf(row: HTMLElement): HTMLButtonElement[] {
  return Array.from(row.querySelectorAll<HTMLButtonElement>('button'))
}

describe('ResourceListPage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders all resources after loading', async () => {
    renderPage()
    expect(await screen.findByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('bravo')).toBeInTheDocument()
    expect(screen.getByText('charlie')).toBeInTheDocument()
  })

  it('derives per-row zones from the actual row content (dynamic zones)', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await screen.findByText('alpha')

    const rows = rowsOf(container)
    expect(rows).toHaveLength(3)

    // Zone counts derived from each row's real content
    expect(buttonsOf(rows[0])).toHaveLength(3) // alpha: copy + restart + stop
    expect(buttonsOf(rows[1])).toHaveLength(1) // bravo: start
    expect(buttonsOf(rows[2])).toHaveLength(1) // charlie (protected): copy
  })

  it('keyboard: navigation follows the dynamic zone layout row by row', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await screen.findByText('alpha')

    const rows = rowsOf(container)
    const search = screen.getByLabelText('Search resources') as HTMLInputElement

    const [alphaCopy, alphaRestart, alphaStop] = buttonsOf(rows[0])
    const [bravoStart] = buttonsOf(rows[1])

    // Search → alpha's row body
    expect(document.activeElement).toBe(search)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[0])

    // Across alpha's 4 zones: body → copy → restart → stop
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(alphaCopy)
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(alphaRestart)
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(alphaStop)

    // At alpha's right edge — stays
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(alphaStop)

    // Down into bravo's 2-zone row: zone 3 clamps to bravo's last zone (start)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(bravoStart)

    // Back up: zone 1 of alpha's row (the copy button)
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(alphaCopy)

    // To the row body, then back to the search bar
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(rows[0])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(search)
  })

  it('keyboard: without action permissions rows are single-zone', async () => {
    const user = userEvent.setup()
    const { container } = renderPage({}) // no start/stop permission
    await screen.findByText('alpha')

    const rows = rowsOf(container)

    // No action buttons render — only the copy buttons remain
    expect(buttonsOf(rows[0])).toHaveLength(1) // alpha: copy
    expect(buttonsOf(rows[1])).toHaveLength(0) // bravo: nothing
    expect(buttonsOf(rows[2])).toHaveLength(1) // charlie: copy

    const search = screen.getByLabelText('Search resources') as HTMLInputElement
    const alphaCopy = buttonsOf(rows[0])[0]
    const charlieCopy = buttonsOf(rows[2])[0]

    expect(document.activeElement).toBe(search)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[0])

    // alpha: body → copy
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(alphaCopy)

    // down: bravo's row is body-only → same zone 0 (bravo's body)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[1])

    // down from bravo (zone 0) → charlie's body
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(rows[2])

    // right → charlie's copy button
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(charlieCopy)
  })
})
