import { useCallback, useEffect, useRef, useState } from 'react'
import { useCollapse } from './useCollapse'
import { useWindowDrag, type WindowPosition } from './useWindowDrag'
import { useWindowResize, type WindowSize } from './useWindowResize'
import { DEFAULT_WINDOW_SIZE, type SidebarDirection, type SidebarMode } from '../types'
import { getRenderedWindowSize, clampWindowRectToViewport } from './collapseLayout'
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
}

export function useWindowChrome({
  visible,
  windowPosData,
  windowSizeData,
  sidebarMode,
  sidebarDirection,
}: UseWindowChromeOptions) {
  const [windowPos, setWindowPos] = useState<WindowPosition>({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_WINDOW_SIZE)
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [nuiBackground, setNuiBackground] = useState(false)
  // Pre-maximize size/position (restored on unmaximize)
  const preMaximizePosRef = useRef<WindowPosition>({ x: 0, y: 0 })
  const preMaximizeSizeRef = useRef<WindowSize>(DEFAULT_WINDOW_SIZE)
  const windowRef = useRef<HTMLDivElement>(null)
  const windowPosLoadedRef = useRef(false)
  const windowSizeLoadedRef = useRef(false)

  // Refs for latest values (used inside async callbacks and RAF)
  const windowPosRef = useRef(windowPos)
  const windowSizeRef = useRef(windowSize)
  windowPosRef.current = windowPos
  windowSizeRef.current = windowSize

  // === Restore saved window position from KVP ===

  useEffect(() => {
    if (windowPosData) {
      windowPosLoadedRef.current = true
      setWindowPos(windowPosData)
    }
  }, [windowPosData])

  useEffect(() => {
    if (windowSizeData) {
      windowSizeLoadedRef.current = true
      setWindowSize(windowSizeData)
    }
  }, [windowSizeData])

  // Center the window on first open (before KVP data arrives).
  // KVP restore will override this if a saved position exists.
  useEffect(() => {
    if (!visible || windowPosLoadedRef.current) return
    const size = windowSizeRef.current
    setWindowPos({
      x: Math.round(window.innerWidth / 2 - size.width / 2),
      y: Math.round(window.innerHeight / 2 - size.height / 2),
    })
  }, [visible])

  // === Focus sync from Lua (nuiUnhook) ===

  useEffect(() => {
    return on('nuiUnhook', () => {
      setNuiBackground(true)
    })
  }, [])

  // === Window dragging ===

  const handlePositionChange = useCallback((pos: WindowPosition) => {
    setWindowPos(pos)
  }, [])

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

  const handleDragEnd = useCallback((pos: WindowPosition) => {
    saveWindowPosition(pos)
  }, [saveWindowPosition])

  const dragEnabled = visible && !nuiBackground

  useWindowDrag({
    enabled: dragEnabled,
    position: windowPos,
    onPositionChange: handlePositionChange,
    onDragEnd: handleDragEnd,
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

  // === Collapse ===

  const handleCollapseAnimationFinish = useCallback((collapsed: boolean) => {
    const el = windowRef.current
    if (!el) return

    const size = getRenderedWindowSize({
      contentCollapsed: collapsed,
      sidebarMode,
      expandedSize: windowSizeRef.current,
    })
    const pos = windowPosRef.current
    const clamped = clampWindowRectToViewport(
      { x: pos.x, y: pos.y, width: size.width, height: size.height },
      { width: window.innerWidth, height: window.innerHeight },
    )

    if (clamped.x !== pos.x || clamped.y !== pos.y) {
      setWindowPos({ x: clamped.x, y: clamped.y })
      windowPosRef.current = { x: clamped.x, y: clamped.y }
      saveWindowPosition({ x: clamped.x, y: clamped.y })
    }
  }, [saveWindowPosition, sidebarMode])

  const toggleCollapsed = useCollapse(
    windowRef,
    contentCollapsed,
    setContentCollapsed,
    () => windowSize.width,
    () => windowSize.height,
    () => windowPosRef.current,
    (pos) => {
      setWindowPos(pos)
      windowPosRef.current = pos
    },
    sidebarMode,
    sidebarDirection,
    handleCollapseAnimationFinish,
  )

  // === Focus sync from Lua (nuiRehook — unfold if collapsed) ===

  useEffect(() => {
    return on('nuiRehook', () => {
      setNuiBackground(false)
      if (contentCollapsed) {
        toggleCollapsed()
      }
    })
  }, [contentCollapsed, toggleCollapsed])

  // === Backdrop click — collapse to sidebar + release focus ===

  const handleBackdropClick = useCallback(() => {
    if (nuiBackground) return
    if (!contentCollapsed) {
      toggleCollapsed()
    }
    setNuiBackground(true)
    callLua('releaseFocus').catch(() => {})
  }, [nuiBackground, contentCollapsed, toggleCollapsed])

  // === Apply window chrome styles ===

  const applyWindowChrome = useCallback(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const raf = window.requestAnimationFrame(() => {
      const pos = windowPosRef.current
      const expandedSize = windowSizeRef.current
      const size = getRenderedWindowSize({
        contentCollapsed,
        sidebarMode,
        expandedSize,
      })
      if (el.classList.contains('ea-window--collapse-animating')) return
      el.style.setProperty('--ea-left', `${pos.x}px`)
      el.style.setProperty('--ea-top', `${pos.y}px`)
      el.style.width = `${size.width}px`
      el.style.height = `${size.height}px`
    })
    return () => window.cancelAnimationFrame(raf)
  }, [visible, contentCollapsed, sidebarMode, sidebarDirection])

  useEffect(() => {
    return applyWindowChrome()
  }, [applyWindowChrome, visible, windowPos, windowSize])

  // Clamp position to viewport bounds on resize
  useEffect(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const onResize = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const clampedX = Math.max(0, Math.min(window.innerWidth - w, windowPos.x))
      const clampedY = Math.max(0, Math.min(window.innerHeight - h, windowPos.y))
      el.style.setProperty('--ea-left', `${clampedX}px`)
      el.style.setProperty('--ea-top', `${clampedY}px`)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [visible, windowPos])

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
    setContentCollapsed(false)
    setMaximized(false)
    setNuiBackground(false)
    const el = windowRef.current
    el?.style.removeProperty('width')
    el?.style.removeProperty('height')
    el?.classList.remove('ea-window--collapsed')
  }, [])

  return {
    windowRef,
    windowPos,
    windowSize,
    contentCollapsed,
    maximized,
    nuiBackground,
    toggleCollapsed,
    toggleMaximize,
    handleBackdropClick,
    resetWindowChrome,
  }
}
