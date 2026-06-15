import { useEffect, useMemo, useState } from 'react'
import { callLua } from '../../fivem'
import type { CachedPlayer, Notification } from '../../types'
import { SearchBar } from '../../components/SearchBar'
import { Skeleton } from '../../components/Skeleton'
import { InputPrompt } from '../../components/InputPrompt'
import { BanDurationPicker } from '../../components/BanDurationPicker'
import { useDebounce } from '../../hooks/useDebounce'
import { Icon } from '../../components/icons'

interface CachedPlayersPageProps {
  onToast: (text: string, type?: Notification['type']) => void
  refreshKey: number
}

export function CachedPlayersPage({ onToast, refreshKey }: CachedPlayersPageProps) {
  const [state, setState] = useState<{
    status: 'loading' | 'error' | 'success'
    cached: CachedPlayer[]
  }>({ status: 'loading', cached: [] })
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [banTarget, setBanTarget] = useState<CachedPlayer | null>(null)

  useEffect(() => {
    let cancelled = false
    callLua<{ players?: CachedPlayer[] }>('requestCachedPlayers')
      .then((res) => {
        if (cancelled) return
        setState({ status: 'success', cached: res.players ?? [] })
      })
      .catch(() => {
        if (cancelled) return
        onToast('Failed to load cached players', 'error')
        setState({ status: 'error', cached: [] })
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey, onToast])

  const cached = state.cached
  const loading = state.status === 'loading'

  const filtered = useMemo(() => {
    if (!debouncedQuery) return cached
    const q = debouncedQuery.toLowerCase()
    return cached.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        (p.identifier ?? '').toLowerCase().includes(q),
    )
  }, [cached, debouncedQuery])

  return (
    <div className="page-container">
      <p className="text-sm text-muted">
        Recently disconnected players. You can ban them offline.
      </p>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name, ID, or identifier..."
        resultCount={{ shown: filtered.length, total: cached.length }}
        ariaLabel="Search cached players"
      />

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
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="archive" size="lg" className="text-muted" />
          <p>
            {cached.length === 0
              ? 'No cached players'
              : 'No cached players match your search'}
          </p>
        </div>
      ) : (
        <div className="list">
          {filtered.map((player) => (
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
          onToast={onToast}
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
        <button className="btn btn-danger btn-sm" onClick={onBan}>
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
  onToast,
}: {
  player: CachedPlayer
  onClose: () => void
  onToast: (text: string, type?: Notification['type']) => void
}) {
  const [reason, setReason] = useState<null | string>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

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

  if (duration === null) {
    return (
      <div
        className="dialog-overlay"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
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
              disabled={duration === null || duration === -1}
              onClick={async () => {
                if (duration === null || duration === -1) return
                setBusy(true)
                try {
                  await callLua('offlineBanPlayer', {
                    id: player.id,
                    name: player.name,
                    reason,
                    duration,
                  })
                  onToast(`Banned ${player.name}`, 'success')
                  onClose()
                } catch {
                  onToast('Ban failed', 'error')
                  onClose()
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Banning...' : 'Confirm ban'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
