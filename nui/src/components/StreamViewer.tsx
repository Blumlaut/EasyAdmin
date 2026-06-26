/**
 * StreamViewer — floating window that displays a live WebRTC stream of a
 * player's screen.
 *
 * The video arrives peer-to-peer over WebRTC (no per-frame server events).
 * The server signals this NUI with:
 *   stream:started — a stream session is active (opens the window)
 *   stream:signal  — an SDP offer from the target's publisher
 *   stream:ended   — the stream ended (target disconnected / stopped)
 *
 * Draggable via the topbar, closable via the X button.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { callLua, on } from '../fivem'
import { useTranslation } from '../lib/i18n'
import { useWindowDrag, type WindowPosition } from '../hooks/useWindowDrag'
import { useWindowResize, type WindowSize } from '../hooks/useWindowResize'
import { StreamSubscriber, parseStunServers } from '../lib/stream_webrtc'
import { Icon } from './icons'

type ConnState = 'connecting' | 'live' | 'reconnecting' | 'failed'

interface StreamStartedData {
  playerId: number
  playerName: string
  stunServers: string
}

interface StreamSignalData {
  from: number
  payload: { type: 'offer' | 'answer'; sdp: string }
}

interface StreamEndData {
  playerName: string
  reason: string
}

const DEFAULT_POS: WindowPosition = { x: 0, y: 0 }
const DEFAULT_SIZE: WindowSize = { width: 640, height: 420 }

export function StreamViewer() {
  const { t } = useTranslation()
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [position, setPosition] = useState<WindowPosition>(DEFAULT_POS)
  const [size, setSize] = useState<WindowSize>(DEFAULT_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [connState, setConnState] = useState<ConnState>('connecting')

  const videoRef = useRef<HTMLVideoElement>(null)
  const subscriberRef = useRef<StreamSubscriber | null>(null)
  const stunRef = useRef<string[]>([])

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

  const teardownSubscriber = useCallback(() => {
    subscriberRef.current?.close()
    subscriberRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleClose = useCallback(() => {
    // Tell the server to remove us as a viewer before clearing local state
    const id = playerId
    if (id) callLua('stream:stop', { id }).catch(() => {})

    teardownSubscriber()
    setPlayerName(null)
    setPlayerId(null)
    setError(null)
    setConnState('connecting')
  }, [playerId, teardownSubscriber])

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

  // Open the viewer window when the server confirms the stream session is up
  useEffect(() => {
    return on<StreamStartedData>('stream:started', (payload) => {
      teardownSubscriber()
      stunRef.current = parseStunServers(payload.stunServers)
      setPlayerName(payload.playerName)
      setPlayerId(payload.playerId)
      setError(null)
      setConnState('connecting')
    })
  }, [teardownSubscriber])

  // Handle inbound WebRTC signaling (an offer from the target's publisher)
  useEffect(() => {
    return on<StreamSignalData>('stream:signal', (payload) => {
      if (payload.payload?.type !== 'offer') return
      // A new offer means a fresh publisher connection — create a subscriber.
      teardownSubscriber()
      const sub = new StreamSubscriber(stunRef.current)
      sub.onStream = (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
        setConnState('live')
        setError(null)
      }
      sub.onClose = () => {
        setConnState((prev) => (prev === 'live' ? 'reconnecting' : 'failed'))
      }
      subscriberRef.current = sub
      void sub.handleSignal(payload.from, payload.payload)
    })
  }, [teardownSubscriber])

  // Listen for stream ended from Lua (target disconnected, etc.)
  useEffect(() => {
    return on<StreamEndData>('stream:ended', (payload) => {
      if (playerName === payload.playerName) {
        teardownSubscriber()
        setError(payload.reason)
        setConnState('failed')
        // Auto-close after 3 seconds
        setTimeout(() => {
          setPlayerName(null)
          setPlayerId(null)
          setError(null)
          setConnState('connecting')
        }, 3000)
      }
    })
  }, [playerName, teardownSubscriber])

  // Clean up on unmount
  useEffect(() => {
    return () => teardownSubscriber()
  }, [teardownSubscriber])

  if (!playerName) return null

  const statusLabel =
    error != null
      ? error
      : connState === 'live'
        ? 'LIVE'
        : connState === 'failed'
          ? 'Disconnected'
          : 'Connecting…'

  return (
    <div
      ref={windowRef}
      className="ea-floating-window ea-stream-viewer"
      // eslint-disable-next-line nui/no-inline-styles -- dynamic position/size for draggable floating window
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
          <span className={`ea-stream-viewer-fps ea-stream-viewer-state--${connState}`}>
            <span className="ea-stream-viewer-dot" />
            {statusLabel}
          </span>
        </div>
        <button
          className="btn btn-ghost btn-icon ea-stream-viewer-close"
          onClick={handleClose}
          aria-label={t("Close stream")}
          title={t("Close stream")}
        >
          <Icon name="x" size="xs" />
        </button>
      </div>
      <div className="ea-stream-viewer-body">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label={`Stream of ${playerName}`}
        />
        {connState !== 'live' && (
          <div className="ea-stream-viewer-loading">
            <span className="ea-stream-viewer-spinner" />
            {connState === 'failed' ? (error ?? 'Disconnected') : 'Connecting...'}
          </div>
        )}
      </div>
    </div>
  )
}
