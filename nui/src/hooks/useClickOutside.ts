import { useEffect } from 'react'

/**
 * Close something (dropdown, menu, etc.) when the user clicks outside
 * the given element or presses Escape.
 *
 * @param isOpen  Whether the overlay is currently open
 * @param onClose Callback to close the overlay
 * @param ref     React ref to the root element (clicks inside are ignored)
 */
export function useClickOutside(
  isOpen: boolean,
  onClose: () => void,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose, ref])
}
