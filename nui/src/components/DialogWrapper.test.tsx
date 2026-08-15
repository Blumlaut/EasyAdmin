import { describe, it, expect, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogWrapper } from './DialogWrapper'
import { useGridNavigation } from '../hooks/useGridNavigation'

function dispatchKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

/**
 * A page with a grid-navigable list (like a list page behind a modal).
 */
function GridList() {
  const listRef = useGridNavigation(() => 1)
  return (
    <div ref={listRef}>
      {[0, 1, 2].map((i) => (
        <button key={i} className="grid-item">
          row-{i}
        </button>
      ))}
    </div>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <GridList />
      <button id="open-modal" onClick={() => setOpen(true)}>
        open
      </button>
      {open && (
        <DialogWrapper title="Confirm action" onCancel={() => setOpen(false)}>
          <button className="dialog-action">Confirm</button>
          <button className="dialog-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </DialogWrapper>
      )}
    </>
  )
}

describe('DialogWrapper', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('moves focus into the dialog when it opens', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen_get('#open-modal'))
    // First focusable element in the dialog receives focus
    expect(document.activeElement).toBe(screen_get<HTMLElement>('.dialog-action'))
    expect(document.activeElement!.closest('.dialog')).not.toBeNull()
  })

  it('Home/End do not steal focus from an open dialog into the grid behind it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen_get('#open-modal'))
    const dialog = document.querySelector('.dialog') as HTMLElement

    // Focus various dialog elements and press Home/End — focus must stay inside
    for (const sel of ['.dialog-action', '.dialog-cancel']) {
      const el = screen_get<HTMLElement>(sel)
      act(() => { el.focus() })
      act(() => { dispatchKey('Home') })
      expect(document.activeElement!.closest('.dialog')).toBe(dialog)
      act(() => { dispatchKey('End') })
      expect(document.activeElement!.closest('.dialog')).toBe(dialog)
    }
  })

  it('Tab wraps within the dialog', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen_get('#open-modal'))
    // Focus is on the first focusable (Confirm). Tab → Cancel, Tab → wraps to Confirm.
    await user.tab()
    expect(document.activeElement).toBe(screen_get<HTMLElement>('.dialog-cancel'))
    await user.tab()
    expect(document.activeElement).toBe(screen_get<HTMLElement>('.dialog-action'))

    // Shift+Tab from first wraps to last
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(screen_get<HTMLElement>('.dialog-cancel'))
  })

  it('restores focus to the previously focused element when closed', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // The trap records whatever has focus when the modal mounts (the open
    // button, since clicking it focuses it) and must restore it on close.
    const openBtn = screen_get<HTMLElement>('#open-modal')
    act(() => { openBtn.focus() })
    await user.click(openBtn)

    await user.click(screen_get<HTMLElement>('.dialog-cancel'))

    expect(document.activeElement).toBe(openBtn)
  })
})

function screen_get<T extends HTMLElement = HTMLElement>(selector: string): T {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`not found: ${selector}`)
  return el as T
}
