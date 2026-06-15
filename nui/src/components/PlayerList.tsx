import type { Player } from '../types'
import { Icon } from './icons'

interface PlayerListProps {
  players: Player[]
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectPlayer: (player: Player) => void
}

export function PlayerList({
  players,
  loading,
  searchQuery,
  onSearchChange,
  onSelectPlayer,
}: PlayerListProps) {
  const filtered = players.filter((player) => {
    const q = searchQuery.toLowerCase()
    return (
      player.name.toLowerCase().includes(q) ||
      String(player.id).includes(q) ||
      (player.license ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-container">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center flex-1">
          <Icon name="search" size="sm" className="text-muted shrink-0" />
          <input
            className="input"
            placeholder="Search by name, ID, or license..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search players"
          />
        </div>
        <span className="text-sm text-muted shrink-0">
          {filtered.length}/{players.length}
        </span>
      </div>

      {/* Player list */}
      {loading ? (
        <div className="spinner-center min-h-sm">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex items-center justify-center min-h-sm">
          <p className="text-secondary">
            {players.length === 0 ? 'No players connected' : 'No players match your search'}
          </p>
        </div>
      ) : (
        <div className="list" role="listbox" aria-label="Players">
          {filtered.map((player) => (
            <div
              key={player.id}
              className="list-item"
              role="option"
              aria-selected="false"
              onClick={() => onSelectPlayer(player)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectPlayer(player)
                }
              }}
              tabIndex={0}
            >
              <div className="avatar avatar-sm">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{player.name}</div>
                <div className="list-item-subtitle text-mono">
                  ID: {player.id}
                  {player.license ? ` -- ${player.license}` : ''}
                </div>
              </div>
              <div className="list-item-meta">
                {player.frozen && <Badge label="Frozen" variant="frozen" />}
                {player.muted && <Badge label="Muted" variant="muted" />}
                {player.developer && <Badge label="Dev" variant="dev" />}
                {player.contributor && <Badge label="Contrib" variant="contributor" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ label, variant }: { label: string; variant: string }) {
  return <span className={`badge badge-${variant}`}>{label}</span>
}
