import { useCallback, useMemo, useState } from 'react'

/**
 * Manages pagination state for a list.
 * - `page` is 1-indexed
 * - `items` is the full list
 * - `pageSize` defaults to 10
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Clamp page to valid range so we never render an empty page when items shrink
  const clampedPage = useMemo(() => Math.min(page, totalPages), [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, clampedPage, pageSize])

  const goToPage = useCallback((p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1))
  }, [])

  const firstPage = useCallback(() => setPage(1), [])

  const lastPage = useCallback(() => setPage(totalPages), [totalPages])

  const reset = useCallback(() => setPage(1), [])

  return {
    page: clampedPage,
    totalPages,
    pageSize,
    pageItems,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  }
}
