import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Manages pagination state for a list.
 * - `page` is 1-indexed
 * - `items` is the full list
 * - `pageSize` defaults to 10
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // If items shrink below current page, fall back to the last page
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

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
    page,
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
