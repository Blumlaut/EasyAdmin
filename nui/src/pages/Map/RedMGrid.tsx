import { useMemo } from 'react'
import type { Player } from '../../types'
import type { MapPlayer } from './MapPage'

interface RedMGridProps {
  mapPlayers: MapPlayer[]
  onOpenPlayer: (player: Player) => void
}

const VIEW = 800 // internal svg coordinate size (square)
const PAD = 40 // room for axis labels

/**
 * RedM has no tile source — render a plain coordinate grid so admins still
 * get spatial awareness (clusters, distances, relative positions).
 */
export function RedMGrid({ mapPlayers, onOpenPlayer }: RedMGridProps) {
  const model = useMemo(() => {
    const xs = mapPlayers.map((p) => p.pos.x)
    const ys = mapPlayers.map((p) => p.pos.y)
    let minX = xs.length ? Math.min(...xs) : -10000
    let maxX = xs.length ? Math.max(...xs) : 10000
    let minY = ys.length ? Math.min(...ys) : -10000
    let maxY = ys.length ? Math.max(...ys) : 10000
    let spanX = Math.max(maxX - minX, 1)
    let spanY = Math.max(maxY - minY, 1)
    const pad = Math.max(spanX, spanY) * 0.15
    minX -= pad; maxX += pad; minY -= pad; maxY += pad
    spanX = maxX - minX
    spanY = maxY - minY
    // force square, at least 8000 units across
    const span = Math.max(spanX, spanY, 8000)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    minX = cx - span / 2
    minY = cy - span / 2
    maxX = cx + span / 2
    maxY = cy + span / 2

    // grid step: aim for ~10 lines with a "nice" value
    const rawStep = span / 10
    const mag = 10 ** Math.floor(Math.log10(rawStep))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rawStep) ?? 10 * mag

    const toX = (wx: number) => PAD + ((wx - minX) / span) * (VIEW - 2 * PAD)
    const toY = (wy: number) => VIEW - PAD - ((wy - minY) / span) * (VIEW - 2 * PAD)

    const vLines: number[] = []
    for (let v = Math.ceil(minX / step) * step; v <= maxX; v += step) vLines.push(v)
    const hLines: number[] = []
    for (let v = Math.ceil(minY / step) * step; v <= maxY; v += step) hLines.push(v)

    return { toX, toY, vLines, hLines, step, minX, minY, maxX, maxY }
  }, [mapPlayers])

  return (
    <div className="redm-grid" role="img" aria-label="Player position grid">
      <div className="redm-grid-caption">
        No map tiles available for RedM — positions shown as a coordinate grid (1 unit = 2 m, north is up).
      </div>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="redm-grid-svg">
        {model.vLines.map((v) => (
          <g key={`v${v}`}>
            <line x1={model.toX(v)} y1={PAD} x2={model.toX(v)} y2={VIEW - PAD} className="redm-grid-line" />
            <text x={model.toX(v)} y={VIEW - PAD + 18} className="redm-grid-label" textAnchor="middle">
              {v}
            </text>
          </g>
        ))}
        {model.hLines.map((v) => (
          <g key={`h${v}`}>
            <line x1={PAD} y1={model.toY(v)} x2={VIEW - PAD} y2={model.toY(v)} className="redm-grid-line" />
            <text x={PAD - 8} y={model.toY(v) + 4} className="redm-grid-label" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {mapPlayers.map((p) => {
          const cls = p.isSelf ? 'redm-dot--self' : p.player.frozen ? 'redm-dot--frozen' : p.player.admin ? 'redm-dot--admin' : 'redm-dot--normal'
          return (
            <circle
              key={p.player.id}
              cx={model.toX(p.pos.x)}
              cy={model.toY(p.pos.y)}
              r={p.isSelf ? 8 : 5.5}
              className={`redm-dot ${cls}`}
              onClick={() => onOpenPlayer(p.player)}
            >
              <title>{`${p.player.name} (ID ${p.player.id}) — ${Math.round(p.pos.x)}, ${Math.round(p.pos.y)}`}</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}
