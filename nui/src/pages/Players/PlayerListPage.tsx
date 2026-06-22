import { useMemo, useRef, useState } from 'react'
import type { Permissions, Player } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { filterPlayers } from '../../lib/playerSearch'
import { SearchBar } from '../../components/SearchBar'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/icons'
import { Tooltip } from '../../components/Tooltip'
import { RoleBadges } from '../../components/RoleBadges'
import { ListItem } from '../../components/ListItem'
import { PlayerListSkeleton } from '../../components/PlayerListSkeleton'
import { AllPlayersActions } from './AllPlayersActions'

interface PlayerListPageProps {
  players: Player[]
  loading: boolean
  permissions: Permissions
  onSelectPlayer: (player: Player) => void
  onOpenCached: () => void
  onRefresh: () => void
}

export function PlayerListPage({
  players,
  loading,
  permissions,
  onSelectPlayer,
  onOpenCached,
  onRefresh,
}: PlayerListPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    return filterPlayers(players, debouncedQuery)
  }, [players, debouncedQuery])

  const listRef = useRef<HTMLDivElement>(null)

  useListKeyboardNav(listRef, filtered.length)

  const canTeleportAll = !!permissions['player.teleport.everyone']

  return (
    <div className="page-container">
      <div className="mb-3 flex items-center gap-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, ID, or identifier..."
          resultCount={{ shown: filtered.length, total: players.length }}
          ariaLabel="Search players"
        />
        <button className="btn btn-secondary btn-sm" onClick={onOpenCached}>
          <Icon name="archive" size="xs" />
          Cached players
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
      </div>

      {loading ? (
        <PlayerListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Icon name="users" size="lg" className="text-fg-muted" />
          </div>
          <p className="text-fg-subtle">
            {players.length === 0 ? 'No players connected' : 'No players match your search'}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="list">
          {filtered.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              onClick={() => onSelectPlayer(player)}
            />
          ))}
        </div>
      )}

      {(canTeleportAll || !!permissions['server.mute.global']) && players.length > 0 && (
        <AllPlayersActions permissions={permissions} />
      )}
    </div>
  )
}

function PlayerRow({ player, onClick }: { player: Player; onClick: () => void }) {
  return (
    <ListItem onClick={onClick}>
      <Avatar key={player.id} player={player} size="sm" variant="player" />
      <div className="list-item-content">
        <div className="list-item-title">
          <span className="list-item-title-text">{player.name}</span>
          <RoleBadges player={player} />
        </div>
        <div className="list-item-subtitle text-mono">
          ID: {player.id}
          {player.license ? ` -- ${player.license}` : ''}
        </div>
      </div>
      <div className="list-item-meta">
        {player.frozen && (
          <Tooltip content="This player is frozen">
            <span className="badge badge-frozen">Frozen</span>
          </Tooltip>
        )}
        {player.muted && (
          <Tooltip content="This player is muted">
            <span className="badge badge-muted">Muted</span>
          </Tooltip>
        )}
      </div>
      <Icon name="chevron-right" size="xs" className="opacity-subtle text-fg-muted" />
    </ListItem>
  )
}
