import { useState } from 'react'
import type { CachedPlayer, Notification } from '../../types'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { InputPrompt } from '../../components/InputPrompt'
import { BanDurationPicker } from '../../components/BanDurationPicker'
import { Icon } from '../../components/icons'

interface CachedPlayersPageProps {
  cachedPlayers: CachedPlayer[]
  loading: boolean
  onBanPlayer: (id: number, name: string, reason: string, duration: number) => void
  onToast: (_text: string, _type?: Notification['type']) => void
  onRefresh: () => void
}

export function CachedPlayersPage({
  cachedPlayers,
  loading,
  onBanPlayer,
  onToast: _onToast,
  onRefresh,
}: CachedPlayersPageProps) {
  const [query, setQuery] = useState('')
  const [banTarget, setBanTarget] = useState<CachedPlayer | null>(null)

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
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading}>
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
          <Icon name="archive" size="lg" className="text-muted" />
          <p>No cached players</p>
        </div>
      ) : (
        <div className="list">
          {cachedPlayers.map((player) => (
            <CachedRow
              key={player.id}
              player={player}
              onBan={() => setBanTarget(player)}
            />
          ))}
        </div>
      )}

      {banTarget && (
        <CachedBanFlow
          player={banTarget}
          onClose={() => setBanTarget(null)}
          onBanPlayer={onBanPlayer}
        />
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
      <div className="avatar avatar-sm">
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

function CachedBanFlow({
  player,
  onClose,
  onBanPlayer,
}: {
  player: CachedPlayer
  onClose: () => void
  onBanPlayer: (id: number, name: string, reason: string, duration: number) => void
}) {
  const [reason, setReason] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${player.name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={onClose}
        onConfirm={(v) => setReason(v || 'No reason')}
      />
    )
  }

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="cached-ban-title">
        <h2 id="cached-ban-title" className="dialog-title">Ban duration</h2>
        <p className="dialog-description">Choose how long the ban should last.</p>
        <BanDurationPicker value={duration} onChange={setDuration} />
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={() => setReason(null)}>Back</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={duration === null || duration === -1 || reason === null}
            onClick={() => {
              if (duration === null || duration === -1 || reason === null) return
              onBanPlayer(player.id, player.name, reason, duration)
              onClose()
            }}
          >
            Confirm ban
          </button>
        </div>
      </div>
    </div>
  )
}
