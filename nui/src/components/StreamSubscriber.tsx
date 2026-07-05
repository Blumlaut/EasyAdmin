/**
 * StreamSubscriber — floating window that displays a live PeerJS stream of a
 * player's screen.
 *
 * The video arrives peer-to-peer over WebRTC via PeerJS (no per-frame server
 * events). The target (publisher) initiates the WebRTC call because the caller's
 * SDP offer must contain the media tracks — if the viewer called first with no
 * tracks, the target's video answer would be silently dropped by the WebRTC spec.
 *
 * The server signals this NUI with:
 *   streamSubscriber:start        — a stream session is active (opens the window)
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

const LOG = '[EA-StreamSubscriber]'

type ConnectionState = 'waiting' | 'live' | 'failed'

interface StreamStartData {
  targetId: number
  targetName: string
  iceConfig: IceConfigPayload
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
    console.log(LOG, 'teardownPeer()')
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
      console.log(LOG, 'start: targetId=', payload.targetId, 'targetName=', payload.targetName)
      teardownPeer()
      iceConfigRef.current = payload.iceConfig
      setTargetName(payload.targetName)
      setTargetId(payload.targetId)
      setError(null)
      setConnState('waiting')

      // Create PeerJS instance — the target will call us
      const peerConfig = buildPeerConfig(payload.iceConfig)
      console.log(LOG, 'start: peer config:', JSON.stringify(peerConfig))

      const setupPeer = (p: Peer) => {
        p.on('open', () => {
          console.log(LOG, 'PeerJS open, id:', p.id)
          void callLua('streamSubscriber:peerReady', { peerId: p.id, role: 'viewer' })
        })

        p.on('call', (call) => {
          console.log(LOG, 'incoming call from:', call.peer)
          call.answer(new MediaStream())
          callRef.current = call

          call.on('stream', (stream) => {
            console.log(LOG, 'received remote stream, tracks:', stream.getTracks().length)
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              void videoRef.current.play().catch(() => {})
            }
            setConnState('live')
            setError(null)
          })

          call.on('close', () => {
            console.log(LOG, 'call closed')
            callRef.current = null
            if (connState === 'live') {
              setConnState('failed')
              setError('Connection lost')
            }
          })

          call.on('error', (err) => {
            console.error(LOG, 'call error:', err)
            callRef.current = null
            if (connState === 'live') {
              setConnState('failed')
              setError('Connection error')
            }
          })
        })

        p.on('disconnected', () => {
          console.log(LOG, 'PeerJS disconnected, attempting reconnect')
          try {
            p.reconnect()
          } catch {
            console.error(LOG, 'PeerJS reconnect failed')
          }
        })

        p.on('error', (err) => {
          console.error(LOG, 'PeerJS error:', err.type, err.message)
          if (err.type === 'unavailable-id') {
            // ID collision — create a new peer with a different ID
            try {
              p.destroy()
            } catch { /* already destroyed */ }
            peerRef.current = null
            const newPeerId = `ea-viewer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            const newPeer = new Peer(newPeerId, peerConfig)
            peerRef.current = newPeer
            setupPeer(newPeer)
          }
        })
      }

      const peerId = `ea-viewer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      console.log(LOG, 'start: creating PeerJS with id', peerId)
      const peer = new Peer(peerId, peerConfig)
      peerRef.current = peer
      setupPeer(peer)
    })
  }, [teardownPeer])

  // Listen for stream ended from Lua (target disconnected, etc.)
  useEffect(() => {
    return on<StreamEndData>('streamSubscriber:ended', (payload) => {
      console.log(LOG, 'ended: targetName=', payload.targetName, 'reason=', payload.reason)
      if (targetName === payload.targetName) {
        teardownPeer()
        setError(payload.reason)
        setConnState('failed')
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
