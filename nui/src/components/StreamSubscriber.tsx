/**
 * StreamSubscriber — floating window that displays a live PeerJS stream of a
 * player's screen.
 *
 * The video arrives peer-to-peer over WebRTC via PeerJS (no per-frame server
 * events). The server signals this NUI with:
 *   streamSubscriber:start        — a stream session is active (opens the window)
 *   streamSubscriber:targetReady  — the target's PeerJS ID is ready
 *   streamSubscriber:ended        — the stream ended (target disconnected / stopped)
 *
 * Draggable via the topbar, closable via the X button.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { type MediaConnection } from 'peerjs'
import { callLua, on } from '../fivem'
import { useTranslation } from '../lib/i18n'
import { useWindowDrag, type WindowPosition } from '../hooks/useWindowDrag'
import { useWindowResize, type WindowSize } from '../hooks/useWindowResize'
import { buildPeerConfig, type IceConfigPayload } from '../lib/stream_ice'
import { Icon } from './icons'

type ConnectionState = 'waiting' | 'connecting' | 'live' | 'reconnecting' | 'failed'

interface StreamStartData {
  targetId: number
  targetName: string
  iceConfig: IceConfigPayload
}

interface TargetReadyData {
  targetPeerId: string
}

interface StreamEndData {
  targetName: string
  reason: string
}

const DEFAULT_POS: WindowPosition = { x: 0, y: 0 }
const DEFAULT_SIZE: WindowSize = { width: 640, height: 420 }

export function StreamSubscriber() {
  const { t } = useTranslation()
  const [targetName, setTargetName] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [position, setPosition] = useState<WindowPosition>(DEFAULT_POS)
  const [size, setSize] = useState<WindowSize>(DEFAULT_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [connState, setConnState] = useState<ConnectionState>('waiting')

  const videoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const iceConfigRef = useRef<IceConfigPayload | null>(null)
  const targetPeerIdRef = useRef<string | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Center on open
  const openRef = useRef(false)
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (targetName && !openRef.current) {
      openRef.current = true
      setPosition({
        x: Math.round(window.innerWidth / 2 - 320),
        y: Math.round(window.innerHeight / 2 - 210),
      })
    }
    if (!targetName) {
      openRef.current = false
    }
  }, [targetName])

  const teardownPeer = useCallback(() => {
    // Clear retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    retryCountRef.current = 0

    // Close the media call
    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }

    // Destroy PeerJS instance
    if (peerRef.current) {
      try {
        peerRef.current.destroy()
      } catch {
        // Already destroyed
      }
      peerRef.current = null
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Use a ref to break the circular dependency between attemptCall and attemptReconnect
  const attemptCallRef = useRef<(() => void) | null>(null)

  const attemptReconnect = useCallback(() => {
    if (retryCountRef.current >= 2) {
      setConnState('failed')
      setError('Connection lost')
      return
    }

    retryCountRef.current++
    setConnState('reconnecting')

    retryTimerRef.current = setTimeout(() => {
      attemptCallRef.current?.()
    }, 2000)
  }, [])

  const attemptCall = useCallback(() => {
    const peer = peerRef.current
    const targetPeerId = targetPeerIdRef.current
    if (!peer || !targetPeerId) return

    setConnState('connecting')

    // Pass an empty MediaStream — the subscriber only receives video, doesn't send
    const call = peer.call(targetPeerId, new MediaStream())
    callRef.current = call

    call.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        void videoRef.current.play().catch(() => {})
      }
      setConnState('live')
      setError(null)
      retryCountRef.current = 0
    })

    call.on('close', () => {
      callRef.current = null
      // If we're still supposed to be connected, attempt reconnect
      if (targetName) {
        attemptReconnect()
      }
    })

    call.on('error', () => {
      callRef.current = null
      attemptReconnect()
    })
  }, [targetName, attemptReconnect])

  // Keep the ref in sync
  useEffect(() => {
    attemptCallRef.current = attemptCall
  }, [attemptCall])

  const handleClose = useCallback(() => {
    // Tell the server to remove us as a viewer before clearing local state
    const id = targetId
    if (id) {
      void callLua('streamSubscriber:stop', { targetId: id }).catch(() => {})
    }

    teardownPeer()
    setTargetName(null)
    setTargetId(null)
    setError(null)
    setConnState('waiting')
    targetPeerIdRef.current = null
  }, [targetId, teardownPeer])

  useWindowDrag({
    enabled: !!targetName,
    position,
    onPositionChange: setPosition,
    elementRef: windowRef,
  })

  useWindowResize({
    enabled: !!targetName,
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
    return on<StreamStartData>('streamSubscriber:start', (payload) => {
      teardownPeer()
      iceConfigRef.current = payload.iceConfig
      setTargetName(payload.targetName)
      setTargetId(payload.targetId)
      setError(null)
      setConnState('waiting')
      retryCountRef.current = 0

      // Create PeerJS instance
      const peerConfig = buildPeerConfig(payload.iceConfig)
      const peerId = `ea-viewer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const peer = new Peer(peerId, peerConfig)
      peerRef.current = peer

      peer.on('open', () => {
        // Report our peerId to the server
        void callLua('streamSubscriber:peerReady', { peerId: peer.id })
      })

      peer.on('disconnected', () => {
        try {
          peer.reconnect()
        } catch {
          // Reconnect failed
        }
      })

      peer.on('error', (err) => {
        // PeerJS error — likely a network issue
        if (err.type === 'unavailable-id' || err.type === 'peer-unavailable') {
          attemptReconnect()
        }
      })
    })
  }, [teardownPeer, attemptCall, attemptReconnect])

  // Target's PeerJS ID is ready — initiate the call
  useEffect(() => {
    return on<TargetReadyData>('streamSubscriber:targetReady', (payload) => {
      targetPeerIdRef.current = payload.targetPeerId
      attemptCall()
    })
  }, [attemptCall])

  // Listen for stream ended from Lua (target disconnected, etc.)
  useEffect(() => {
    return on<StreamEndData>('streamSubscriber:ended', (payload) => {
      if (targetName === payload.targetName) {
        teardownPeer()
        setError(payload.reason)
        setConnState('failed')
        targetPeerIdRef.current = null
        // Auto-close after 3 seconds
        setTimeout(() => {
          setTargetName(null)
          setTargetId(null)
          setError(null)
          setConnState('waiting')
        }, 3000)
      }
    })
  }, [targetName, teardownPeer])

  // Clean up on unmount
  useEffect(() => {
    return () => teardownPeer()
  }, [teardownPeer])

  if (!targetName) return null

  const statusLabel =
    error != null
      ? error
      : connState === 'live'
        ? 'LIVE'
        : connState === 'failed'
          ? 'Disconnected'
          : connState === 'reconnecting'
            ? 'Reconnecting…'
            : connState === 'connecting'
              ? 'Connecting…'
              : 'Waiting…'

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
          {targetName}
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
          aria-label={`Stream of ${targetName}`}
        />
        {connState !== 'live' && (
          <div className="ea-stream-viewer-loading">
            <span className="ea-stream-viewer-spinner" />
            {connState === 'failed' ? (error ?? 'Disconnected') : statusLabel}
          </div>
        )}
      </div>
    </div>
  )
}
