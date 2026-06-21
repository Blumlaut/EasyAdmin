/**
 * ScreenshotViewer — floating window that displays a captured screenshot.
 *
 * Receives data URIs via `screenshot:received` messages from Lua.
 * Draggable via the topbar, closable via the X button.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { on } from '../fivem'
import { useWindowDrag, type WindowPosition } from '../hooks/useWindowDrag'
import { useWindowResize, type WindowSize } from '../hooks/useWindowResize'
import { Icon } from './icons'

interface ScreenshotData {
  /** The image data URI (webp) */
  image: string
  /** Name of the player who was captured */
  playerName: string
}

const DEFAULT_POS: WindowPosition = { x: 0, y: 0 }
const DEFAULT_SIZE: WindowSize = { width: 800, height: 560 }

export function ScreenshotViewer() {
  const [data, setData] = useState<ScreenshotData | null>(null)
  const [position, setPosition] = useState<WindowPosition>(DEFAULT_POS)
  const [size, setSize] = useState<WindowSize>(DEFAULT_SIZE)
  const ref = useRef<HTMLDivElement>(null)

  // Center on open
  const openRef = useRef(false)
  useEffect(() => {
    if (data && !openRef.current) {
      openRef.current = true
      setPosition({
        x: Math.round(window.innerWidth / 2 - 400),
        y: Math.round(window.innerHeight / 2 - 280),
      })
    }
    if (!data) {
      openRef.current = false
    }
  }, [data])

  const handleClose = useCallback(() => {
    setData(null)
  }, [])

  useWindowDrag({
    enabled: !!data,
    position,
    onPositionChange: setPosition,
    elementRef: ref,
  })

  useWindowResize({
    enabled: !!data,
    size,
    elementRef: ref,
    onSizeChange: setSize,
    onPositionChange: setPosition,
    applyStyles: (w, h, x, y) => {
      const el = ref.current
      if (!el) return
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      if (x !== undefined) el.style.left = `${x}px`
      if (y !== undefined) el.style.top = `${y}px`
    },
  })

  // Listen for screenshot results from Lua
  useEffect(() => {
    return on<ScreenshotData>('screenshot:received', (payload) => {
      setData(payload)
    })
  }, [])

  if (!data) return null

  return (
    <div
      ref={ref}
      className="ea-floating-window ea-screenshot-viewer"
      // eslint-disable-next-line nui/no-inline-styles -- dynamic position/size for draggable floating window
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="ea-screenshot-viewer-header" data-window-drag-handle>
        <span className="ea-screenshot-viewer-title">
          <Icon name="camera" size="xs" />
          {data.playerName}
        </span>
        <button
          className="btn btn-ghost btn-icon ea-screenshot-viewer-close"
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          <Icon name="x" size="xs" />
        </button>
      </div>
      <div className="ea-screenshot-viewer-body">
        <img src={data.image} alt={`Screenshot of ${data.playerName}`} />
      </div>
    </div>
  )
}
