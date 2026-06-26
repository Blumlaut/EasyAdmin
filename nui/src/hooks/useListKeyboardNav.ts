import { useCallback, useEffect, useRef } from 'react'

/**
 * Arrow-key navigation for a list of focusable items.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useListKeyboardNav(containerRef, items.length)
 *
 * The hook collects child elements with role="button" or class="list-item"
 * and cycles focus between them on ArrowUp/ArrowDown.
 */
export function useListKeyboardNav(
  containerRef: React.RefObject<HTMLElement | null>,
  itemCount: number,
) {
  const itemsRef = useRef<HTMLElement[]>([])

  // Collect list item elements
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new MutationObserver(() => {
      itemsRef.current = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="button"], .list-item[tabindex]',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))
    })

    observer.observe(container, { childList: true, subtree: true })
    // Initial collection
    itemsRef.current = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[role="button"], .list-item[tabindex]',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))

    return () => observer.disconnect()
  }, [containerRef, itemCount])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const items = itemsRef.current
    if (items.length === 0) return

    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    let newIndex: number

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        newIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, items.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        newIndex = currentIndex === -1 ? items.length - 1 : Math.max(currentIndex - 1, 0)
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = items.length - 1
        break
      default:
        return
    }

    if (newIndex !== null && items[newIndex]) {
      items[newIndex].focus()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, handleKeyDown])
}
