import { useCallback, useEffect, useMemo, useState } from 'react'
import { callLua, on } from '../../fivem'
import type { Permissions, Player } from '../../types'
import { Icon } from '../../components/icons'
import { CopyButton } from '../../components/CopyButton'
import type { PlayerDetailTab } from '../../plugins'
import { PlayerInfoPanel } from './PlayerInfoPanel'
import { PlayerActionsPanel } from './PlayerActionsPanel'
import { ActionHistorySection } from './ActionHistorySection'
import { AdminNotesSection } from './AdminNotesSection'

interface PlayerDetailPageProps {
  player: Player
  permissions: Permissions
  ipPrivacy: boolean
  /** Plugin-contributed tabs. */
  pluginTabs?: PlayerDetailTab[]
}

export function PlayerDetailPage({
  player,
  permissions,
  ipPrivacy,
  pluginTabs = [],
}: PlayerDetailPageProps) {
  const [identifiers, setIdentifiers] = useState<string[] | null>(null)
  const [identifiersExpanded, setIdentifiersExpanded] = useState(false)
  const [activePluginTab, setActivePluginTab] = useState<string | null>(null)

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
      <PlayerInfoPanel player={player} permissions={permissions} />

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
            <span className="identifier-count text-sm text-fg-muted">{visibleIdentifiers.length}</span>
          </button>

          {identifiersExpanded && (
            <ul className="card-identifiers-list" id="identifiers-list">
              {visibleIdentifiers.map((id) => {
                const [kind, value] = id.split(':')
                return (
                  <li
                    key={id}
                    className="text-mono identifier-row flex items-center gap-2 text-sm"
                  >
                    <span className="badge badge-default">{kind}</span>
                    <span className="flex-1 truncate">{value ?? id}</span>
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
      />

      {/* Action History — shown when user has view permission */}
      {permissions['player.actionhistory.view'] && (
        <ActionHistorySection
          playerId={player.id}
          permissions={permissions}
        />
      )}

      {/* Admin Notes — shown when user has view permission */}
      {permissions['player.adminnotes.view'] && (
        <AdminNotesSection
          playerId={player.id}
          permissions={permissions}
        />
      )}

      {/* Plugin-contributed tabs */}
      {pluginTabs.length > 0 && (
        <div className="card player-detail-plugin-tabs">
          <div className="player-detail-plugin-tab-headers flex items-center gap-1">
            {pluginTabs.map((tab) => {
              const isActive = activePluginTab === tab.id
              return (
                <button
                  key={tab.id}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActivePluginTab(isActive ? null : tab.id)}
                >
                  {tab.icon && <Icon name={tab.icon as 'book-open'} size="xs" />}
                  {tab.label}
                </button>
              )
            })}
          </div>
          {activePluginTab && (() => {
            const tab = pluginTabs.find((t) => t.id === activePluginTab)
            if (!tab) return null
            const TabComponent = tab.component
            return (
              <div className="player-detail-plugin-tab-content">
                <TabComponent player={player} permissions={permissions} />
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
