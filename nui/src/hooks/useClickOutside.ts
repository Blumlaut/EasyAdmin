import { useEffect } from 'react'

/**
 * Close something (dropdown, menu, etc.) when the user clicks outside
 * all of the given elements or presses Escape.
 *
 * Useful when part of the component is rendered in a portal (e.g. a
 * menu panel outside its trigger) — pass both roots so clicks on either
 * are treated as "inside".
 *
 * @param isOpen  Whether the overlay is currently open
 * @param onClose Callback to close the overlay
 * @param refs    React refs to root elements (clicks inside any are ignored)
 */
export function useClickOutside(
  isOpen: boolean,
  onClose: () => void,
  ...refs: React.RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      const inside = refs.some((ref) => ref.current?.contains(target))
      if (!inside) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose, ...refs])
}
