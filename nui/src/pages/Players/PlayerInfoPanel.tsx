import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { NameHistoryEntry, Permissions, Player } from '../../types'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/icons'
import { KeyValueTable, type KeyValueRow } from '../../components/KeyValueTable'
import { RoleBadges } from '../../components/RoleBadges'
import { useTranslation } from '../../lib/i18n'

interface PlayerInfoPanelProps {
  player: Player
  permissions: Permissions
}

export function PlayerInfoPanel({ player, permissions }: PlayerInfoPanelProps) {
  const { t } = useTranslation()
  const [nameHistory, setNameHistory] = useState<NameHistoryEntry[] | null>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Lazy-load name history from server (only if viewer has permission)
  const canViewNameHistory = permissions['player.namehistory.view']

  useEffect(() => {
    if (!canViewNameHistory) return
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
  }, [player.id, canViewNameHistory])

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
    rows.push({ key: t('License'), value: player.license, mono: true })
  }
  if (player.xbl) {
    rows.push({ key: t('XBL'), value: player.xbl, mono: true })
  }
  if (player.ip) {
    rows.push({ key: t('IP'), value: player.ip, mono: true })
  }
  if (player.coords) {
    rows.push({
      key: t('Coords'),
      value: `${player.coords.x.toFixed(1)}, ${player.coords.y.toFixed(1)}, ${player.coords.z.toFixed(1)}`,
      mono: true,
    })
  }
  if (player.selfbucket !== undefined) {
    rows.push({ key: t('Bucket'), value: player.selfbucket, mono: true })
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-4">
        <Avatar key={player.id} player={player} size="lg" variant="player" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-xl font-bold">{player.name}</h3>
            {canViewHistory && (
              <button
                className="name-history-toggle"
                onClick={handleToggleHistory}
                aria-expanded={historyExpanded}
                aria-label={t("Toggle name history")}
                title={t("Name history")}
              >
                <Icon
                  name={historyExpanded ? 'chevron-down' : 'chevron-right'}
                  size="xs"
                />
              </button>
            )}
            <RoleBadges player={player} />
          </div>
          <p className="text-mono text-sm text-fg-muted">ID: {player.id}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {player.frozen && <span className="badge badge-frozen">{t("Frozen")}</span>}
          {player.muted && <span className="badge badge-muted">{t("Muted")}</span>}
        </div>
      </div>

      {/* Name history dropdown — full-width below header row so avatar doesn't shift */}
      {canViewHistory && historyExpanded && (
        <div className="name-history-dropdown mb-3">
          <p className="name-history-label">{t("This user has also played as:")}</p>
          {allNames.length > 0 ? (
            <ul className="name-history-names">
              {allNames.map((entry, idx) => {
                const isCurrent = entry.lastSeen === null
                return (
                  <li key={idx} className="name-history-name">
                    {entry.name}
                    {isCurrent && (
                      <span className="badge badge-current">{t("Current")}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">{t("No name history available")}</p>
          )}
        </div>
      )}

      <KeyValueTable rows={rows} ariaLabel="Player info" />
    </div>
  )
}
