import { useState } from 'react'
import type { CachedPlayer, Notification } from '../../types'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'
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
        <div className="list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="list-item">
              <Skeleton width={32} height={32} circle />
              <div className="list-item-content flex flex-col gap-1">
                <Skeleton width="40%" height={14} />
                <Skeleton width="60%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : cachedPlayers.length === 0 ? (
        <div className="card empty-state">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-2)',
          }}>
            <Icon name="archive" size="lg" className="text-muted" />
          </div>
          <p className="text-secondary">No cached players</p>
        </div>
      ) : (
        <div className="list">
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
    <div className="list-item">
      <div className="avatar avatar-sm" style={{
        background: 'var(--bg-hover)',
      }}>
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
    </div>
  )
}
