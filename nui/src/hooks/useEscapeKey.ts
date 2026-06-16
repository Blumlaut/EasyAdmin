import { useEffect } from 'react'

/**
 * Call `onCancel` when the Escape key is pressed.
 *
 * Used by modal components to close on Escape.
 */
export function useEscapeKey(onCancel: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])
}
