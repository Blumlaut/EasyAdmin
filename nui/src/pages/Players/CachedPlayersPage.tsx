import { useRef, useState } from 'react'
import type { CachedPlayer, Notification } from '../../types'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { SearchBar } from '../../components/SearchBar'
import { Icon } from '../../components/icons'
import { ListItem } from '../../components/ListItem'
import { PlayerListSkeleton } from '../../components/PlayerListSkeleton'
import { useModalContext } from '../../ModalContext'

interface CachedPlayersPageProps {
  cachedPlayers: CachedPlayer[]
  loading: boolean
  onToast: (_text: string, _type?: Notification['type']) => void
  onRefresh: () => void
}

export function CachedPlayersPage({
  cachedPlayers,
  loading,
  onToast: _onToast,
  onRefresh,
}: CachedPlayersPageProps) {
  const modal = useModalContext()
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useListKeyboardNav(listRef, cachedPlayers.length)

  return (
    <div className="page-container">
      <p className="text-sm text-muted">
        Recently disconnected players. You can ban them offline.
      </p>
      <div className="flex items-center gap-2 mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, ID, or identifier..."
          resultCount={{ shown: cachedPlayers.length, total: cachedPlayers.length }}
          ariaLabel="Search cached players"
        />
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size="xs" />
          Refresh
        </button>
      </div>

      {loading ? (
        <PlayerListSkeleton />
      ) : cachedPlayers.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Icon name="archive" size="lg" className="text-muted" />
          </div>
          <p className="text-secondary">No cached players</p>
        </div>
      ) : (
        <div ref={listRef} className="list">
          {cachedPlayers.map((player) => (
            <CachedRow
              key={player.id}
              player={player}
              onBan={() => modal.openOfflineBan(player.id, player.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CachedRow({
  player,
  onBan,
}: {
  player: CachedPlayer
  onBan: () => void
}) {
  return (
    <ListItem onClick={() => {}}>
      <div className="avatar avatar-sm avatar-offline">
        <Icon name="archive" size="xs" className="text-muted" />
      </div>
      <div className="list-item-content">
        <div className="list-item-title">{player.name}</div>
        <div className="list-item-subtitle text-mono">ID: {player.id}</div>
      </div>
      <div className="list-item-meta">
        <button
          className="btn btn-danger btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            onBan()
          }}
        >
          <Icon name="ban" size="xs" />
          Ban
        </button>
      </div>
    </ListItem>
  )
}
