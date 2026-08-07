/**
 * StreamSubscriber — floating window that displays a live PeerJS stream of a
 * player's screen.
 *
 * The video arrives peer-to-peer over WebRTC via PeerJS (no per-frame server
 * events). The target (publisher) initiates the WebRTC call because the caller's
 * SDP offer must contain the media tracks — if the viewer called first with no
 * tracks, the target's video answer would be silently dropped by the WebRTC spec.
 *
 * Multiple instances can be mounted concurrently (one per active stream).
 * Each instance owns its own PeerJS connection and video element.
 *
 * The server signals this NUI with:
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

interface StreamEndData {
  targetId: number
  targetName: string
  reason: string
}

const DEFAULT_POS: WindowPosition = { x: 0, y: 0 }
const DEFAULT_SIZE: WindowSize = { width: 640, height: 420 }

export interface StreamSubscriberProps {
  /** Server ID of the streamed player (used as React key). */
  targetId: number
  /** Display name of the streamed player. */
  targetName: string
  /** ICE server configuration for PeerJS. */
  iceConfig: IceConfigPayload
  /** Called when the user closes the viewer. */
  onClose: (targetId: number) => void
}

export function StreamSubscriber({ targetId, targetName, iceConfig, onClose }: StreamSubscriberProps) {
  const { t } = useTranslation()
  const [position, setPosition] = useState<WindowPosition>(DEFAULT_POS)
  const [size, setSize] = useState<WindowSize>(DEFAULT_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [connState, setConnState] = useState<ConnectionState>('waiting')

  const videoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)

  // Center on open (offset by instance to avoid stacking)
  const openRef = useRef(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(Math.random() * 40)

  useEffect(() => {
    if (!openRef.current) {
      openRef.current = true
      setPosition({
        x: Math.round(window.innerWidth / 2 - 320 + offsetRef.current),
        y: Math.round(window.innerHeight / 2 - 210 + offsetRef.current),
      })
    }
  }, [])

  const teardownPeer = useCallback(() => {
    console.log(LOG, targetId, 'teardownPeer()')
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
  }, [targetId])

  const handleClose = useCallback(() => {
    // Tell the server to remove us as a viewer before tearing down locally
    const id = targetId
    void callLua('streamSubscriber:stop', { targetId: id }).catch(() => {})

    teardownPeer()
    onClose(id)
  }, [targetId, onClose, teardownPeer])

  useWindowDrag({
    enabled: true,
    position,
    onPositionChange: setPosition,
    elementRef: windowRef,
  })

  useWindowResize({
    enabled: true,
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

  // Initialize PeerJS on mount — the target will call us
  useEffect(() => {
    console.log(LOG, targetId, 'init: targetName=', targetName)
    const peerConfig = buildPeerConfig(iceConfig)
    console.log(LOG, targetId, 'init: peer config:', JSON.stringify(peerConfig))

    const setupPeer = (p: Peer) => {
      p.on('open', () => {
        console.log(LOG, targetId, 'PeerJS open, id:', p.id)
        void callLua('streamSubscriber:peerReady', { peerId: p.id, targetId, role: 'viewer' })
      })

      p.on('call', (call) => {
        console.log(LOG, targetId, 'incoming call from:', call.peer)
        call.answer(new MediaStream())
        callRef.current = call

        call.on('stream', (stream) => {
          console.log(LOG, targetId, 'received remote stream, tracks:', stream.getTracks().length)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            void videoRef.current.play().catch(() => {})
          }
          setConnState('live')
          setError(null)
        })

        call.on('close', () => {
          console.log(LOG, targetId, 'call closed')
          callRef.current = null
          setConnState((prev) => (prev === 'live' ? 'failed' : prev))
          setError('Connection lost')
        })

        call.on('error', (err) => {
          console.error(LOG, targetId, 'call error:', err)
          callRef.current = null
          setConnState((prev) => (prev === 'live' ? 'failed' : prev))
          setError('Connection error')
        })
      })

      p.on('disconnected', () => {
        console.log(LOG, targetId, 'PeerJS disconnected, attempting reconnect')
        try {
          p.reconnect()
        } catch {
          console.error(LOG, targetId, 'PeerJS reconnect failed')
        }
      })

      p.on('error', (err) => {
        console.error(LOG, targetId, 'PeerJS error:', err.type, err.message)
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

    const peerId = `ea-viewer-${targetId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(LOG, targetId, 'init: creating PeerJS with id', peerId)
    const peer = new Peer(peerId, peerConfig)
    peerRef.current = peer
    setupPeer(peer)

    return () => {
      console.log(LOG, targetId, 'cleanup: unmounting')
      teardownPeer()
    }
  }, [targetId, iceConfig, teardownPeer])

  // Listen for stream ended from Lua (target disconnected, etc.)
  // Each instance only reacts to the ended event matching its own targetId.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = on<StreamEndData>('streamSubscriber:ended', (payload) => {
      console.log(LOG, targetId, 'ended: targetId=', payload.targetId, 'reason=', payload.reason)
      if (targetId === payload.targetId) {
        teardownPeer()
        setError(payload.reason)
        setConnState('failed')
        // Auto-close after 3 seconds
        timer = setTimeout(() => {
          onClose(targetId)
          timer = null
        }, 3000)
      }
    })

    return () => {
      unsubscribe()
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }, [targetId, teardownPeer, onClose])

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
