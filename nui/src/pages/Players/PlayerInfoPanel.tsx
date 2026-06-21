import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { NameHistoryEntry, Permissions, Player } from '../../types'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/icons'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { RoleBadges } from '../../components/RoleBadges'

interface PlayerInfoPanelProps {
  player: Player
  permissions: Permissions
}

export function PlayerInfoPanel({ player, permissions }: PlayerInfoPanelProps) {
  const [nameHistory, setNameHistory] = useState<NameHistoryEntry[] | null>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Lazy-load name history from server (only if viewer has permission)
  useEffect(() => {
    if (!permissions['player.namehistory.view']) return
    let cancelled = false
    callLua('getPlayerNameHistory', { id: player.id })
    const unsub = on<{
      id: number
      nameHistory: NameHistoryEntry[]
      aliases: unknown[]
      currentName: string
    }>('playerNameHistory', (data) => {
      if (cancelled || data.id !== player.id) return
      setNameHistory(data.nameHistory)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [player.id, permissions['player.namehistory.view']])

  const handleToggleHistory = useCallback(() => {
    setHistoryExpanded((prev) => !prev)
  }, [])

  // All names sorted by firstSeen ascending (oldest first)
  const allNames = useMemo(() => {
    if (!nameHistory || nameHistory.length === 0) return []
    return [...nameHistory].sort((a, b) => a.firstSeen - b.firstSeen)
  }, [nameHistory])

  const canViewHistory = permissions['player.namehistory.view']

  const rows: KeyValueRow[] = []

  if (player.license) {
    rows.push({ key: 'License', value: player.license, mono: true })
  }
  if (player.xbl) {
    rows.push({ key: 'XBL', value: player.xbl, mono: true })
  }
  if (player.ip) {
    rows.push({ key: 'IP', value: player.ip, mono: true })
  }
  if (player.coords) {
    rows.push({
      key: 'Coords',
      value: `${player.coords.x.toFixed(1)}, ${player.coords.y.toFixed(1)}, ${player.coords.z.toFixed(1)}`,
      mono: true,
    })
  }
  if (player.selfbucket !== undefined) {
    rows.push({ key: 'Bucket', value: player.selfbucket, mono: true })
  }

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-3">
        <Avatar key={player.id} player={player} size="lg" variant="player" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold truncate">{player.name}</h3>
            {canViewHistory && (
              <button
                className="name-history-toggle"
                onClick={handleToggleHistory}
                aria-expanded={historyExpanded}
                aria-label="Toggle name history"
                title="Name history"
              >
                <Icon
                  name={historyExpanded ? 'chevron-down' : 'chevron-right'}
                  size="xs"
                />
              </button>
            )}
            <RoleBadges player={player} />
          </div>
          <p className="text-sm text-muted text-mono">ID: {player.id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {player.frozen && <span className="badge badge-frozen">Frozen</span>}
          {player.muted && <span className="badge badge-muted">Muted</span>}
        </div>
      </div>

      {/* Name history dropdown — full-width below header row so avatar doesn't shift */}
      {canViewHistory && historyExpanded && (
        <div className="name-history-dropdown mb-3">
          <p className="name-history-label">This user has also played as:</p>
          {allNames.length > 0 ? (
            <ul className="name-history-names">
              {allNames.map((entry, idx) => {
                const isCurrent = entry.lastSeen === null
                return (
                  <li key={idx} className="name-history-name">
                    {entry.name}
                    {isCurrent && (
                      <span className="badge badge-current">Current</span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">No name history available</p>
          )}
        </div>
      )}

      <KeyValueTable rows={rows} ariaLabel="Player info" />
    </div>
  )
}
