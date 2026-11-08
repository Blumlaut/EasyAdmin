import { useCallback, useEffect, useRef, useState } from 'react'
import { useFoldAnimation } from './useFoldAnimation'
import { useWindowDrag, type WindowPosition } from './useWindowDrag'
import { useWindowResize, type WindowSize } from './useWindowResize'
import { DEFAULT_WINDOW_SIZE, type FoldedStyle, type SidebarDirection, type SidebarMode } from '../types'
import { CHIP_SIZE, getFoldRects, measureRailHeight, type FoldState, type WindowRect } from './collapseLayout'
import { on, callLua, setResourceKvp } from '../fivem'

const MIN_WIDTH = 500
const MIN_HEIGHT = 400
const MAX_PADDING = 16 // px from screen edges when maximized

interface UseWindowChromeOptions {
  visible: boolean
  windowPosData: WindowPosition | null
  windowSizeData: WindowSize | null
  sidebarMode: SidebarMode
  sidebarDirection: SidebarDirection
  foldedStyle: FoldedStyle
}

export function useWindowChrome({
  visible,
  windowPosData,
  windowSizeData,
  sidebarMode,
  sidebarDirection,
  foldedStyle,
}: UseWindowChromeOptions) {
  const [windowPos, setWindowPos] = useState<WindowPosition>({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_WINDOW_SIZE)
  const [maximized, setMaximized] = useState(false)
  const [nuiBackground, setNuiBackground] = useState(false)
  // Pre-maximize size/position (restored on unmaximize)
  const preMaximizePosRef = useRef<WindowPosition>({ x: 0, y: 0 })
  const preMaximizeSizeRef = useRef<WindowSize>(DEFAULT_WINDOW_SIZE)
  const windowRef = useRef<HTMLDivElement>(null)
  const windowPosLoadedRef = useRef(false)
  const windowSizeLoadedRef = useRef(false)
  // Rail height, measured from the sidebar while the nav is laid out
  const railHeightRef = useRef(0)

  // Refs for latest values (used inside async callbacks and RAF)
  const windowPosRef = useRef(windowPos)
  const windowSizeRef = useRef(windowSize)

  // Keep refs in sync with state (must be in effect, not during render)
  useEffect(() => {
    windowPosRef.current = windowPos
    windowSizeRef.current = windowSize
  }, [windowPos, windowSize])

  // Persist window position to KVP (throttled to 500ms)
  // Clamp to minimum 1 because KvpGet treats 0 as nil (unset), which would
  // cause position (0,0) to be lost and the window to re-center on next open.
  const lastWindowPosSaveRef = useRef(0)
  const saveWindowPosition = useCallback((pos: WindowPosition) => {
    const now = Date.now()
    if (now - lastWindowPosSaveRef.current < 500) return
    lastWindowPosSaveRef.current = now
    setResourceKvp('ixWindowPos', String(Math.max(1, pos.x)))
    setResourceKvp('iyWindowPos', String(Math.max(1, pos.y)))
  }, [])

  // === Geometry for every fold state ===

  // Measuring costs a forced layout, so it only happens when a fold is about to
  // happen. The chip hides the nav, which is why the value is cached.
  const getRects = useCallback((options?: { measure?: boolean }): Record<FoldState, WindowRect> => {
    const el = windowRef.current
    const nav = el?.querySelector<HTMLElement>('.sidebar-nav')
    if (options?.measure && el && nav && nav.getClientRects().length > 0) {
      railHeightRef.current = measureRailHeight(el)
    }

    return getFoldRects({
      expandedRect: {
        x: windowPosRef.current.x,
        y: windowPosRef.current.y,
        width: windowSizeRef.current.width,
        height: windowSizeRef.current.height,
      },
      sidebarMode,
      sidebarDirection,
      railHeight: railHeightRef.current || CHIP_SIZE * 2,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    })
  }, [sidebarMode, sidebarDirection])

  const handleFoldSettled = useCallback((state: FoldState, rects: Record<FoldState, WindowRect>) => {
    if (state !== 'open') return
    // Unfolding can push the window off-screen; keep the saved position in bounds
    const open = rects.open
    if (open.x !== windowPosRef.current.x || open.y !== windowPosRef.current.y) {
      setWindowPos({ x: open.x, y: open.y })
      windowPosRef.current = { x: open.x, y: open.y }
      saveWindowPosition({ x: open.x, y: open.y })
    }
  }, [saveWindowPosition])

  const { foldState, animateTo, resetFold } = useFoldAnimation({
    windowRef,
    sidebarMode,
    getRects,
    onSettled: handleFoldSettled,
  })

  // The window is folded exactly while the game owns the input
  const foldTarget: FoldState = nuiBackground ? (foldedStyle === 'chip' ? 'chip' : 'rail') : 'open'

  useEffect(() => {
    if (foldState === foldTarget) return
    void animateTo(foldTarget)
  }, [foldState, foldTarget, animateTo])

  // === Restore saved window position/size from KVP + center on first open ===

  useEffect(() => {
    let posLoaded = false

    if (windowPosData) {
      posLoaded = true
      windowPosLoadedRef.current = true
      windowPosRef.current = windowPosData
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time KVP restore on mount, not a reactive sync
      setWindowPos(windowPosData)
    }
    if (windowSizeData) {
      windowSizeLoadedRef.current = true
      windowSizeRef.current = windowSizeData
      setWindowSize(windowSizeData)
    }

    // Center the window on first open only if no saved position exists.
    // KVP restore above takes priority if a saved position exists.
    if (visible && !posLoaded) {
      const size = windowSizeRef.current
      setWindowPos({
        x: Math.round(window.innerWidth / 2 - size.width / 2),
        y: Math.round(window.innerHeight / 2 - size.height / 2),
      })
    }
  }, [visible, windowPosData, windowSizeData])

  // === Focus sync from Lua: the fold target follows the focus state ===

  useEffect(() => {
    return on('nuiUnhook', () => {
      setNuiBackground(true)
    })
  }, [])

  useEffect(() => {
    return on('nuiRehook', () => {
      setNuiBackground(false)
    })
  }, [])

  // === Window dragging ===

  const handlePositionChange = useCallback((pos: WindowPosition) => {
    setWindowPos(pos)
  }, [])

  const handleDragEnd = useCallback((pos: WindowPosition) => {
    saveWindowPosition(pos)
  }, [saveWindowPosition])

  const dragEnabled = visible && !nuiBackground

  useWindowDrag({
    enabled: dragEnabled,
    position: windowPos,
    onPositionChange: handlePositionChange,
    onDragEnd: handleDragEnd,
    elementRef: windowRef,
  })

  // === Window resizing ===

  // Clamp to minimum 1 for the same KvpGet(0)=nil reason as position.
  const saveWindowSize = useCallback((size: WindowSize) => {
    setResourceKvp('iwSizeW', String(Math.max(1, size.width)))
    setResourceKvp('iwSizeH', String(Math.max(1, size.height)))
  }, [])

  useWindowResize({
    enabled: visible && !nuiBackground,
    size: windowSize,
    elementRef: windowRef,
    onSizeChange: (next) => {
      setWindowSize(next)
    },
    onResizeEnd: saveWindowSize,
    onPositionChange: (next) => {
      setWindowPos(next)
    },
    applyStyles: (w, h, x, y) => {
      const el = windowRef.current
      if (!el) return
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      if (x !== undefined) {
        el.style.setProperty('--ea-left', `${x}px`)
        windowPosRef.current = { ...windowPosRef.current, x }
      }
      if (y !== undefined) {
        el.style.setProperty('--ea-top', `${y}px`)
        windowPosRef.current = { ...windowPosRef.current, y }
      }
      windowSizeRef.current = { width: w, height: h }
    },
  })

  // === Fold in: hand the input back to the game, the fold follows focus ===

  const foldIn = useCallback(() => {
    if (nuiBackground) return
    callLua('releaseFocus').catch(() => {})
  }, [nuiBackground])

  const handleBackdropClick = foldIn

  // === Apply the resting geometry for the current fold state ===

  const applyWindowChrome = useCallback(() => {
    const el = windowRef.current
    if (!el || !visible) return
    const raf = window.requestAnimationFrame(() => {
      if (el.classList.contains('ea-window--folding')) return
      const rect = getRects()[foldState]
      el.style.setProperty('--ea-left', `${rect.x}px`)
      el.style.setProperty('--ea-top', `${rect.y}px`)
      el.style.width = `${rect.width}px`
      el.style.height = `${rect.height}px`
    })
    return () => window.cancelAnimationFrame(raf)
  }, [visible, foldState, getRects])

  useEffect(() => {
    return applyWindowChrome()
  }, [applyWindowChrome, visible, windowPos, windowSize])

  // Clamp position to viewport bounds on resize
  useEffect(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const onResize = () => {
      if (foldState !== 'open') return
      const w = el.offsetWidth
      const h = el.offsetHeight
      const clampedX = Math.max(0, Math.min(window.innerWidth - w, windowPos.x))
      const clampedY = Math.max(0, Math.min(window.innerHeight - h, windowPos.y))
      el.style.setProperty('--ea-left', `${clampedX}px`)
      el.style.setProperty('--ea-top', `${clampedY}px`)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [visible, windowPos, foldState])

  // === Maximize / restore ===

  const toggleMaximize = useCallback(() => {
    if (maximized) {
      // Restore previous size and position
      setWindowSize(preMaximizeSizeRef.current)
      setWindowPos(preMaximizePosRef.current)
      setMaximized(false)
    } else {
      // Save current state
      preMaximizePosRef.current = { ...windowPosRef.current }
      preMaximizeSizeRef.current = { ...windowSizeRef.current }

      // Compute max size that fits within viewport
      const maxW = window.innerWidth - MAX_PADDING * 2
      const maxH = window.innerHeight - MAX_PADDING * 2
      const newSize: WindowSize = {
        width: Math.max(MIN_WIDTH, maxW),
        height: Math.max(MIN_HEIGHT, maxH),
      }
      const newPos: WindowPosition = {
        x: Math.round(MAX_PADDING),
        y: Math.round(MAX_PADDING),
      }

      setWindowSize(newSize)
      setWindowPos(newPos)
      setMaximized(true)
    }
  }, [maximized])

  // === Reset function (called by App on menu open) ===

  const resetWindowChrome = useCallback(() => {
    setWindowSize(DEFAULT_WINDOW_SIZE)
    setWindowPos({
      x: Math.round(window.innerWidth / 2 - DEFAULT_WINDOW_SIZE.width / 2),
      y: Math.round(window.innerHeight / 2 - DEFAULT_WINDOW_SIZE.height / 2),
    })
    setMaximized(false)
    setNuiBackground(false)
    resetFold()
    const el = windowRef.current
    el?.style.removeProperty('width')
    el?.style.removeProperty('height')
    el?.classList.remove('ea-window--rail', 'ea-window--chip')
  }, [resetFold])

  return {
    windowRef,
    windowPos,
    windowSize,
    foldState,
    maximized,
    nuiBackground,
    toggleMaximize,
    foldIn,
    handleBackdropClick,
    resetWindowChrome,
  }
}
