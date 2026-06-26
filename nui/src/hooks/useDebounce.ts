import { useEffect, useState } from 'react'

/**
 * Returns a debounced version of `value` that only updates after `delay` ms of inactivity.
 *
 * Useful for search inputs that trigger filtering on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
