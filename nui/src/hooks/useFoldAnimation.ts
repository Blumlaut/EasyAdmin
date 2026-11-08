import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { SidebarMode } from '../types'
import {
  getStripRect,
  rectsAreEqual,
  SIDEBAR_WIDTH,
  TASKBAR_HEIGHT,
  type FoldState,
  type WindowRect,
} from './collapseLayout'

const PHASE_MS = 170
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

interface UseFoldAnimationOptions {
  windowRef: RefObject<HTMLDivElement | null>
  sidebarMode: SidebarMode
  /** Geometry for all three states, recomputed per transition. */
  getRects: (options?: { measure?: boolean }) => Record<FoldState, WindowRect>
  /** Called once the window has settled, with the state it settled into. */
  onSettled?: (state: FoldState, rects: Record<FoldState, WindowRect>) => void
}

function commitRect(el: HTMLElement, rect: WindowRect) {
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  el.style.setProperty('--ea-left', `${rect.x}px`)
  el.style.setProperty('--ea-top', `${rect.y}px`)
}

async function animateRect(el: HTMLElement, from: WindowRect, to: WindowRect) {
  const animation = el.animate(
    [
      { width: `${from.width}px`, height: `${from.height}px`, left: `${from.x}px`, top: `${from.y}px` },
      { width: `${to.width}px`, height: `${to.height}px`, left: `${to.x}px`, top: `${to.y}px` },
    ],
    { duration: PHASE_MS, easing: EASING, fill: 'forwards' },
  )
  await animation.finished.catch(() => {})
  commitRect(el, to)
  animation.cancel()
}

/**
 * Drives the fold between the full window, the icon rail and the chip.
 * Opening grows the window down into a full-height strip before it grows
 * sideways, so the panel reads as unfolding rather than as a resize.
 */
export function useFoldAnimation({
  windowRef,
  sidebarMode,
  getRects,
  onSettled,
}: UseFoldAnimationOptions) {
  const [foldState, setFoldState] = useState<FoldState>('open')
  const stateRef = useRef<FoldState>('open')
  const busyRef = useRef(false)
  const pendingRef = useRef<FoldState | null>(null)

  const runOnce = useCallback(async (next: FoldState) => {
    const el = windowRef.current
    const from = stateRef.current
    if (!el || from === next) return

    const folding = next !== 'open'
    const rects = getRects({ measure: folding })
    const start = rects[from]
    const target = rects[next]
    const strip = getStripRect(from, next, rects)

    el.classList.add('ea-window--folding')
    if (!folding) el.classList.remove('ea-window--rail', 'ea-window--chip')

    // Hold the content at its full size so it gets revealed by the window
    // instead of reflowing through every frame.
    const content = el.querySelector<HTMLElement>(':scope > div:not(.sidebar)')
    if (content) {
      content.style.minWidth = sidebarMode === 'vertical' ? `${rects.open.width - SIDEBAR_WIDTH}px` : ''
      content.style.minHeight = sidebarMode === 'vertical' ? '' : `${rects.open.height - TASKBAR_HEIGHT}px`
    }

    commitRect(el, start)

    if (folding) {
      await animateRect(el, start, strip)
      el.classList.add('ea-window--rail')
      if (!rectsAreEqual(strip, target)) await animateRect(el, strip, target)
      if (next === 'chip') {
        el.classList.remove('ea-window--rail')
        el.classList.add('ea-window--chip')
      }
    } else {
      if (!rectsAreEqual(start, strip)) await animateRect(el, start, strip)
      await animateRect(el, strip, target)
    }

    if (content) {
      content.style.minWidth = ''
      content.style.minHeight = ''
    }
    el.classList.remove('ea-window--folding')

    stateRef.current = next
    setFoldState(next)
    onSettled?.(next, rects)
  }, [getRects, onSettled, sidebarMode, windowRef])

  const animateTo = useCallback(async (requested: FoldState) => {
    pendingRef.current = requested
    if (busyRef.current) return

    busyRef.current = true
    try {
      while (pendingRef.current && pendingRef.current !== stateRef.current) {
        const next = pendingRef.current
        pendingRef.current = null
        await runOnce(next)
      }
    } finally {
      busyRef.current = false
    }
  }, [runOnce])

  const resetFold = useCallback(() => {
    pendingRef.current = null
    stateRef.current = 'open'
    setFoldState('open')
  }, [])

  return { foldState, animateTo, resetFold }
}
