import { useMemo, useRef, useState } from 'react'
import type { CachedPlayer } from '../../types'
import { notify } from '../../lib/notify'
import { useDebounce } from '../../hooks/useDebounce'
import { useListKeyboardNav } from '../../hooks/useListKeyboardNav'
import { filterCachedPlayers } from '../../lib/playerSearch'
import { SearchBar } from '../../components/SearchBar'
import { Icon } from '../../components/icons'
import { ListItem } from '../../components/ListItem'
import { PlayerListSkeleton } from '../../components/PlayerListSkeleton'
import { useModalContext } from '../../ModalContext'
import { callLua } from '../../fivem'
import { createBanModal } from '../../modals/helpers'

interface CachedPlayersPageProps {
  cachedPlayers: CachedPlayer[]
  loading: boolean
  onRefresh: () => void
}

export function CachedPlayersPage({
  cachedPlayers,
  loading,
  onRefresh,
}: CachedPlayersPageProps) {
  const { openModal, closeModal } = useModalContext()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    return filterCachedPlayers(cachedPlayers, debouncedQuery)
  }, [cachedPlayers, debouncedQuery])

  useListKeyboardNav(listRef, filtered.length)

  return (
    <div className="page-container">
      <p className="text-sm text-fg-muted">
        Recently disconnected players. You can ban them offline.
      </p>
      <div className="mb-3 flex items-center gap-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, ID, or identifier..."
          resultCount={{ shown: filtered.length, total: cachedPlayers.length }}
          ariaLabel="Search cached players"
        />
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
            <Icon name="archive" size="lg" className="text-fg-muted" />
          </div>
          <p className="text-fg-subtle">
          {cachedPlayers.length === 0 ? 'No cached players' : 'No cached players match your search'}
        </p>
        </div>
      ) : (
        <div ref={listRef} className="list">
          {filtered.map((player) => (
            <CachedRow
              key={player.id}
              player={player}
              onBan={() => openModal(
                createBanModal({
                  title: `Ban ${player.name}`,
                  onSubmit: async (reason, duration) => {
                    try {
                      await callLua('offlineBanPlayer', { id: player.id, name: player.name, reason, duration })
                      notify(`Banned ${player.name}`, 'success')
                    } catch {
                      notify('Failed to ban player', 'error')
                    }
                    closeModal()
                  },
                }),
              )}
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
        <Icon name="archive" size="xs" className="text-fg-muted" />
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
