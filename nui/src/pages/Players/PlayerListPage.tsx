import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Permissions, Player } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'
import { useGridNavigation } from '../../hooks/useGridNavigation'
import { useInitialFocus } from '../../hooks/useInitialFocus'
import { filterPlayers } from '../../lib/playerSearch'
import { SearchBar } from '../../components/SearchBar'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/icons'
import { Tooltip } from '../../components/Tooltip'
import { RoleBadges } from '../../components/RoleBadges'
import { List } from '../../components/List'
import { ListItem } from '../../components/ListItem'
import { PlayerListSkeleton } from '../../components/PlayerListSkeleton'
import { QuickActionBar, type QuickAction, type DropdownAction } from '../../components/QuickActionBar'
import { AllPlayersActions } from './AllPlayersActions'
import { useModalContext } from '../../ModalContext'
import { createBanModal, createTextInputModal } from '../../modals/helpers'
import { callLua } from '../../fivem'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'

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
  const { t } = useTranslation()
  const { openModal, closeModal } = useModalContext()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  const filtered = useMemo(() => {
    return filterPlayers(players, debouncedQuery)
  }, [players, debouncedQuery])

  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const focusedZoneRef = useRef<{ row: number; zone: number } | null>(null)

  // Auto-focus search bar when entering the page
  useInitialFocus(searchRef)

  // Ctrl/Cmd+F focuses the search input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const canTeleportAll = !!permissions['player.teleport.everyone']
  const canKick = !!permissions['player.kick']
  const canBan = !!permissions['player.ban.temporary']
  const canSpectate = !!permissions['player.spectate']
  const canMute = !!permissions['player.mute']
  const canSlap = !!permissions['player.slap']
  const canFreeze = !!permissions['player.freeze']
  const canScreenshot = !!permissions['player.screenshot']
  const canBucketJoin = !!permissions['player.bucket.join']
  const canBucketForce = !!permissions['player.bucket.force']

  // Compute zone count for a single row (constant for all rows given same permissions)
  const zonesPerRow = useMemo(() => {
    let z = 1 // row body
    if (canKick) z++
    if (canBan) z++
    if (canSpectate) z++
    if (canMute) z++
    // Dropdown: slap + freeze + screenshot + bucketJoin + bucketForce
    const dropdownCount = (canSlap ? 1 : 0) + (canFreeze ? 1 : 0) + (canScreenshot ? 1 : 0) + (canBucketJoin ? 1 : 0) + (canBucketForce ? 1 : 0)
    if (dropdownCount > 0) z++ // dropdown trigger
    return z
  }, [canKick, canBan, canSpectate, canMute, canSlap, canFreeze, canScreenshot, canBucketJoin, canBucketForce])

  useGridNavigation(listRef, () => zonesPerRow)

  const handleRowFocus = useCallback((row: number) => {
    focusedZoneRef.current = { row, zone: 0 }
  }, [])

  const handleZoneFocus = useCallback((row: number, zone: number) => {
    focusedZoneRef.current = { row, zone }
  }, [])

  return (
    <div className="page-container">
      <div className="mb-3 flex items-center gap-2">
        <SearchBar
          ref={searchRef}
          value={query}
          onChange={setQuery}
          placeholder={t("Search by name, ID, or identifier...")}
          resultCount={{ shown: filtered.length, total: players.length }}
          ariaLabel="Search players"
        />
        <button className="btn btn-secondary btn-sm" onClick={onOpenCached}>
          <Icon name="archive" size="xs" />
          {t("Cached players")}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size="xs" />
          {t("Refresh")}
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
            {players.length === 0 ? t("No players connected") : t("No players match your search")}
          </p>
        </div>
      ) : (
        <List ref={listRef}>
          {filtered.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              permissions={permissions}
              onClick={() => onSelectPlayer(player)}
              onOpenModal={openModal}
              onCloseModal={closeModal}
              onRowFocus={() => handleRowFocus(index)}
              onZoneFocus={(zone) => handleZoneFocus(index, zone)}
            />
          ))}
        </List>
      )}

      {(canTeleportAll || !!permissions['server.mute.global']) && players.length > 0 && (
        <AllPlayersActions permissions={permissions} />
      )}
    </div>
  )
}

interface PlayerRowProps {
  player: Player
  permissions: Permissions
  onClick: () => void
  onOpenModal: (definition: import('../../modals/types').ModalDefinition) => void
  onCloseModal: () => void
  onRowFocus: () => void
  onZoneFocus: (zoneIndex: number) => void
}

