import { useCallback, useMemo, useState } from 'react'
import type { IconName } from '../../components/icons'
import type { Notification, Permissions, Player, ReasonShortcut } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { DropdownMenu } from '../../components/DropdownMenu'
import { callLua } from '../../fivem'

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

// Quick actions: no modal needed (toggle or confirm-only)
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
  colorClass?: string
}

const QUICK_ACTIONS: QuickActionDef[] = [
  { id: 'slap', label: 'Slap', icon: 'zap', permission: 'player.slap', colorClass: 'text-accent-orange' },
  { id: 'spectate', label: 'Spectate', icon: 'eye', permission: 'player.spectate' },
  { id: 'screenshot', label: 'Screenshot', icon: 'camera', permission: 'player.screenshot' },
  { id: 'bucket-join', label: 'Join bucket', icon: 'arrow-left', permission: 'player.bucket.join' },
  { id: 'bucket-force', label: 'Force bucket', icon: 'map-pin', permission: 'player.bucket.force', colorClass: 'text-accent-orange' },
  { id: 'freeze', label: 'Freeze', icon: 'snowflake', permission: 'player.freeze', colorClass: 'text-accent-blue' },
  { id: 'mute', label: 'Mute', icon: 'volume-x', permission: 'player.mute', colorClass: 'text-accent-orange' },
]

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

export function PlayerActionsPanel({ player, permissions, shortcuts, onToast }: PlayerActionsPanelProps) {
  const modal = useModalContext()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [teleportBusy, setTeleportBusy] = useState<TeleportAction | null>(null)
  const [disciplineTab, setDisciplineTab] = useState<DisciplineTab>('kick')
  const [reason, setReason] = useState('')

  // Use server shortcuts if available, otherwise fall back to defaults
  const presetReasons = useMemo(() => {
    if (shortcuts.length > 0) {
      return shortcuts.map((s) => s.value)
    }
    return DEFAULT_PRESETS
  }, [shortcuts])

  const availableQuickActions = QUICK_ACTIONS.filter((a) => permissions[a.permission])
  const canKick = permissions['player.kick']
  const canWarn = permissions['player.warn']
  const canBan = permissions['player.ban.temporary']
  const canTeleport = permissions['player.teleport.single']

  // ---- Quick action handler ----

  async function handleQuickAction(actionId: QuickActionId) {
    setBusyAction(actionId)
    try {
      switch (actionId) {
        case 'slap':
          modal.openSlap(player)
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
          // Open ban duration picker from modal context
          modal.openBan(player)
          // Don't clear busy — ban flow is handled by modal
          setBusyAction(null)
          return
        }
      }
    } catch {
      onToast(`Failed to ${type} player`, 'error')
    } finally {
      setBusyAction(null)
    }
  }, [player, reason, modal, onToast])

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

  // ---- Build teleport dropdown trigger ----

  const teleportTrigger = (
    <button className="btn btn-secondary btn-sm" disabled={teleportBusy !== null}>
      <Icon name="map-pin" size="xs" />
      Teleport
    </button>
  )

  const teleportItems = TELEPORT_OPTIONS.map((opt) => ({
    label: opt.label,
    icon: opt.icon,
    onSelect: () => handleTeleport(opt),
  }))

  // ---- Render ----

  const hasAnyPermission = availableQuickActions.length > 0 || canKick || canWarn || canBan || canTeleport

  return (
    <div className="card">
      <p className="section-label">Actions</p>

      {!hasAnyPermission && (
        <p className="text-muted text-sm">No permissions for this player</p>
      )}

      {/* Quick actions row */}
      {(availableQuickActions.length > 0 || canTeleport) && (
        <div className="player-actions-quick-row">
          {availableQuickActions.map((action) => {
            const isToggle = action.id === 'freeze' || action.id === 'mute'
            const isActive = action.id === 'freeze' ? player.frozen : player.muted
            const actionColor = action.colorClass ?? ''

            return (
              <button
                key={action.id}
                className={`player-actions-quick-btn${isToggle && isActive ? ' player-actions-quick-btn-active' : ''}`}
                onClick={() => handleQuickAction(action.id)}
                disabled={busyAction === action.id}
                title={isToggle
                  ? `${isActive ? 'Un' : ''}${action.label} ${player.name}`
                  : `${action.label} ${player.name}`
                }
              >
                <Icon name={action.icon} size="sm" className={actionColor} />
                <span className="player-actions-quick-label">
                  {isToggle && isActive ? `Un${action.label}` : action.label}
                </span>
              </button>
            )
          })}

          {/* Teleport dropdown */}
          {canTeleport && (
            <DropdownMenu trigger={teleportTrigger} items={teleportItems} />
          )}
        </div>
      )}

      {/* Discipline panel (kick / warn / ban) */}
      {(canKick || canWarn || canBan) && (
        <div className="player-discipline-panel">
          {/* Tab bar */}
          <div className="player-discipline-tabs">
            {canKick && (
              <button
                className={`player-discipline-tab${disciplineTab === 'kick' ? ' player-discipline-tab-active' : ''}`}
                onClick={() => setDisciplineTab('kick')}
              >
                <Icon name="log-out" size="xs" />
                Kick
              </button>
            )}
            {canWarn && (
              <button
                className={`player-discipline-tab${disciplineTab === 'warn' ? ' player-discipline-tab-active' : ''}`}
                onClick={() => setDisciplineTab('warn')}
              >
                <Icon name="alert-triangle" size="xs" />
                Warn
              </button>
            )}
            {canBan && (
              <button
                className={`player-discipline-tab${disciplineTab === 'ban' ? ' player-discipline-tab-active' : ''}`}
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
              className={`player-discipline-execute${disciplineTab === 'kick' || disciplineTab === 'ban' ? ' player-discipline-execute-danger' : ''}`}
              onClick={() => handleDiscipline(disciplineTab)}
              disabled={busyAction === disciplineTab}
            >
              <Icon name={disciplineTab === 'kick' ? 'log-out' : disciplineTab === 'warn' ? 'alert-triangle' : 'ban'} size="xs" />
              {disciplineTab === 'kick' ? 'Kick' : disciplineTab === 'warn' ? 'Warn' : 'Ban'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
