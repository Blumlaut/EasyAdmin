import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createRef, type MutableRefObject } from 'react'
import { useGridNavigation } from './useGridNavigation'

// Helper: create a container with navigation-target children
// Uses role="button" to match the default selector
function setupContainer(rows: number, zonesPerRow: number) {
  const container = document.createElement('div')
  container.id = 'test-container'
  document.body.appendChild(container)

  const items: HTMLElement[] = []

  for (let r = 0; r < rows; r++) {
    for (let z = 0; z < zonesPerRow; z++) {
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

// Helper: create a container with button elements
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

describe('useGridNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('navigates up/down in a single-column list', () => {
    const { container, items } = setupContainer(3, 1)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1))

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
    const { container, items } = setupContainer(2, 3)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 3))

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
    const { container, items } = setupContainer(3, 2)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 2))

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

    const ref = createRef<HTMLDivElement>()
    ref.current = container
    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, (r) => zones[r] ?? 0))

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

  it('Home/End jump to first/last item', () => {
    const { container, items } = setupContainer(3, 2)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 2))

    act(() => { items[3].focus() })
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(items[0])

    act(() => { dispatchKey('End') })
    expect(document.activeElement).toBe(items[5])
  })

  it('works with native button elements', () => {
    const { container, buttons } = setupButtonContainer(2, 2)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 2))

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

    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1))

    // Only the row should be focusable via grid nav
    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(row)
  })

  it('does nothing when no items match', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 0))

    act(() => { dispatchKey('ArrowDown') })
    act(() => { dispatchKey('ArrowRight') })
    // No error, no focus change
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

    const ref = createRef<HTMLDivElement>()
    ref.current = container

    // 2 zones: first enabled button + second enabled button (disabled skipped)
    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1))

    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(enabled)

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(enabled2)
  })

  it('prevents default on handled keys', () => {
    const { container, items } = setupContainer(2, 1)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1))

    act(() => { items[0].focus() })
    const preventDefault = vi.fn()
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    Object.defineProperty(event, 'preventDefault', { value: preventDefault })

    act(() => { container.dispatchEvent(event) })
    expect(preventDefault).toHaveBeenCalled()
  })

  it('ignores unrelated keys', () => {
    const { container, items } = setupContainer(2, 1)
    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() => useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1))

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

    const ref = createRef<HTMLDivElement>()
    ref.current = container

    renderHook(() =>
      useGridNavigation(ref as MutableRefObject<HTMLDivElement>, () => 1, {
        itemSelector: '[data-nav="row"]',
      }),
    )

    act(() => { dispatchKey('Home') })
    expect(document.activeElement).toBe(container.querySelector('#nav-0'))

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(container.querySelector('#nav-1'))
  })
})