function PlayerRow({ player, permissions, onClick, onOpenModal, onCloseModal, onRowFocus, onZoneFocus }: PlayerRowProps) {
  const { t } = useTranslation()

  const canSpectate = !!permissions['player.spectate']
  const canFreeze = !!permissions['player.freeze']
  const canMute = !!permissions['player.mute']
  const canKick = !!permissions['player.kick']
  const canBan = !!permissions['player.ban.temporary']
  const canSlap = !!permissions['player.slap']
  const canScreenshot = !!permissions['player.screenshot']
  const canBucketJoin = !!permissions['player.bucket.join']
  const canBucketForce = !!permissions['player.bucket.force']

  // ---- Direct (quick) actions ----
  // Order follows the detail page: discipline first (Kick, Ban),
  // then most-used controls (Spectate, Mute).
  // Less-used actions go in the dropdown.

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = []

    // Discipline (matches detail page — top section)
    if (canKick) {
      actions.push({
        label: t("Kick {name}", { name: player.name }),
        icon: 'log-out',
        variant: 'warning',
        onClick: (e) => {
          e.stopPropagation()
          onOpenModal(
            createTextInputModal({
              title: t("Kick {name}", { name: player.name }),
              label: t('Reason'),
              placeholder: t('No reason'),
              required: true,
              submitLabel: t('Kick'),
              submitVariant: 'warning',
              onSubmit: async (values) => {
                const reason = typeof values.value === 'string' ? values.value.trim() : 'No reason'
                try {
                  await callLua('kickPlayer', { id: player.id, name: player.name, reason })
                  notify(t("Kicked {name}", { name: player.name }), 'success')
                } catch {
                  notify(t('Kick failed'), 'error')
                }
                onCloseModal()
              },
            }),
          )
        },
      })
    }

    if (canBan) {
      actions.push({
        label: t("Ban {name}", { name: player.name }),
        icon: 'ban',
        variant: 'danger',
        onClick: (e) => {
          e.stopPropagation()
          onOpenModal(
            createBanModal({
              title: t("Ban {name}", { name: player.name }),
              onSubmit: async (reason, duration) => {
                try {
                  await callLua('banPlayer', {
                    id: player.id,
                    name: player.name,
                    reason,
                    duration,
                  })
                  notify(t("Banned {name}", { name: player.name }), 'success')
                } catch {
                  notify(t('Failed to ban player'), 'error')
                }
                onCloseModal()
              },
            }),
          )
        },
      })
    }

    // Most-used controls (Spectate is first in Movement on detail page)
    if (canSpectate) {
      actions.push({
        label: t("Spectate {name}", { name: player.name }),
        icon: 'eye',
        onClick: (e) => {
          e.stopPropagation()
          callLua('spectatePlayer', { id: player.id, name: player.name })
          notify(t("Spectating {name}", { name: player.name }), 'success')
        },
      })
    }

    // Mute — quick toggle, commonly used
    if (canMute) {
      actions.push({
        label: player.muted
          ? t("Unmute {name}", { name: player.name })
          : t("Mute {name}", { name: player.name }),
        icon: player.muted ? 'volume-2' : 'volume-x',
        onClick: (e) => {
          e.stopPropagation()
          const newMuted = !player.muted
          callLua('toggleMute', { id: player.id, name: player.name, mute: newMuted })
          notify(
            t(newMuted ? "Muted {name}" : "Unmuted {name}", { name: player.name }),
            'success',
          )
        },
      })
    }

    return actions
  }, [player, canSpectate, canMute, canKick, canBan, t, onOpenModal, onCloseModal])

  // ---- Dropdown (overflow) actions ----

  const dropdownActions = useMemo<DropdownAction[]>(() => {
    const items: DropdownAction[] = []

    if (canSlap) {
      items.push({
        label: t('Slap'),
        icon: 'zap',
        onSelect: () => {
          onOpenModal({
            title: t('Slap {name}', { name: player.name }),
            fields: [
              {
                key: 'amount',
                type: 'slider',
                label: t('Slap player'),
                min: 1,
                max: 20,
                initialValue: 5,
                formatValue: (n: number) => `${n * 10} damage`,
              },
            ],
            onSubmit: async (values) => {
              try {
                const amount = typeof values.amount === 'number' ? values.amount * 10 : 50
                await callLua('slapPlayer', { id: player.id, name: player.name, amount })
                notify(t('Slapped'), 'success')
              } catch {
                notify(t('Slap failed'), 'error')
              }
              onCloseModal()
            },
          })
        },
      })
    }

    if (canFreeze) {
      items.push({
        label: player.frozen ? t('Unfreeze') : t('Freeze'),
        icon: 'snowflake',
        onSelect: async () => {
          const newFrozen = !player.frozen
          try {
            await callLua('toggleFreeze', {
              id: player.id,
              name: player.name,
              freeze: newFrozen,
            })
            notify(
              t(newFrozen ? "Frozen {name}" : "Unfrozen {name}", { name: player.name }),
              'success',
            )
          } catch {
            notify(t('Action failed'), 'error')
          }
        },
      })
    }

    if (canScreenshot) {
      items.push({
        label: t('Screenshot'),
        icon: 'camera',
        onSelect: async () => {
          try {
            await callLua('screenshotPlayer', { id: player.id, name: player.name })
          } catch {
            // Screenshot handled asynchronously
          }
        },
      })
    }

    if (canBucketJoin) {
      items.push({
        label: t('Join bucket'),
        icon: 'arrow-left',
        onSelect: async () => {
          try {
            await callLua('joinPlayerBucket', { id: player.id, name: player.name })
            notify(t('Joined bucket'), 'success')
          } catch {
            notify(t('Action failed'), 'error')
          }
        },
      })
    }

    if (canBucketForce) {
      items.push({
        label: t('Force bucket'),
        icon: 'map-pin',
        onSelect: async () => {
          try {
            await callLua('forcePlayerBucket', { id: player.id, name: player.name })
            notify(t('Forced bucket'), 'success')
          } catch {
            notify(t('Action failed'), 'error')
          }
        },
      })
    }

    return items
  }, [player, canSlap, canFreeze, canScreenshot, canBucketJoin, canBucketForce, t, onOpenModal, onCloseModal])

  return (
    <ListItem onClick={onClick} onFocus={onRowFocus}>
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
          <Tooltip content={t("This player is frozen")}>
            <span className="badge badge-frozen">{t("Frozen")}</span>
          </Tooltip>
        )}
        {player.muted && (
          <Tooltip content={t("This player is muted")}>
            <span className="badge badge-muted">{t("Muted")}</span>
          </Tooltip>
        )}
      </div>

      <QuickActionBar actions={quickActions} dropdownActions={dropdownActions} onZoneFocus={onZoneFocus} />

      <Icon name="chevron-right" size="xs" className="opacity-subtle text-fg-muted" />
    </ListItem>
  )
}
