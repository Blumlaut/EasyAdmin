import { useMemo, useState } from 'react'
import type { IconName } from '../../components/icons'
import type { Notification, Permissions, Player } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { SelectMenu } from '../../components/SelectMenu'
import { callLua } from '../../fivem'
import { createBanModal, createTextInputModal } from '../../modals/helpers'

interface PlayerActionsPanelProps {
  player: Player
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

// ---- Quick action types ----

type QuickActionId =
  | 'slap'
  | 'spectate'
  | 'screenshot'
  | 'bucket-join'
  | 'bucket-force'
  | 'freeze'
  | 'mute'

interface QuickActionDef {
  id: QuickActionId
  label: string
  icon: IconName
  permission: string
}

// Teleport options
type TeleportAction = 'toMe' | 'meToPlayer' | 'meBack' | 'playerBack' | 'intoVehicle'

interface TeleportOption {
  id: TeleportAction
  label: string
  icon: IconName
  action: string
}

const TELEPORT_OPTIONS: TeleportOption[] = [
  { id: 'toMe', label: 'Teleport to me', icon: 'map-pin', action: 'teleportPlayerToMe' },
  { id: 'meToPlayer', label: 'Me to player', icon: 'log-out', action: 'teleportToPlayer' },
  { id: 'meBack', label: 'Me back', icon: 'chevron-left', action: 'teleportMeBack' },
  { id: 'playerBack', label: 'Player back', icon: 'home', action: 'teleportPlayerBack' },
  { id: 'intoVehicle', label: 'Into closest vehicle', icon: 'globe', action: 'teleportIntoVehicle' },
]

// ---- Action groups ----

interface ActionGroup {
  label: string
  icon: IconName
  actions: QuickActionDef[]
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    label: 'Movement',
    icon: 'compass',
    actions: [
      { id: 'spectate', label: 'Spectate', icon: 'eye', permission: 'player.spectate' },
      { id: 'bucket-join', label: 'Join bucket', icon: 'arrow-left', permission: 'player.bucket.join' },
      { id: 'bucket-force', label: 'Force bucket', icon: 'map-pin', permission: 'player.bucket.force' },
    ],
  },
  {
    label: 'Control',
    icon: 'sliders',
    actions: [
      { id: 'slap', label: 'Slap', icon: 'zap', permission: 'player.slap' },
      { id: 'freeze', label: 'Freeze', icon: 'snowflake', permission: 'player.freeze' },
      { id: 'mute', label: 'Mute', icon: 'volume-x', permission: 'player.mute' },
      { id: 'screenshot', label: 'Screenshot', icon: 'camera', permission: 'player.screenshot' },
    ],
  },
]

