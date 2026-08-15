import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGridNavigation } from './useGridNavigation'

// Helper: create a container with navigation-target children
// Uses role="button" to match the default selector
function setupContainer(rows: number, zonesPerRow: (r: number) => number) {
  const container = document.createElement('div')
  container.id = 'test-container'
  document.body.appendChild(container)

  const items: HTMLElement[] = []

  for (let r = 0; r < rows; r++) {
    for (let z = 0; z < zonesPerRow(r); z++) {
      const el = document.createElement('div')
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.textContent = `r${r}z${z}`
      el.id = `r${r}z${z}`
      container.appendChild(el)
      items.push(el)
    }
  }

  return { container, items }
}

// Helper: create a container with native button elements
function setupButtonContainer(rows: number, zonesPerRow: number) {
  const container = document.createElement('div')
  container.id = 'test-container-btn'
  document.body.appendChild(container)

  const buttons: HTMLButtonElement[] = []

  for (let r = 0; r < rows; r++) {
    for (let z = 0; z < zonesPerRow; z++) {
      const btn = document.createElement('button')
      btn.textContent = `r${r}z${z}`
      btn.id = `r${r}z${z}`
      container.appendChild(btn)
      buttons.push(btn)
    }
  }

  return { container, buttons }
}

function dispatchKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/** Render the hook and attach it to a container, simulating React's ref wiring. */
function attach(zones: (r: number) => number, container: HTMLElement, options?: Parameters<typeof useGridNavigation>[1]) {
  const { result } = renderHook(() => useGridNavigation(zones, options))
  act(() => { result.current(container) })
  return result
}

