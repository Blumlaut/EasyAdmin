import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('returns the first page items by default', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 2))
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems).toEqual([1, 2])
    expect(result.current.totalPages).toBe(3)
  })

  it('advances and retreats pages', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 2))

    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
    expect(result.current.pageItems).toEqual([3, 4])

    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('does not go past bounds', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3], 2))

    act(() => result.current.nextPage())
    act(() => result.current.nextPage())
    act(() => result.current.nextPage()) // already at last page
    expect(result.current.page).toBe(2)

    act(() => result.current.prevPage())
    act(() => result.current.prevPage()) // already at first
    expect(result.current.page).toBe(1)
  })

  it('goToPage clamps to valid range', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 2))
    act(() => result.current.goToPage(99))
    expect(result.current.page).toBe(3)
    act(() => result.current.goToPage(-5))
    expect(result.current.page).toBe(1)
  })

  it('resets to first page', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 2))
    act(() => result.current.nextPage())
    act(() => result.current.reset())
    expect(result.current.page).toBe(1)
  })
})