export function PlayerActionsPanel({ player, permissions, onToast }: PlayerActionsPanelProps) {
  const { openModal, closeModal } = useModalContext()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [teleportBusy, setTeleportBusy] = useState<TeleportAction | null>(null)
  const canKick = permissions['player.kick']
  const canWarn = permissions['player.warn']
  const canBan = permissions['player.ban.temporary']
  const canTeleport = permissions['player.teleport.single']

  // Build filtered groups based on permissions
  const filteredGroups = useMemo(() => {
    return ACTION_GROUPS.map((group) => ({
      ...group,
      actions: group.actions.filter((a) => permissions[a.permission]),
    })).filter((group) => group.actions.length > 0)
  }, [permissions])

  const hasAnyQuickAction = filteredGroups.length > 0 || canTeleport
  const hasAnyDiscipline = canWarn || canKick || canBan
  const hasAnyPermission = hasAnyQuickAction || hasAnyDiscipline

  // ---- Quick action handler ----

  async function handleQuickAction(actionId: QuickActionId) {
    setBusyAction(actionId)
    try {
      switch (actionId) {
        case 'slap':
          openModal({
            title: 'Slap player',
            fields: [
              {
                key: 'amount',
                type: 'slider',
                label: 'Slap player',
                min: 1,
                max: 20,
                initialValue: 5,
                formatValue: (n) => `${n * 10} damage`,
              },
            ],
            onSubmit: async (values) => {
              try {
                const amount = typeof values.amount === 'number' ? values.amount * 10 : 50
                await callLua('slapPlayer', { id: player.id, name: player.name, amount })
                onToast('Slapped', 'success')
              } catch {
                onToast('Slap failed', 'error')
              }
              closeModal()
            },
          })
          break
        case 'spectate':
          await callLua('spectatePlayer', { id: player.id, name: player.name })
          onToast(`Spectating ${player.name}`, 'success')
          break
        case 'screenshot':
          await callLua('screenshotPlayer', { id: player.id, name: player.name })
          // Screenshot opens in a floating viewer window — no toast needed
          break
        case 'bucket-join':
          await callLua('joinPlayerBucket', { id: player.id, name: player.name })
          onToast('Joined bucket', 'success')
          break
        case 'bucket-force':
          await callLua('forcePlayerBucket', { id: player.id, name: player.name })
          onToast('Forced bucket', 'success')
          break
        case 'freeze': {
          const newFrozen = !player.frozen
          await callLua('toggleFreeze', { id: player.id, name: player.name, freeze: newFrozen })
          onToast(`${newFrozen ? 'Frozen' : 'Unfrozen'} ${player.name}`, 'success')
          break
        }
        case 'mute': {
          const newMuted = !player.muted
          await callLua('toggleMute', { id: player.id, name: player.name, mute: newMuted })
          onToast(`${newMuted ? 'Muted' : 'Unmuted'} ${player.name}`, 'success')
          break
        }
      }
    } catch {
      onToast('Action failed', 'error')
    } finally {
      setBusyAction(null)
    }
  }

  // ---- Discipline handlers (modal-based) ----

  function handleWarn() {
    openModal(
      createTextInputModal({
        title: `Warn ${player.name}`,
        label: 'Reason',
        placeholder: 'No reason',
        required: true,
        submitLabel: 'Warn',
        submitVariant: 'warning',
        onSubmit: async (values) => {
          const reason = typeof values.value === 'string' ? values.value.trim() : 'No reason'
          try {
            await callLua('warnPlayer', { id: player.id, name: player.name, reason })
            onToast(`Warned ${player.name}`, 'success')
          } catch {
            onToast('Warn failed', 'error')
          }
          closeModal()
        },
      }),
    )
  }

  function handleKick() {
    openModal(
      createTextInputModal({
        title: `Kick ${player.name}`,
        label: 'Reason',
        placeholder: 'No reason',
        required: true,
        submitLabel: 'Kick',
        submitVariant: 'warning',
        onSubmit: async (values) => {
          const reason = typeof values.value === 'string' ? values.value.trim() : 'No reason'
          try {
            await callLua('kickPlayer', { id: player.id, name: player.name, reason })
            onToast(`Kicked ${player.name}`, 'success')
          } catch {
            onToast('Kick failed', 'error')
          }
          closeModal()
        },
      }),
    )
  }

  function handleBan() {
    openModal(
      createBanModal({
        title: `Ban ${player.name}`,
        onSubmit: async (reason, duration) => {
          try {
            await callLua('banPlayer', { id: player.id, name: player.name, reason, duration })
            onToast(`Banned ${player.name}`, 'success')
          } catch {
            onToast('Failed to ban player', 'error')
          }
          closeModal()
        },
      }),
    )
  }

  // ---- Teleport handler ----

  async function handleTeleport(opt: TeleportOption) {
    setTeleportBusy(opt.id)
    try {
      await callLua(opt.action, { id: player.id, name: player.name })
      onToast(`${opt.label} executed`, 'success')
    } catch {
      onToast(`Failed: ${opt.label}`, 'error')
    } finally {
      setTeleportBusy(null)
    }
  }

  // ---- Teleport select ----

  const teleportSelectItems = TELEPORT_OPTIONS.map((opt) => ({
    value: opt.id,
    label: opt.label,
    icon: opt.icon,
  }))

  function handleTeleportSelect(item: { value: string; label: string }) {
    const opt = TELEPORT_OPTIONS.find((o) => o.id === item.value as TeleportAction)
    if (opt) handleTeleport(opt)
  }

  // ---- Render ----

  return (
    <div className="card">
      <p className="section-label">Actions</p>

      {!hasAnyPermission && (
        <p className="text-muted text-sm">No permissions for this player</p>
      )}

      {/* Discipline buttons (warn / kick / ban) */}
      {hasAnyDiscipline && (
        <div className="player-discipline-buttons">
          {canWarn && (
            <button
              className="btn btn-warning btn-sm"
              onClick={handleWarn}
            >
              <Icon name="alert-triangle" size="xs" />
              Warn
            </button>
          )}
          {canKick && (
            <button
              className="btn btn-warning btn-sm"
              style={{ background: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}
              onClick={handleKick}
            >
              <Icon name="log-out" size="xs" />
              Kick
            </button>
          )}
          {canBan && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBan}
            >
              <Icon name="ban" size="xs" />
              Ban
            </button>
          )}
        </div>
      )}

      {/* Divider between discipline and quick actions */}
      {hasAnyDiscipline && hasAnyQuickAction && (
        <div className="section-divider" />
      )}

      {/* Grouped quick actions */}
      {hasAnyQuickAction && (
        <div className="player-actions-groups">
          {/* Action groups */}
          {filteredGroups.map((group) => (
            <div key={group.label} className="player-action-group">
              <p className="player-action-group-label">
                <Icon name={group.icon} size="xs" />
                {group.label}
              </p>
              <div className="player-action-group-grid">
                {group.actions.map((action) => {
                  const isToggle = action.id === 'freeze' || action.id === 'mute'
                  const isActive = action.id === 'freeze' ? player.frozen : player.muted

                  return (
                    <button
                      key={action.id}
                      className={`panel-btn player-action-group-btn${isToggle && isActive ? ' player-action-group-btn-active' : ''}`}
                      onClick={() => handleQuickAction(action.id)}
                      disabled={busyAction === action.id}
                      title={isToggle
                        ? `${isActive ? 'Un' : ''}${action.label} ${player.name}`
                        : `${action.label} ${player.name}`
                      }
                    >
                      <Icon name={action.icon} size="sm" />
                      <span className="player-action-group-btn-label">
                        {isToggle && isActive ? `Un${action.label}` : action.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Teleport — always shown as standalone if permitted */}
          {canTeleport && (
            <div className="player-action-group">
              <p className="player-action-group-label">
                <Icon name="compass" size="xs" />
                Teleport
              </p>
              <div className="player-action-group-grid">
                <SelectMenu
                  items={teleportSelectItems}
                  placeholder="Select action..."
                  onChange={handleTeleportSelect}
                  disabled={teleportBusy !== null}
                  ariaLabel="Teleport option"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
