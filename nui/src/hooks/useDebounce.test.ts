import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 200))
    expect(result.current).toBe('initial')
  })

  it('does not update synchronously', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'b' })
    // Before timer fires, value is still the old one
    expect(result.current).toBe('a')
  })

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('b')
  })
})
