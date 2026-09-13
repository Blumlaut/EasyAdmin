import { useEffect, useMemo, useState } from 'react'
import type { Player, Permissions, MapPlayerPos } from '../../types'
import { callLua, on } from '../../fivem'
import { SC_STYLES, type ScStyle } from '../../lib/gtaMap'
import { GtaVMap } from './GtaVMap'
import { RedMGrid } from './RedMGrid'
import { Icon } from '../../components/icons'

export interface MapPlayer {
  player: Player
  pos: { x: number; y: number }
  isSelf: boolean
}

interface MapPageProps {
  players: Player[]
  permissions: Permissions
  isRedm: boolean
  onOpenPlayer: (player: Player) => void
}

export function MapPage({ players, permissions, isRedm, onOpenPlayer }: MapPageProps) {
  const [positions, setPositions] = useState<MapPlayerPos[]>([])
  const [selfId, setSelfId] = useState<number | null>(null)
  const [style, setStyle] = useState<ScStyle>('render')
  const hasMapPerm = !!permissions['server.map.view']

  // Live position stream from the server (2 Hz while the menu is open).
  // Server-side collection: the server sees every player regardless of
  // streaming range or routing bucket, so all positions are authoritative.
  useEffect(() => {
    if (!hasMapPerm) return
    return on<{ players: MapPlayerPos[]; selfId: number }>('updateMapPlayers', (data) => {
      setPositions(data.players)
      setSelfId(data.selfId)
    })
  }, [hasMapPerm])

  // Ask the server to stream positions while the page is open.
  useEffect(() => {
    if (!hasMapPerm) return
    callLua('setMapStream', { active: true }).catch(() => {})
    return () => {
      callLua('setMapStream', { active: false }).catch(() => {})
    }
  }, [hasMapPerm])

  const mapPlayers = useMemo<MapPlayer[]>(() => {
    const posById = new Map(positions.map((p) => [p.id, p]))
    const result: MapPlayer[] = []
    for (const player of players) {
      const pos = posById.get(player.id)
      if (!pos) continue
      result.push({ player, pos: { x: pos.x, y: pos.y }, isSelf: selfId !== null && player.id === selfId })
    }
    return result
  }, [players, positions, selfId])

  if (!hasMapPerm) {
    return (
      <div className="map-empty">
        <p>You don't have permission to view the map.</p>
      </div>
    )
  }

  return (
    <div className="map-page">
      {!isRedm && (
        <div className="map-page-toolbar" role="group" aria-label="Map style">
          {SC_STYLES.map((s) => (
            <button
              key={s}
              className={`btn btn-sm${style === s ? ' btn-primary' : ' btn-ghost'}`}
              onClick={() => setStyle(s)}
              aria-pressed={style === s}
            >
              {s === 'render' ? 'Render' : s === 'game' ? 'Game' : 'Print'}
            </button>
          ))}
        </div>
      )}

      <div className="map-page-canvas">
        {isRedm ? (
          <RedMGrid mapPlayers={mapPlayers} onOpenPlayer={onOpenPlayer} />
        ) : (
          <GtaVMap mapPlayers={mapPlayers} style={style} permissions={permissions} onOpenPlayer={onOpenPlayer} />
        )}
        <div className="map-legend" aria-hidden="true">
          <span className="map-legend-item">
            <span className="map-legend-swatch map-legend-swatch--self" />
            You
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch map-legend-swatch--normal" />
            Player
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch map-legend-swatch--admin" />
            Admin
          </span>
          <span className="map-legend-item">
            <span className="map-legend-swatch map-legend-swatch--frozen" />
            Frozen
          </span>
        </div>
      </div>

      {positions.length === 0 && (
        <div className="map-page-overlay" role="status">
          <Icon name="map-pin" size="sm" />
          <span>Awaiting player positions…</span>
        </div>
      )}
    </div>
  )
}
