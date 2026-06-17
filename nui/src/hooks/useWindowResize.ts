import { useEffect, useRef, useCallback } from 'react'

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
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * Window-resizing hook. Listeners are attached once globally and never
 * removed — a ref gate prevents them from firing when disabled. This
 * avoids CEF quirks where removing/re-adding document listeners breaks them.
 */
let listenersAttached = false

export function useWindowResize({ enabled, size, onSizeChange, onResizeEnd, onPositionChange, applyStyles }: UseWindowResizeOptions) {
  // Refs for latest values so listeners don't need to be re-bound
  const enabledRef = useRef(enabled)
  const sizeRef = useRef(size)
  const onSizeChangeRef = useRef(onSizeChange)
  const onResizeEndRef = useRef(onResizeEnd)
  const onPositionChangeRef = useRef(onPositionChange)
  const applyStylesRef = useRef(applyStyles)

  enabledRef.current = enabled
  sizeRef.current = size
  onSizeChangeRef.current = onSizeChange
  onResizeEndRef.current = onResizeEnd
  onPositionChangeRef.current = onPositionChange
  applyStylesRef.current = applyStyles

  const detectEdge = useCallback((e: MouseEvent): ResizeDir | null => {
    const el = document.querySelector('.ea-window') as HTMLElement | null
    if (!el) return null
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
  }, [])

  const detectEdgeRef = useRef(detectEdge)
  detectEdgeRef.current = detectEdge

  // Attach listeners once, never remove them
  useEffect(() => {
    const cursors: Record<string, string> = {
      n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
      ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
    }

    interface DragState {
      startX: number
      startY: number
      startSize: WindowSize
      startPos: { x: number; y: number }
      dir: ResizeDir
    }
    let drag: DragState | null = null

    function onMouseMove(e: MouseEvent) {
      if (!enabledRef.current) return

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
      } else {
        const dir = detectEdgeRef.current(e)
        document.body.style.cursor = dir ? cursors[dir] : ''
      }
    }

    function onMouseUp() {
      if (drag) {
        const finalSize = sizeRef.current
        // drag ended, committing to state
        // Commit final size to React state (triggers save + applyWindowChrome)
        onSizeChangeRef.current(finalSize)
        onResizeEndRef.current?.(finalSize)
      }
      drag = null
      document.body.style.cursor = ''
    }

    function onMouseDown(e: MouseEvent) {
      if (!enabledRef.current) return
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('button, a, input, select, textarea, [role="button"]')) return

      const dir = detectEdgeRef.current(e)
      if (!dir) return

      const startPos = (() => {
        const el = document.querySelector('.ea-window') as HTMLElement | null
        const cs = el ? getComputedStyle(el) : null
        return {
          x: cs ? parseInt(cs.getPropertyValue('--ea-left') || cs.left || '0') : 0,
          y: cs ? parseInt(cs.getPropertyValue('--ea-top') || cs.top || '0') : 0,
        }
      })()

      // drag started
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        startSize: { ...sizeRef.current },
        startPos,
        dir,
      }
      e.preventDefault()
    }

    if (listenersAttached) return
    listenersAttached = true

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    // Intentionally no cleanup — listeners are ref-gated
  }, [])
}
