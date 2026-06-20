import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

const MIN_WIDTH = 500
const MIN_HEIGHT = 400
const HANDLE_THRESHOLD = 16 // px from edge to activate resize cursor

export interface WindowSize {
  width: number
  height: number
}

export interface UseWindowResizeOptions {
  enabled: boolean
  size: WindowSize
  onSizeChange: (next: WindowSize) => void
  onResizeEnd?: (size: WindowSize) => void
  /** Called when resizing from west/north edges so the position can adjust. */
  onPositionChange?: (next: { x: number; y: number }) => void
  /** If provided, styles are applied synchronously during drag for immediate visual feedback. */
  applyStyles?: (width: number, height: number, x?: number, y?: number) => void
  /**
   * Ref to the resizable element. Required — resize detection is scoped to
   * this element so multiple resizable windows can coexist without one
   * window's edges triggering another's resize.
   */
  elementRef: RefObject<HTMLElement | null>
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const CURSORS: Record<string, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
}

/**
 * Window-resizing hook (instance-scoped).
 *
 * Edge-detection `mousedown` and the resize-cursor-preview `mousemove` are
 * attached to the element itself (via `elementRef`), so each window only
 * reacts to interaction with its own edges. Multiple resizable windows can
 * coexist without interference.
 *
 * While a resize is active, `mousemove`/`mouseup` are attached to the
 * document so the resize continues correctly even when the cursor leaves
 * the window. These document listeners are added on resize start and
 * removed on resize end, so only the instance that started the resize
 * responds.
 */
export function useWindowResize({ enabled, size, onSizeChange, onResizeEnd, onPositionChange, applyStyles, elementRef }: UseWindowResizeOptions) {
  // Refs for latest values so listeners don't need to be re-bound
  const enabledRef = useRef(enabled)
  const sizeRef = useRef(size)
  const onSizeChangeRef = useRef(onSizeChange)
  const onResizeEndRef = useRef(onResizeEnd)
  const onPositionChangeRef = useRef(onPositionChange)
  const applyStylesRef = useRef(applyStyles)

  // Keep refs in sync inside an effect (never during render) so the
  // element-scoped listeners always see the latest values without needing
  // to be re-bound on every change.
  useEffect(() => {
    enabledRef.current = enabled
    sizeRef.current = size
    onSizeChangeRef.current = onSizeChange
    onResizeEndRef.current = onResizeEnd
    onPositionChangeRef.current = onPositionChange
    applyStylesRef.current = applyStyles
  }, [enabled, size, onSizeChange, onResizeEnd, onPositionChange, applyStyles])

  const detectEdge = (el: HTMLElement, e: MouseEvent): ResizeDir | null => {
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    const fromRight = w - x
    const fromBottom = h - y

    if (x < HANDLE_THRESHOLD && fromRight < HANDLE_THRESHOLD) return null
    if (y < HANDLE_THRESHOLD && fromBottom < HANDLE_THRESHOLD) return null

    const hEdge = x < HANDLE_THRESHOLD ? 'w' : fromRight < HANDLE_THRESHOLD ? 'e' : ''
    const vEdge = y < HANDLE_THRESHOLD ? 'n' : fromBottom < HANDLE_THRESHOLD ? 's' : ''
    if (hEdge || vEdge) return `${vEdge}${hEdge}` as ResizeDir
    return null
  }

  useEffect(() => {
    if (!enabled) return
    const elOrNull = elementRef.current
    if (!elOrNull) return
    // Non-nullable alias so closures keep the narrowing.
    const el: HTMLElement = elOrNull

    interface DragState {
      startX: number
      startY: number
      startSize: WindowSize
      startPos: { x: number; y: number }
      dir: ResizeDir
    }
    let drag: DragState | null = null

    function onMouseMove(e: MouseEvent) {
      if (drag) {
        e.preventDefault()
        const d = drag
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        let { width, height } = d.startSize
        let dpx = 0
        let dpy = 0

        if (d.dir.includes('e')) width = Math.max(MIN_WIDTH, width + dx)
        if (d.dir.includes('w')) {
          const newWidth = width - dx
          if (newWidth >= MIN_WIDTH) { width = newWidth; dpx = dx }
        }
        if (d.dir.includes('s')) height = Math.max(MIN_HEIGHT, height + dy)
        if (d.dir.includes('n')) {
          const newHeight = height - dy
          if (newHeight >= MIN_HEIGHT) { height = newHeight; dpy = dy }
        }

        // drag in progress — styles applied sync via applyStyles
        // Update ref directly — don't trigger React state during drag
        // (RAF-based applyWindowChrome would overwrite our sync styles)
        sizeRef.current = { width, height }
        if (dpx !== 0 || dpy !== 0) {
          const newPos = { x: d.startPos.x + dpx, y: d.startPos.y + dpy }
          // position adjusted for west/north resize
          onPositionChangeRef.current?.(newPos)
        }
        // Apply styles synchronously for immediate visual feedback
        applyStylesRef.current?.(width, height, dpx !== 0 ? d.startPos.x + dpx : undefined, dpy !== 0 ? d.startPos.y + dpy : undefined)
      }
    }

    function endResize() {
      if (drag) {
        const finalSize = sizeRef.current
        // drag ended, committing to state
        // Commit final size to React state (triggers save + applyWindowChrome)
        onSizeChangeRef.current(finalSize)
        onResizeEndRef.current?.(finalSize)
      }
      drag = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', endResize)
    }

    // Element-scoped: only react to the mouse when it's over THIS window.
    function onElMouseMove(e: MouseEvent) {
      if (!enabledRef.current) return
      if (drag) return // active drag is handled by the document listener
      const dir = detectEdge(el, e)
      document.body.style.cursor = dir ? CURSORS[dir] : ''
    }

    function onElMouseDown(e: MouseEvent) {
      if (!enabledRef.current) return
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return

      const dir = detectEdge(el, e)
      if (!dir) return

      const cs = getComputedStyle(el)
      const startPos = {
        x: parseInt(cs.getPropertyValue('--ea-left') || cs.left || '0'),
        y: parseInt(cs.getPropertyValue('--ea-top') || cs.top || '0'),
      }

      // drag started
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        startSize: { ...sizeRef.current },
        startPos,
        dir,
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', endResize)
      e.preventDefault()
    }

    el.addEventListener('mousemove', onElMouseMove)
    el.addEventListener('mousedown', onElMouseDown)
    return () => {
      el.removeEventListener('mousemove', onElMouseMove)
      el.removeEventListener('mousedown', onElMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', endResize)
      // Clear any cursor we may have set so a disabled/removed window
      // doesn't leave the body stuck with a resize cursor.
      document.body.style.cursor = ''
      drag = null
    }
  }, [enabled, elementRef])
}
