import { useCallback, useEffect, useRef, useState } from 'react'
import { useCollapse } from './useCollapse'
import { useWindowDrag, type WindowPosition } from './useWindowDrag'
import { useWindowResize, type WindowSize } from './useWindowResize'
import { DEFAULT_WINDOW_SIZE } from '../types'
import { on, callLua, setResourceKvp } from '../fivem'

interface UseWindowChromeOptions {
  visible: boolean
  windowPosData: WindowPosition | null
  windowSizeData: WindowSize | null
}

export function useWindowChrome({
  visible,
  windowPosData,
  windowSizeData,
}: UseWindowChromeOptions) {
  const [windowPos, setWindowPos] = useState<WindowPosition>({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_WINDOW_SIZE)
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [nuiBackground, setNuiBackground] = useState(false)
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

  // === Focus sync from Lua ===

  useEffect(() => {
    return on('nuiRehook', () => {
      setNuiBackground(false)
    })
  }, [])

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
  const lastWindowPosSaveRef = useRef(0)
  const saveWindowPosition = useCallback((pos: WindowPosition) => {
    const now = Date.now()
    if (now - lastWindowPosSaveRef.current < 500) return
    lastWindowPosSaveRef.current = now
    setResourceKvp('ixWindowPos', String(pos.x))
    setResourceKvp('iyWindowPos', String(pos.y))
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

  const saveWindowSize = useCallback((size: WindowSize) => {
    setResourceKvp('iwSizeW', String(size.width))
    setResourceKvp('iwSizeH', String(size.height))
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

  const handleCollapseAnimationFinish = useCallback(() => {
    const el = windowRef.current
    if (!el) return
    const ww = el.offsetWidth
    const vw = window.innerWidth
    const pos = windowPosRef.current
    const rightEdge = Math.round(vw / 2 - ww / 2 + pos.x)
    if (rightEdge > vw) {
      setWindowPos((prev) => {
        const adjusted = { ...prev, x: prev.x - (rightEdge - vw) }
        saveWindowPosition(adjusted)
        return adjusted
      })
    }
  }, [saveWindowPosition])

  const toggleCollapsed = useCollapse(
    windowRef,
    contentCollapsed,
    setContentCollapsed,
    () => windowSize.width,
    handleCollapseAnimationFinish,
  )

  // === Backdrop click ===

  const handleBackdropClick = useCallback(() => {
    if (nuiBackground) return
    setNuiBackground(true)
    callLua('releaseFocus').catch(() => {})
  }, [nuiBackground])

  // === Apply window chrome styles ===

  const applyWindowChrome = useCallback(() => {
    if (!windowRef.current || !visible) return
    const el = windowRef.current
    const raf = window.requestAnimationFrame(() => {
      const pos = windowPosRef.current
      const size = windowSizeRef.current
      el.style.setProperty('--ea-left', `${pos.x}px`)
      el.style.setProperty('--ea-top', `${pos.y}px`)
      el.style.width = `${size.width}px`
      el.style.height = `${size.height}px`
    })
    return () => window.cancelAnimationFrame(raf)
  }, [visible])

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

  // === Reset function (called by App on menu open) ===

  const resetWindowChrome = useCallback(() => {
    setWindowSize(DEFAULT_WINDOW_SIZE)
    setWindowPos({
      x: Math.round(window.innerWidth / 2 - DEFAULT_WINDOW_SIZE.width / 2),
      y: Math.round(window.innerHeight / 2 - DEFAULT_WINDOW_SIZE.height / 2),
    })
    setContentCollapsed(false)
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
    nuiBackground,
    toggleCollapsed,
    handleBackdropClick,
    resetWindowChrome,
  }
}
