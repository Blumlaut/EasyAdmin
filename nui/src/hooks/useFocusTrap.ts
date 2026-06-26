import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus inside a container element.
 * Saves the previously focused element and restores it on cleanup.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null)
 *   useFocusTrap(ref)
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>) {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return () => {}
    }

    // Capture a non-null reference for the closure
    const host = container

    // Save the element that had focus before the modal opened
    previouslyFocused.current = document.activeElement as HTMLElement

    // Move focus into the modal (first focusable element or the container itself)
    const focusable = host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    if (focusable.length > 0) {
      focusable[0].focus()
    } else {
      host.setAttribute('tabindex', '-1')
      host.focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const focusableNow = Array.from(
        host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )

      if (focusableNow.length === 0) return

      const first = focusableNow[0]
      const last = focusableNow[focusableNow.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that was focused before the modal
      if (previouslyFocused.current) {
        previouslyFocused.current.focus()
      }
    }
  }, [containerRef])
}
