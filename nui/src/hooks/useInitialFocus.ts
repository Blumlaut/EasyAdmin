import { useEffect } from 'react'

/**
 * Focus a target element when the component mounts.
 *
 * Used by pages to set keyboard focus to the first "important"
 * interactive element (search bar, first list item, etc.) when
 * the user navigates to the page.
 *
 * @example
 *   // Focus the search input on page entry
 *   const searchRef = useRef<HTMLInputElement>(null)
 *   useInitialFocus(searchRef)
 *
 * @example
 *   // Focus by CSS selector (useful when the target is inside a child component)
 *   useInitialFocus('.search-input')
 */
export function useInitialFocus(
  target: React.RefObject<HTMLElement | null> | string,
) {
  useEffect(() => {
    const el = typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target.current

    if (el) {
      el.focus()
    }
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount only
}
