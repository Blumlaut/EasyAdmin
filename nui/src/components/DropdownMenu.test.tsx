import { describe, it, expect, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu } from './DropdownMenu'

function dispatchKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/** Flush the double requestAnimationFrame used for open-time measurement/focus. */
async function flushFrames() {
  await act(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  })
}

function menuItems() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
}

function renderMenu(count = 3, onSelect?: () => void) {
  const definitions = Array.from({ length: count }, (_, i) => ({
    label: `Item ${i + 1}`,
    onSelect: () => (onSelect ? onSelect() : undefined),
  }))
  const utils = render(
    <div id="row">
      <span>row body</span>
      <DropdownMenu
        align="right"
        items={definitions}
        trigger={<button type="button" id="trigger-btn">open</button>}
      />,
    </div>,
  )
  return {
    ...utils,
    trigger: screen.getByRole('button', { name: 'open' }) as HTMLButtonElement,
  }
}

describe('DropdownMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('trigger wrapper is not a focusable grid target (no duplicate tab stop)', () => {
    const { container } = render(
      <DropdownMenu
        items={[{ label: 'A', onSelect: () => {} }]}
        trigger={<button type="button">open</button>}
      />,
    )
    // The trigger's wrapper must not add a second focusable/interactive element —
    // grid navigation would double-count it and misalign the row.
    const focusableInRow = container.querySelectorAll<HTMLElement>('[role="button"], button')
    expect(focusableInRow.length).toBe(1)
    const wrapper = (document.querySelector('button') as HTMLButtonElement).parentElement as HTMLElement
    expect(wrapper.getAttribute('role')).toBeNull()
    expect(wrapper.tabIndex).toBe(-1)
  })

  it('opens on trigger click and renders items in a portal outside the row', async () => {
    const user = userEvent.setup()
    const { container, trigger } = renderMenu(3)
    const row = container.querySelector('#row') as HTMLElement

    await user.click(trigger)
    await flushFrames()

    expect(menuItems()).toHaveLength(3)
    // Portal content must NOT be inside the row — otherwise grid navigation
    // would count open menu items as row zones.
    expect(row.querySelector('[role="menu"]')).toBeNull()
    expect(document.getElementById('ea-dropdown-portal')).not.toBeNull()
  })

  it('auto-focuses the first menu item when opened', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(3)

    await user.click(trigger)
    await flushFrames()

    expect(document.activeElement).toBe(menuItems()[0])
  })

  it('ArrowDown/ArrowUp navigate the open menu with wraparound', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(3)

    await user.click(trigger)
    await flushFrames()
    const items = menuItems()
    expect(document.activeElement).toBe(items[0])

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[1])

    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[2])

    // Wraps to first
    act(() => { dispatchKey('ArrowDown') })
    expect(document.activeElement).toBe(items[0])

    // ArrowUp from first wraps to last
    act(() => { dispatchKey('ArrowUp') })
    expect(document.activeElement).toBe(items[2])
  })

  it('Escape closes the menu', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(2)

    await user.click(trigger)
    await flushFrames()
    expect(menuItems()).toHaveLength(2)

    act(() => { dispatchKey('Escape') })
    expect(menuItems()).toHaveLength(0)
  })

  it('opens on keyboard activation (Enter) of the trigger button', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(2)

    act(() => { trigger.focus() })
    await user.keyboard('{Enter}')
    await flushFrames()
    expect(menuItems()).toHaveLength(2)
  })

  it('clicking a menu item selects it and closes the menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { trigger } = renderMenu(2, onSelect)

    await user.click(trigger)
    await flushFrames()
    await user.click(menuItems()[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(menuItems()).toHaveLength(0)
  })

  it('re-clicking the trigger closes the menu', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(2)

    await user.click(trigger)
    await flushFrames()
    expect(menuItems()).toHaveLength(2)

    // A second trigger click must close (not toggle shut-then-open again)
    await user.click(trigger)
    await flushFrames()
    expect(menuItems()).toHaveLength(0)

    // And the trigger still opens it on the next click
    await user.click(trigger)
    await flushFrames()
    expect(menuItems()).toHaveLength(2)
  })

  it('returns focus to the trigger when closed with Escape', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(2)

    await user.click(trigger)
    await flushFrames()
    expect(document.activeElement).toBe(menuItems()[0])

    act(() => { dispatchKey('Escape') })
    expect(menuItems()).toHaveLength(0)
    // Focus must not be left on body — it belongs back on the trigger
    expect(document.activeElement).toBe(trigger)
  })

  it('returns focus to the trigger after an item is selected', async () => {
    const user = userEvent.setup()
    const { trigger } = renderMenu(2)

    await user.click(trigger)
    await flushFrames()
    await user.click(menuItems()[0])
    expect(menuItems()).toHaveLength(0)
    expect(document.activeElement).toBe(trigger)
  })

  it('does not steal focus back when closed by an outside click', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <DropdownMenu
          items={[{ label: 'A', onSelect: () => {} }]}
          trigger={<button type="button" id="outside-trigger">open</button>}
        />
        <button type="button" id="elsewhere">elsewhere</button>
      </div>,
    )
    const trigger = document.querySelector('#outside-trigger') as HTMLElement

    await user.click(trigger)
    await flushFrames()
    expect(menuItems()).toHaveLength(1)

    await user.click(document.querySelector('#elsewhere') as HTMLElement)
    await flushFrames()
    expect(menuItems()).toHaveLength(0)
    // The outside click owns focus — the menu must not take it back
    expect(document.activeElement).toBe(document.querySelector('#elsewhere'))
  })
})
