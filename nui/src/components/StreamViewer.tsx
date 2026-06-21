/**
 * StreamViewer — floating window that displays a live stream of a player's screen.
 *
 * Receives frame data URIs via `stream:frame` messages from Lua.
 * Shows FPS counter, player name, and connection status.
 * Draggable via the topbar, closable via the X button.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { callLua, on } from '../fivem'
import { useWindowDrag, type WindowPosition } from '../hooks/useWindowDrag'
import { useWindowResize, type WindowSize } from '../hooks/useWindowResize'
import { Icon } from './icons'

interface StreamData {
  /** The image data URI (webp) */
  frame: string
  /** Name of the player being streamed */
  playerName: string
  /** Monotonic sequence number from the capture side (optional for back-compat) */
  seq?: number
  /** Server ID of the streamed player (optional for back-compat) */
  playerId?: number
}

interface StreamEndData {
  playerName: string
  reason: string
}

const DEFAULT_POS: WindowPosition = { x: 0, y: 0 }
const DEFAULT_SIZE: WindowSize = { width: 640, height: 420 }

export function StreamViewer() {
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [position, setPosition] = useState<WindowPosition>(DEFAULT_POS)
  const [size, setSize] = useState<WindowSize>(DEFAULT_SIZE)
  const [error, setError] = useState<string | null>(null)

  // FPS tracking
  const frameCountRef = useRef(0)
  const fpsRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)
  const [displayFps, setDisplayFps] = useState(0)

  // Drop out-of-order frames: only render frames with a seq > last displayed.
  // Reset counter when the streamed player changes (new stream session).
  const lastSeqRef = useRef(0)
  const lastPlayerRef = useRef<string | null>(null)

  // Center on open
  const openRef = useRef(false)
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (playerName && !openRef.current) {
      openRef.current = true
      setPosition({
        x: Math.round(window.innerWidth / 2 - 320),
        y: Math.round(window.innerHeight / 2 - 210),
      })
    }
    if (!playerName) {
      openRef.current = false
    }
  }, [playerName])

  const handleClose = useCallback(() => {
    // Tell the server to remove us as a viewer before clearing local state
    const id = playerId
    if (id) callLua('stream:stop', { id }).catch(() => {})

    setPlayerName(null)
    setPlayerId(null)
    setImageUrl(null)
    setError(null)
    setDisplayFps(0)
    frameCountRef.current = 0
    lastSeqRef.current = 0
    lastPlayerRef.current = null
  }, [playerId])

  useWindowDrag({
    enabled: !!playerName,
    position,
    onPositionChange: setPosition,
    elementRef: windowRef,
  })

  useWindowResize({
    enabled: !!playerName,
    size,
    elementRef: windowRef,
    onSizeChange: setSize,
    onPositionChange: setPosition,
    applyStyles: (w, h, x, y) => {
      const el = windowRef.current
      if (!el) return
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      if (x !== undefined) el.style.left = `${x}px`
      if (y !== undefined) el.style.top = `${y}px`
    },
  })

  // Listen for stream frames from Lua
  useEffect(() => {
    return on<StreamData>('stream:frame', (payload) => {
      setPlayerName(payload.playerName)
      const seq = payload.seq
      const pid = payload.playerId
      if (typeof pid === 'number') setPlayerId(pid)
      setError(null)

      // Drop out-of-order frames: if this frame's seq is <= the last one we
      // displayed, it's stale (arrived late due to network latency) — skip it.
      if (payload.playerName !== lastPlayerRef.current) {
        // New player — reset sequence counter for the fresh stream session
        lastSeqRef.current = 0
        lastPlayerRef.current = payload.playerName
      }
      // Treat a large backward jump as a capture-side restart (the target's
      // NUI reloaded, resetting its seq counter to a small number) and ACCEPT
      // the frame. This mirrors the server's seq==1 exception in
      // stream_signaling.lua's relayFrame(). Without it, a mid-stream target
      // NUI reload would make the viewer discard every restarted frame
      // (1 <= lastLargeSeq) and freeze on the last pre-reload frame forever.
      const RESET_THRESHOLD = 1000
      const isCaptureReset =
        typeof seq === 'number' &&
        lastSeqRef.current > RESET_THRESHOLD &&
        seq <= RESET_THRESHOLD
      if (typeof seq === 'number' && !isCaptureReset && seq <= lastSeqRef.current) return
      if (typeof seq === 'number') lastSeqRef.current = seq

      // Track FPS
      frameCountRef.current += 1
      const now = performance.now()
      const elapsed = now - lastFpsUpdateRef.current
      if (elapsed >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed)
        frameCountRef.current = 0
        lastFpsUpdateRef.current = now
        setDisplayFps(fpsRef.current)
      }

      // Update image — setState triggers re-render for the new frame
      setImageUrl(payload.frame)
    })
  }, [])

  // Listen for stream ended from Lua
  useEffect(() => {
    return on<StreamEndData>('stream:ended', (payload) => {
      if (playerName === payload.playerName) {
        setError(payload.reason)
        // Auto-close after 3 seconds
        setTimeout(() => {
          setPlayerName(null)
          setImageUrl(null)
          setError(null)
          setDisplayFps(0)
          lastSeqRef.current = 0
          lastPlayerRef.current = null
        }, 3000)
      }
    })
  }, [playerName])

  if (!playerName) return null

  return (
    <div
      ref={windowRef}
      className="ea-floating-window ea-stream-viewer"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="ea-stream-viewer-header" data-window-drag-handle>
        <span className="ea-stream-viewer-title">
          <Icon name="play" size="xs" />
          {playerName}
        </span>
        <div className="ea-stream-viewer-status">
          {error ? (
            <span className="ea-stream-viewer-error">{error}</span>
          ) : (
            <span className="ea-stream-viewer-fps">
              <span className="ea-stream-viewer-dot" />
              {displayFps} FPS
            </span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-icon ea-stream-viewer-close"
          onClick={handleClose}
          aria-label="Close stream"
          title="Close stream"
        >
          <Icon name="x" size="xs" />
        </button>
      </div>
      <div className="ea-stream-viewer-body">
        {imageUrl ? (
          <img src={imageUrl} alt={`Stream of ${playerName}`} />
        ) : (
          <div className="ea-stream-viewer-loading">
            <span className="ea-stream-viewer-spinner" />
            Connecting...
          </div>
        )}
      </div>
    </div>
  )
}
