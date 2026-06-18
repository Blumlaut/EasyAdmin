import { useCallback, useMemo, useState } from 'react'
import type { IconName } from '../../components/icons'
import type { Notification, Permissions, Player, ReasonShortcut } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { SelectMenu } from '../../components/SelectMenu'
import { callLua } from '../../fivem'
import { BanFlowModal } from '../../modals/BanFlowModal'

interface PlayerActionsPanelProps {
  player: Player
  permissions: Permissions
  shortcuts: ReasonShortcut[]
  onToast: (text: string, type?: Notification['type']) => void
}

type DisciplineTab = 'kick' | 'warn' | 'ban'

// Default fallback when no server shortcuts are configured
const DEFAULT_PRESETS = [
  'No reason',
  'Spam / flooding chat',
  'Inappropriate name',
  'Disrupting gameplay',
  'Exploiting / cheating',
]

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

export function PlayerActionsPanel({ player, permissions, shortcuts, onToast }: PlayerActionsPanelProps) {
  const { openModal, closeModal } = useModalContext()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [teleportBusy, setTeleportBusy] = useState<TeleportAction | null>(null)
  const canKick = permissions['player.kick']
  const canWarn = permissions['player.warn']
  const canBan = permissions['player.ban.temporary']
  const canTeleport = permissions['player.teleport.single']

  // Default to first available discipline tab in escalation order
  const defaultDisciplineTab = useMemo((): DisciplineTab => {
    if (canWarn) return 'warn'
    if (canKick) return 'kick'
    return 'ban'
  }, [canWarn, canKick])

  const [disciplineTab, setDisciplineTab] = useState<DisciplineTab>(defaultDisciplineTab)
  const [reason, setReason] = useState('')

  // Use server shortcuts if available, otherwise fall back to defaults
  const presetReasons = useMemo(() => {
    if (shortcuts.length > 0) {
      return shortcuts.map((s) => s.value)
    }
    return DEFAULT_PRESETS
  }, [shortcuts])

  // Build filtered groups based on permissions
  const filteredGroups = useMemo(() => {
    return ACTION_GROUPS.map((group) => ({
      ...group,
      actions: group.actions.filter((a) => permissions[a.permission]),
    })).filter((group) => group.actions.length > 0)
  }, [permissions])

  const hasAnyQuickAction = filteredGroups.length > 0 || canTeleport

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
          onToast('Screenshot taken', 'success')
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
          const newState = !player.frozen
          await callLua('toggleFreeze', { id: player.id, name: player.name, freeze: newState })
          onToast(`${newState ? 'Frozen' : 'Unfrozen'} ${player.name}`, 'success')
          break
        }
        case 'mute': {
          const newState = !player.muted
          await callLua('toggleMute', { id: player.id, name: player.name, mute: newState })
          onToast(`${newState ? 'Muted' : 'Unmuted'} ${player.name}`, 'success')
          break
        }
      }
    } catch {
      onToast('Action failed', 'error')
    } finally {
      setBusyAction(null)
    }
  }

  // ---- Discipline (kick/warn/ban) handlers ----

  const handleDiscipline = useCallback(async (type: DisciplineTab) => {
    const r = reason.trim() || 'No reason'
    setBusyAction(type)
    try {
      switch (type) {
        case 'kick': {
          await callLua('kickPlayer', { id: player.id, name: player.name, reason: r })
          onToast(`Kicked ${player.name}`, 'success')
          break
        }
        case 'warn': {
          await callLua('warnPlayer', { id: player.id, name: player.name, reason: r })
          onToast(`Warned ${player.name}`, 'success')
          break
        }
        case 'ban': {
          openModal({
            kind: 'custom',
            render: () => (
              <BanFlowModal
                player={player}
                onCancel={closeModal}
                onComplete={closeModal}
                onToast={onToast}
              />
            ),
          })
          setBusyAction(null)
          return
        }
      }
    } catch {
      onToast(`Failed to ${type} player`, 'error')
    } finally {
      setBusyAction(null)
    }
  }, [player, reason, openModal, closeModal, onToast])

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

  const hasAnyPermission = hasAnyQuickAction || canKick || canWarn || canBan

  return (
    <div className="card">
      <p className="section-label">Actions</p>

      {!hasAnyPermission && (
        <p className="text-muted text-sm">No permissions for this player</p>
      )}

      {/* Discipline panel (kick / warn / ban) — highest priority */}
      {(canKick || canWarn || canBan) && (
        <div className="player-discipline-panel">
          {/* Tab bar — escalation order: Warn → Kick → Ban */}
          <div className="player-discipline-tabs">
            {canWarn && (
              <button
                className={`player-discipline-tab player-discipline-tab--warn${disciplineTab === 'warn' ? ' player-discipline-tab-active' : ''}`}
                onClick={() => setDisciplineTab('warn')}
              >
                <Icon name="alert-triangle" size="xs" />
                Warn
              </button>
            )}
            {canKick && (
              <button
                className={`player-discipline-tab player-discipline-tab--kick${disciplineTab === 'kick' ? ' player-discipline-tab-active' : ''}`}
                onClick={() => setDisciplineTab('kick')}
              >
                <Icon name="log-out" size="xs" />
                Kick
              </button>
            )}
            {canBan && (
              <button
                className={`player-discipline-tab player-discipline-tab--ban${disciplineTab === 'ban' ? ' player-discipline-tab-active' : ''}`}
                onClick={() => setDisciplineTab('ban')}
              >
                <Icon name="ban" size="xs" />
                Ban
              </button>
            )}
          </div>

          {/* Preset reasons */}
          <div className="player-discipline-presets">
            {presetReasons.map((preset) => (
              <button
                key={preset}
                className={`player-discipline-preset${reason === preset ? ' player-discipline-preset-active' : ''}`}
                onClick={() => setReason(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Reason input + execute button */}
          <div className="player-discipline-input-row">
            <input
              className="input player-discipline-input"
              placeholder="Or type a custom reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleDiscipline(disciplineTab)
                }
              }}
              aria-label={`${disciplineTab} reason`}
            />
            <button
              className={`player-discipline-execute player-discipline-execute--${disciplineTab}`}
              onClick={() => handleDiscipline(disciplineTab)}
              disabled={busyAction === disciplineTab}
            >
              <Icon name={disciplineTab === 'kick' ? 'log-out' : disciplineTab === 'warn' ? 'alert-triangle' : 'ban'} size="xs" />
              {disciplineTab === 'kick' ? 'Kick' : disciplineTab === 'warn' ? 'Warn' : 'Ban'}
            </button>
          </div>
        </div>
      )}

      {/* Divider between discipline and quick actions */}
      {(canKick || canWarn || canBan) && hasAnyQuickAction && (
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
