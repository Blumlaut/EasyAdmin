import { useState, useRef, useCallback, useEffect, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import './tooltip.css'

interface TooltipProps {
  /** Text shown inside the tooltip on hover */
  content: string
  /** Element(s) to wrap */
  children: ReactNode
}

function getTooltipRoot(): HTMLElement {
  let el = document.getElementById('ea-tooltip-portal')
  if (!el) {
    el = document.createElement('div')
    el.id = 'ea-tooltip-portal'
    // Append to documentElement so position:absolute covers the full viewport
    document.documentElement.insertBefore(el, document.body)
  }
  return el
}

/**
 * Portal-based tooltip that breaks out of overflow:hidden parents.
 *
 * Uses `position: absolute` on a child of `<html>` so it covers the full
 * viewport regardless of any ancestor clipping.  Vertical offset is handled
 * by `transform: translateY(calc(-100% - 6px))` which is reliably supported
 * in FiveM's CEF (unlike `top` on fixed elements).
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, flip: false })
  const triggerRef = useRef<HTMLDivElement>(null)

  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  const positionTooltip = (ref: RefObject<HTMLElement | null>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // top = trigger's top edge. CSS transform shifts the tooltip up by its
    // own height + 6px gap, so the bottom of the tooltip sits at this y.
    const spaceAbove = rect.height + 6 // button height + gap needed above
    const flip = rect.top < spaceAbove
    setCoords({
      top: flip ? rect.bottom : rect.top,
      left: rect.left + rect.width / 2,
      flip,
    })
    setShow(true)
  }

  const handleShow = useCallback(() => {
    setVisible(true)
    setShow(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => positionTooltip(triggerRef))
  }, [])

  const handleHide = useCallback(() => {
    setShow(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTimeout(() => setVisible(false), 150)
  }, [])

  // Reposition on scroll/resize so the tooltip stays aligned
  useEffect(() => {
    if (!visible) return
    const update = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => positionTooltip(triggerRef))
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [visible])

  return (
    <>
      <div
        ref={triggerRef}
        className="ea-tooltip-trigger"
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onFocus={handleShow}
        onBlur={handleHide}
        tabIndex={-1}
      >
        {children}
      </div>

      {visible && createPortal(
        <div
          className={
            'ea-tooltip-popup'
            + (show ? ' ea-tooltip-popup--visible' : '')
            + (coords.flip ? ' ea-tooltip-popup--flip' : '')
          }
          style={{ top: coords.top, left: coords.left }}
          role="tooltip"
        >
          {content}
        </div>,
        getTooltipRoot(),
      )}
    </>
  )
}
