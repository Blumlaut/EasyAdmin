import { useEffect, useMemo, useState } from 'react'
import type { IconName } from '../../components/icons'
import type { Permissions, Player } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { SelectMenu } from '../../components/SelectMenu'
import { callLua, on } from '../../fivem'
import { createBanModal, createTextInputModal } from '../../modals/helpers'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'

interface PlayerActionsPanelProps {
  player: Player
  permissions: Permissions
}

// ---- Quick action types ----

type QuickActionId =
  | 'slap'
  | 'spectate'
  | 'screenshot'
  | 'stream'
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
      { id: 'stream', label: 'Stream', icon: 'play', permission: 'player.screenshot' },
    ],
  },
]

export function PlayerActionsPanel({ player, permissions }: PlayerActionsPanelProps) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [teleportBusy, setTeleportBusy] = useState<TeleportAction | null>(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const [isSpectating, setIsSpectating] = useState(false)

  // Screenshot callback returns immediately; actual image arrives via 'screenshot:received'
  useEffect(() => {
    return on<{ playerName: string }>('screenshot:received', () => {
      setScreenshotLoading(false)
    })
  }, [])
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
                notify(t('Slapped'), 'success')
              } catch {
                notify(t('Slap failed'), 'error')
              }
              closeModal()
            },
          })
          break
        case 'spectate':
          if (isSpectating) {
            await callLua('stopSpectate', {})
            setIsSpectating(false)
            notify(t("Stopped spectating"), 'success')
          } else {
            await callLua('spectatePlayer', { id: player.id, name: player.name })
            setIsSpectating(true)
            notify(t("Spectating {name}", { name: player.name }), 'success')
          }
          break
        case 'screenshot':
          setScreenshotLoading(true)
          try {
            await callLua('screenshotPlayer', { id: player.id, name: player.name })
          } catch {
            setScreenshotLoading(false)
          }
          // Screenshot opens in a floating viewer window — no toast needed
          // setScreenshotLoading(false) is called by the screenshot:received listener above
          break
        case 'stream':
          await callLua('streamPlayer', { id: player.id, name: player.name })
          // Stream opens in a floating viewer window — no toast needed
          break
        case 'bucket-join':
          await callLua('joinPlayerBucket', { id: player.id, name: player.name })
          notify(t('Joined bucket'), 'success')
          break
        case 'bucket-force':
          await callLua('forcePlayerBucket', { id: player.id, name: player.name })
          notify(t('Forced bucket'), 'success')
          break
        case 'freeze': {
          const newFrozen = !player.frozen
          await callLua('toggleFreeze', { id: player.id, name: player.name, freeze: newFrozen })
          notify(t(newFrozen ? "Frozen {name}" : "Unfrozen {name}", { name: player.name }), 'success')
          break
        }
        case 'mute': {
          const newMuted = !player.muted
          await callLua('toggleMute', { id: player.id, name: player.name, mute: newMuted })
          notify(t(newMuted ? "Muted {name}" : "Unmuted {name}", { name: player.name }), 'success')
          break
        }
      }
    } catch {
      notify(t('Action failed'), 'error')
    } finally {
      setBusyAction(null)
    }
  }

  // ---- Discipline handlers (modal-based) ----

  function handleWarn() {
    openModal(
      createTextInputModal({
        title: t("Warn {name}", { name: player.name }),
        label: t('Reason'),
        placeholder: t('No reason'),
        required: true,
        submitLabel: t('Warn'),
        submitVariant: 'warning',
        onSubmit: async (values) => {
          const reason = typeof values.value === 'string' ? values.value.trim() : 'No reason'
          try {
            await callLua('warnPlayer', { id: player.id, name: player.name, reason })
            notify(t("Warned {name}", { name: player.name }), 'success')
          } catch {
            notify(t('Warn failed'), 'error')
          }
          closeModal()
        },
      }),
    )
  }

  function handleKick() {
    openModal(
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
          closeModal()
        },
      }),
    )
  }

  function handleBan() {
    openModal(
      createBanModal({
        title: t("Ban {name}", { name: player.name }),
        onSubmit: async (reason, duration) => {
          try {
            await callLua('banPlayer', { id: player.id, name: player.name, reason, duration })
            notify(t("Banned {name}", { name: player.name }), 'success')
          } catch {
            notify(t('Failed to ban player'), 'error')
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
      notify(t("{label} executed", { label: opt.label }), 'success')
    } catch {
      notify(t("Failed: {label}", { label: opt.label }), 'error')
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
      <p className="section-label">{t("Actions")}</p>

      {!hasAnyPermission && (
        <p className="text-sm text-fg-muted">{t("No permissions for this player")}</p>
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
              {t("Warn")}
            </button>
          )}
          {canKick && (
            <button
              className="btn btn-warning btn-sm"
              // eslint-disable-next-line nui/no-inline-styles -- overrides btn-warning to use orange instead of yellow for Kick
              style={{ background: 'var(--accent-orange)', borderColor: 'var(--accent-orange)' }}
              onClick={handleKick}
            >
              <Icon name="log-out" size="xs" />
              {t("Kick")}
            </button>
          )}
          {canBan && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBan}
            >
              <Icon name="ban" size="xs" />
              {t("Ban")}
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
                  const isToggle = action.id === 'freeze' || action.id === 'mute' || action.id === 'spectate'
                  const isActive = action.id === 'freeze' ? player.frozen : action.id === 'mute' ? player.muted : isSpectating
                  const isLoading = action.id === 'screenshot' && screenshotLoading
                  const btn = (
                    <button
                      key={action.id}
                      className={`panel-btn player-action-group-btn${isToggle && isActive ? ' player-action-group-btn-active' : ''}`}
                      onClick={() => handleQuickAction(action.id)}
                      disabled={isLoading || busyAction === action.id}
                      title={isToggle
                        ? `${action.id === 'spectate' && isActive ? 'Stop Spectating ' : isActive ? 'Un' : ''}${action.label}${action.id !== 'spectate' || !isActive ? ' ' : ''}${action.id !== 'spectate' || !isActive ? player.name : ''}`
                        : `${action.label} ${player.name}`
                      }
                    >
                      {isLoading ? (
                        <Icon name="loader-2" size="sm" className="icon-spin" />
                      ) : (
                        <Icon name={action.icon} size="sm" />
                      )}
                      <span className="player-action-group-btn-label">
                        {isToggle && isActive ? (action.id === 'spectate' ? 'Stop Spectating' : `Un${action.label}`) : action.label}
                      </span>
                    </button>
                  )

                  return btn
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
                  placeholder={t("Select action...")}
                  onChange={handleTeleportSelect}
                  disabled={teleportBusy !== null}
                  ariaLabel={t("Teleport option")}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
