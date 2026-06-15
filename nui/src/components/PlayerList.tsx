import { useMemo, useState } from 'react'
import type { Player } from '../types'

interface PlayerListProps {
  players: Player[]
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectPlayer: (player: Player) => void
}

export function PlayerList({ players, loading, searchQuery, onSearchChange, onSelectPlayer }: PlayerListProps) {
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players
    const q = searchQuery.toLowerCase()
    return players.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.id.toString().includes(q) ||
      p.identifier?.toLowerCase().includes(q) ||
      p.license?.toLowerCase().includes(q) ||
      p.discord?.toLowerCase().includes(q)
    )
  }, [players, searchQuery])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: '100%',
    }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          type="text"
          placeholder="Search by name, ID, or identifier..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
        {searchQuery && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
            fontSize: 12,
            padding: '0 8px',
          }}>
            {filteredPlayers.length} result{filteredPlayers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Player list */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
          }}>
            <div className="spinner" />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            {players.length === 0 ? 'No players online' : 'No players match your search'}
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
              }}>
                <th style={headerStyle}>ID</th>
                <th style={headerStyle}>Name</th>
                <th style={headerStyle}>Identifier</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  onClick={() => onSelectPlayer(player)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  background: 'var(--bg-tertiary)',
}

interface PlayerRowProps {
  player: Player
  onClick: () => void
}

function PlayerRow({ player, onClick }: PlayerRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 100ms',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <td style={cellStyle}>
        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
          {player.id}
        </span>
      </td>
      <td style={cellStyle}>
        <span style={{ fontWeight: 500 }}>{player.name}</span>
      </td>
      <td style={cellStyle}>
        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          {player.identifier?.slice(0, 24) || player.license?.slice(0, 24) || 'N/A'}
        </span>
      </td>
      <td style={cellStyle}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {player.frozen && <span className="badge badge-red">Frozen</span>}
          {player.muted && <span className="badge badge-orange">Muted</span>}
          {player.developer && <span className="badge badge-purple">Dev</span>}
          {player.contributor && <span className="badge badge-blue">Contrib</span>}
          {!player.frozen && !player.muted && !player.developer && !player.contributor && (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Online</span>
          )}
        </div>
      </td>
    </tr>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 13,
}


