import { renderHook } from '@testing-library/react'
import { useInitialFocus } from './useInitialFocus'

describe('useInitialFocus', () => {
  beforeEach(() => {
    // Reset the jsdom environment provided by vitest
    document.body.innerHTML = ''
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
