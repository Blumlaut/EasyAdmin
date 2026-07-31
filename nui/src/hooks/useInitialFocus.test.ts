import { JSDOM } from 'jsdom'
import { act, renderHook } from '@testing-library/react'
import { useInitialFocus } from './useInitialFocus'

function setupDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  global.document = dom.window.document
  global.HTMLElement = dom.window.HTMLElement
}

describe('useInitialFocus', () => {
  beforeEach(() => {
    setupDom()
  })

  it('focuses the element referenced by a ref object', () => {
    const el = document.createElement('input')
    document.body.appendChild(el)
    const ref = { current: el }

    renderHook(() => useInitialFocus(ref))

    expect(document.activeElement).toBe(el)
  })

  it('focuses the element matched by a CSS selector', () => {
    const el = document.createElement('input')
    el.className = 'search-input'
    document.body.appendChild(el)

    renderHook(() => useInitialFocus('.search-input'))

    expect(document.activeElement).toBe(el)
  })

  it('does nothing when the ref is null', () => {
    const ref = { current: null }

    expect(() => {
      renderHook(() => useInitialFocus(ref))
    }).not.toThrow()
  })

  it('does nothing when the selector matches nothing', () => {
    expect(() => {
      renderHook(() => useInitialFocus('.nonexistent'))
    }).not.toThrow()
  })
})
