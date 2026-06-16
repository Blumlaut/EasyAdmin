import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { Notification, Permissions, Player, ReasonShortcut } from '../../types'
import { Icon } from '../../components/icons'
import { CopyButton } from '../../components/CopyButton'
import { PlayerInfoPanel } from './PlayerInfoPanel'
import { PlayerActionsPanel } from './PlayerActionsPanel'

interface PlayerDetailPageProps {
  player: Player
  permissions: Permissions
  ipPrivacy: boolean
  shortcuts: ReasonShortcut[]
  onToast: (text: string, type?: Notification['type']) => void
}

export function PlayerDetailPage({
  player,
  permissions,
  ipPrivacy,
  shortcuts,
  onToast,
}: PlayerDetailPageProps) {
  const [identifiers, setIdentifiers] = useState<string[] | null>(null)
  const [identifiersExpanded, setIdentifiersExpanded] = useState(false)

  // Lazy-load full identifiers from server
  useEffect(() => {
    let cancelled = false
    callLua('getPlayerIdentifiers', { id: player.id })
    const unsub = on<{ id: number; identifiers: string[] }>('playerIdentifiers', (data) => {
      if (cancelled || data.id !== player.id) return
      setIdentifiers(data.identifiers)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [player.id])

  function copyDiscord() {
    if (!player.discord) {
      onToast('No Discord to copy', 'error')
      return
    }
    onToast('Discord copied to clipboard', 'success')
  }

  const handleToggleIdentifiers = useCallback(() => {
    setIdentifiersExpanded((prev) => !prev)
  }, [])

  // Filter out IP identifiers when privacy is enabled
  const visibleIdentifiers = useMemo(() => {
    return (identifiers ?? []).filter((id) => {
      if (ipPrivacy && id.split(':')[0] === 'ip') return false
      return true
    })
  }, [identifiers, ipPrivacy])

  return (
    <div className="page-container">
      <PlayerInfoPanel
        player={player}
        onCopyDiscord={copyDiscord}
      />

      {/* Collapsible identifiers card */}
      {visibleIdentifiers.length > 0 && (
        <div className="card card-identifiers">
          <button
            className="card-identifiers-toggle"
            onClick={handleToggleIdentifiers}
            aria-expanded={identifiersExpanded}
            aria-controls="identifiers-list"
          >
            <Icon
              name={identifiersExpanded ? 'chevron-down' : 'chevron-right'}
              size="sm"
            />
            <span>Identifiers</span>
            <span className="text-sm text-muted identifier-count">{visibleIdentifiers.length}</span>
          </button>

          {identifiersExpanded && (
            <ul className="card-identifiers-list" id="identifiers-list">
              {visibleIdentifiers.map((id) => {
                const [kind, value] = id.split(':')
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 text-mono text-sm identifier-row"
                  >
                    <span className="badge badge-default">{kind}</span>
                    <span className="truncate flex-1">{value ?? id}</span>
                    <CopyButton value={id} ariaLabel={`Copy ${kind}`} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <PlayerActionsPanel
        player={player}
        permissions={permissions}
        shortcuts={shortcuts}
        onToast={onToast}
      />
    </div>
  )
}
