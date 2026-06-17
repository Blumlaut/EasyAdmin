import { useEffect, useRef } from 'react'

export interface WindowPosition {
  x: number
  y: number
}

export interface UseWindowDragOptions {
  /**
   * When false, no listeners are attached and drag is fully disabled.
   * Use this to disable dragging in fullscreen mode.
   */
  enabled: boolean
  /**
   * Current position. Kept in a ref so the effect doesn't re-run on every
   * mouse move (the position changes 60+ times per second during a drag).
   */
  position: WindowPosition
  /**
   * Called with the new clamped position on every mouse-move during a drag.
   */
  onPositionChange: (next: WindowPosition) => void
  /**
   * Called once when a drag ends (mouseup), with the final clamped position.
   * Use this to persist the position (e.g. save to KVP).
   */
  onDragEnd?: (position: WindowPosition) => void
}

/**
 * Window-dragging hook for the NUI window.
 *
 * Listens for `mousedown` on the document and starts a drag when the
 * target is inside an element marked with `data-window-drag-handle`
 * (typically the topbar) and is NOT inside a button/link/input.
 *
 * The drag is global (uses document-level mousemove/mouseup) so it
 * continues correctly even when the cursor leaves the window.
 *
 * The position is clamped so the entire window stays on-screen
 * (0px margin). Actual window dimensions are measured dynamically.
 */
export function useWindowDrag({ enabled, position, onPositionChange, onDragEnd }: UseWindowDragOptions) {
  // Keep the latest position in a ref so the effect below can read it
  // without needing to re-subscribe on every move.
  const positionRef = useRef<WindowPosition>(position)
  positionRef.current = position

  useEffect(() => {
    if (!enabled) return

    interface DragState {
      startX: number
      startY: number
      startPos: WindowPosition
    }
    let drag: DragState | null = null

    function onMouseMove(e: MouseEvent) {
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      const newX = drag.startPos.x + dx
      const newY = drag.startPos.y + dy

      // Clamp so the entire window stays on-screen (0px margin).
      // Measure actual dimensions each frame to account for any
      // CSS changes (font scaling, etc.) while dragging.
      const el = document.querySelector('.ea-window') as HTMLElement | null
      const vw = window.innerWidth
      const vh = window.innerHeight
      const ww = el ? el.offsetWidth : 1210
      const wh = el ? el.offsetHeight : 750

      // X: --ea-left = innerWidth/2 - ww/2 + x.  Entire window on-screen means:
      //   left edge >= 0  =>  x >= ww/2 - vw
      //   right edge <= vw =>  x <= 0
      const minX = Math.min(0, ww / 2 - vw)
      const maxX = 0

      // Y: top = vh/2 + translateY(-wh/2 + y).  Entire window on-screen means:
      //   top >= 0  =>  y >= wh/2 - vh
      //   bottom <= vh =>  y <= vh - wh/2 - vh = -wh/2 + vh ... simplified:
      //   y <= vh/2 - wh/2
      const minY = Math.min(0, wh / 2 - vh)
      const maxY = 0

      onPositionChange({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      })
    }

    function onMouseUp() {
      if (drag) {
        // Fire onDragEnd with the latest position from the ref
        onDragEnd?.(positionRef.current)
      }
      drag = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    function onMouseDown(e: MouseEvent) {
      // Only the primary (usually left) mouse button starts a drag.
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (!target) return
      // Don't start a drag when the user clicks an interactive element
      // inside the topbar (back / fold / close buttons, links, inputs).
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return
      // Only start a drag if the target is inside an element marked as a
      // drag handle. This is the topbar.
      if (!target.closest('[data-window-drag-handle]')) return

      drag = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...positionRef.current },
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      // Prevent text selection while dragging.
      e.preventDefault()
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      drag = null
    }
  }, [enabled, onPositionChange, onDragEnd])
}