describe('useGridNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('navigates up/down in a single-column list', () => {
    const { container, items } = setupContainer(3, () => 1)
    attach(() => 1, container)

    act(() => { items[0].focus() })
    expect(document.activeElement).toBe(items[0])

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[2])

    // At bottom — stays
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[2])

    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[0])

    // At top — stays
    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[0])
  })

  it('navigates left/right within a row', () => {
    const { container, items } = setupContainer(2, () => 3)
    attach(() => 3, container)

    act(() => { items[0].focus() })
    expect(document.activeElement).toBe(items[0])

    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(items[2])

    // At right edge — stays
    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(items[2])

    act(() => { dispatchKey('ArrowLeft') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('ArrowLeft') })
    expect(document.activeElement).toBe(items[0])
  })

  it('navigates up/down across rows with multiple zones', () => {
    const { container, items } = setupContainer(3, () => 2)
    attach(() => 2, container)

    act(() => { items[0].focus() }) // r0z0
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[2]) // r1z0

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[4]) // r2z0

    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[2]) // r1z0

    // Switch to zone 1
    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(items[3]) // r1z1

    // Down from zone 1
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[5]) // r2z1

    // Up from zone 1 (r2z1 → r1z1)
    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[3]) // r1z1

    // Up again (r1z1 → r0z1)
    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[1]) // r0z1
  })

  it('handles variable zones per row', () => {
    const container = document.createElement('div')
    container.id = 'test-container-var'
    document.body.appendChild(container)

    const items: HTMLElement[] = []
    const zones = [1, 3, 2] // 6 total
    for (let z = 0; z < 6; z++) {
      const el = document.createElement('div')
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.textContent = `item${z}`
      el.id = `item${z}`
      container.appendChild(el)
      items.push(el)
    }
    // Layout: r0: [0] | r1: [1,2,3] | r2: [4,5]

    attach((r) => zones[r] ?? 0, container)

    act(() => { items[0].focus() }) // r0z0
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[1]) // r1z0

    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(items[2]) // r1z1

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[5]) // r2z1 (clamped)

    act(() => { dispatchKey('ArrowLeft') })
    expect(document.activeElement).toBe(items[4]) // r2z0

    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[1]) // r1z0
  })

  it('Home/End jump to first/last item when focus is inside the grid', () => {
    const { container, items } = setupContainer(3, () => 2)
    attach(() => 2, container)

    act(() => { items[3].focus() })
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(items[0])

    act(() => { dispatchKey('End') })
    expect(document.activeElement).toBe(items[5])
  })

  it('does not steal focus on Home/End when focus is outside the grid', () => {
    const { container, items } = setupContainer(2, () => 1)
    attach(() => 1, container)

    // Focus in a text input (e.g. search bar or modal field)
    const input = document.createElement('input')
    input.id = 'outside-input'
    document.body.appendChild(input)
    act(() => { input.focus() })

    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(input)

    act(() => { dispatchKey('End') })
    expect(document.activeElement).toBe(input)

    // Focus in an unrelated element
    const other = document.createElement('button')
    other.id = 'outside-btn'
    document.body.appendChild(other)
    act(() => { other.focus() })
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(other)

    // Home still works once focus is inside the grid
    act(() => { items[1].focus() })
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(items[0])
  })

  it('works when the container mounts after the hook (loading -> data)', () => {
    // Hook mounts first with no container (list still loading)
    const { result } = renderHook(() => useGridNavigation(() => 1))

    // Data arrives — list renders, ref gets attached
    const { container, items } = setupContainer(3, () => 1)
    act(() => { result.current(container) })

    act(() => { items[0].focus() })
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(items[0])
  })

  it('re-collects when the container is detached and re-attached', () => {
    const { result } = renderHook(() => useGridNavigation(() => 1))

    const first = setupContainer(2, () => 1)
    act(() => { result.current(first.container) })

    act(() => { first.items[0].focus() })
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(first.items[1])

    // Container removed (e.g. page unmount) and a new one mounted
    act(() => { result.current(null) })
    const second = setupContainer(2, () => 1)
    act(() => { result.current(second.container) })

    act(() => { second.items[0].focus() })
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(second.items[1])
  })

  it('collects items added after the container is attached (MutationObserver)', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    attach(() => 1, container)

    // Items appear later (e.g. async data into an already-mounted list)
    const items: HTMLElement[] = []
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div')
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.id = `added-${i}`
      container.appendChild(el)
      items.push(el)
    }
    // MutationObserver callbacks run in a microtask — flush before navigating
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    act(() => { items[0].focus() })
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[1])
  })

  it('works with native button elements', () => {
    const { container, buttons } = setupButtonContainer(2, 2)
    attach(() => 2, container)

    act(() => { buttons[0].focus() })
    act(() => { dispatchKey('ArrowRight') })
    expect(document.activeElement).toBe(buttons[1])

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(buttons[3])
  })

  it('ignores non-matching elements (labels, spans, etc.)', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Add non-interactive content that should NOT be matched
    const label = document.createElement('span')
    label.textContent = 'A label'
    container.appendChild(label)

    const subtitle = document.createElement('p')
    subtitle.className = 'list-item-subtitle'
    subtitle.textContent = 'Some subtitle'
    container.appendChild(subtitle)

    // Add one navigation target
    const row = document.createElement('div')
    row.setAttribute('role', 'button')
    row.setAttribute('tabindex', '0')
    row.id = 'row'
    container.appendChild(row)

    attach(() => 1, container)

    // Only the row should be focusable via grid nav
    act(() => { dispatchKey('Home') })
    // Home only acts when focus is inside the grid — none is, so nothing happens
    expect(document.activeElement).not.toBe(row)

    act(() => { row.focus() })
    act(() => { dispatchKey('End') })
    expect(document.activeElement).toBe(row)
  })

  it('does nothing when no items match', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    attach(() => 0, container)

    act(() => { dispatchKey('ArrowDown') })
    act(() => { dispatchKey('ArrowRight') })
    act(() => { dispatchKey('Home') })
    act(() => { dispatchKey('End') })
    // No error, no focus change
    expect(document.activeElement).toBe(document.body)
  })

  it('skips disabled elements', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const enabled = document.createElement('button')
    enabled.id = 'enabled'
    container.appendChild(enabled)

    const disabled = document.createElement('button')
    disabled.id = 'disabled'
    disabled.setAttribute('disabled', '')
    container.appendChild(disabled)

    const enabled2 = document.createElement('button')
    enabled2.id = 'enabled2'
    container.appendChild(enabled2)

    // 1 zone per row: enabled, enabled2 (disabled skipped)
    attach(() => 1, container)

    act(() => { enabled.focus() })
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(enabled2)
  })

  it('prevents default on handled keys', () => {
    const { container, items } = setupContainer(2, () => 1)
    attach(() => 1, container)

    act(() => { items[0].focus() })
    const preventDefault = vi.fn()
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    Object.defineProperty(event, 'preventDefault', { value: preventDefault })

    act(() => { container.dispatchEvent(event) })
    expect(preventDefault).toHaveBeenCalled()
  })

  it('ignores unrelated keys', () => {
    const { container, items } = setupContainer(2, () => 1)
    attach(() => 1, container)

    act(() => { items[0].focus() })
    act(() => { dispatchKey('a') })
    act(() => { dispatchKey('Tab') })
    expect(document.activeElement).toBe(items[0])
  })

  it('supports custom itemSelector option', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Create elements with a custom data attribute
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div')
      el.setAttribute('data-nav', 'row')
      el.setAttribute('tabindex', '0')
      el.id = `nav-${i}`
      container.appendChild(el)
    }

    attach(() => 1, container, { itemSelector: '[data-nav="row"]' })

    act(() => {
      const first = container.querySelector<HTMLElement>('#nav-0')
      first?.focus()
    })
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(container.querySelector('#nav-0'))

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(container.querySelector('#nav-1'))
  })

  describe('anchor (search input) bridging', () => {
    function setupWithAnchor(rows: number, zonesPerRow: number) {
      const { container, items } = setupContainer(rows, () => zonesPerRow)
      const anchor = document.createElement('input')
      anchor.id = 'search-anchor'
      document.body.appendChild(anchor)
      const anchorRef = { current: anchor as HTMLElement | null }
      attach(() => zonesPerRow, container, { anchor: anchorRef as React.RefObject<HTMLElement | null> })
      return { container, items, anchor }
    }

    it('ArrowDown in the anchor focuses the first grid item', () => {
      const { items, anchor } = setupWithAnchor(3, 2)

      act(() => { anchor.focus() })
      act(() => { dispatchKey('ArrowDown') })
      expect(document.activeElement).toBe(items[0])
    })

    it('does not bridge when the grid is empty', () => {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const anchor = document.createElement('input')
      document.body.appendChild(anchor)
      const anchorRef = { current: anchor as HTMLElement | null }
      attach(() => 1, container, { anchor: anchorRef as React.RefObject<HTMLElement | null> })

      act(() => { anchor.focus() })
      act(() => { dispatchKey('ArrowDown') })
      // No items — focus must stay on the anchor
      expect(document.activeElement).toBe(anchor)
    })

    it('ArrowUp from row 0 zone 0 returns focus to the anchor', () => {
      const { items, anchor } = setupWithAnchor(3, 2)

      act(() => { items[0].focus() })
      act(() => { dispatchKey('ArrowUp') })
      expect(document.activeElement).toBe(anchor)
    })

    it('ArrowUp from other zones/rows does not jump to the anchor', () => {
      const { items, anchor } = setupWithAnchor(3, 2)

      // Row 0, zone 1 — no row above, but not zone 0: stays put
      act(() => { items[1].focus() })
      act(() => { dispatchKey('ArrowUp') })
      expect(document.activeElement).toBe(items[1])

      // Row 1, zone 0 — moves up to row 0 zone 0, not to the anchor
      act(() => { items[2].focus() })
      act(() => { dispatchKey('ArrowUp') })
      expect(document.activeElement).toBe(items[0])
    })

    it('other keys in the anchor are not intercepted', () => {
      const { items, anchor } = setupWithAnchor(3, 2)

      act(() => { anchor.focus() })
      act(() => { dispatchKey('ArrowUp') })
      expect(document.activeElement).toBe(anchor)
      act(() => { dispatchKey('ArrowRight') })
      expect(document.activeElement).toBe(anchor)
    })
  })
})
