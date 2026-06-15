import { useState } from 'react'
import { callLua } from '../../fivem'
import type { IconName } from '../../components/icons'
import type { Notification, Permissions, Player } from '../../types'
import { Icon } from '../../components/icons'
import { InputPrompt } from '../../components/InputPrompt'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SliderInput } from '../../components/SliderInput'
import { BanDurationPicker } from '../../components/BanDurationPicker'

interface PlayerActionsGridProps {
  player: Player
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

type Variant = 'primary' | 'secondary' | 'danger' | 'warning'

interface ActionDef {
  id: string
  label: string
  icon: IconName
  variant: Variant
  permission: string
}

const ACTIONS: ActionDef[] = [
  { id: 'kick', label: 'Kick', icon: 'log-out', variant: 'danger', permission: 'player.kick' },
  { id: 'ban', label: 'Ban', icon: 'ban', variant: 'danger', permission: 'player.ban.temporary' },
  { id: 'warn', label: 'Warn', icon: 'alert-triangle', variant: 'warning', permission: 'player.warn' },
  { id: 'slap', label: 'Slap', icon: 'zap', variant: 'secondary', permission: 'player.slap' },
  { id: 'spectate', label: 'Spectate', icon: 'eye', variant: 'secondary', permission: 'player.spectate' },
  { id: 'screenshot', label: 'Screenshot', icon: 'camera', variant: 'secondary', permission: 'player.screenshot' },
  { id: 'bucket-join', label: 'Join bucket', icon: 'arrow-left', variant: 'secondary', permission: 'player.bucket.join' },
  { id: 'bucket-force', label: 'Force bucket', icon: 'map-pin', variant: 'warning', permission: 'player.bucket.force' },
]

const TOGGLE_ACTIONS: Array<{
  id: 'freeze' | 'mute'
  label: (p: Player) => string
  activeLabel: (p: Player) => string
  icon: IconName
  permission: string
}> = [
  {
    id: 'freeze',
    label: () => 'Freeze',
    activeLabel: () => 'Unfreeze',
    icon: 'snowflake',
    permission: 'player.freeze',
  },
  {
    id: 'mute',
    label: () => 'Mute',
    activeLabel: () => 'Unmute',
    icon: 'volume-x',
    permission: 'player.mute',
  },
]

/**
 * The main action grid for a player detail page. Renders a button for each
 * available action, gating by permission. Opens input/confirm modals on click.
 */
export function PlayerActionsGrid({ player, permissions, onToast }: PlayerActionsGridProps) {
  const [modal, setModal] = useState<ModalState>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const available = ACTIONS.filter((a) => permissions[a.permission])
  const availableToggles = TOGGLE_ACTIONS.filter((a) => permissions[a.permission])

  async function runToggle(id: 'freeze' | 'mute') {
    setBusy(id)
    try {
      const newState = id === 'freeze' ? !player.frozen : !player.muted
      await callLua(id === 'freeze' ? 'toggleFreeze' : 'toggleMute', {
        id: player.id,
        name: player.name,
        freeze: newState,
        mute: newState,
      })
      onToast(`${id === 'freeze' ? 'Freeze' : 'Mute'} toggled`, 'success')
    } catch {
      onToast('Action failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action.id}
            className={`btn btn-${action.variant}`}
            onClick={() => openModal(setModal, action.id, player)}
            disabled={busy === action.id}
          >
            <Icon name={action.icon} size="xs" />
            {action.label}
          </button>
        ))}
        {availableToggles.map((toggle) => {
          const active = toggle.id === 'freeze' ? player.frozen : player.muted
          return (
            <button
              key={toggle.id}
              className={`btn ${active ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => runToggle(toggle.id)}
              disabled={busy === toggle.id}
            >
              <Icon name={toggle.icon} size="xs" />
              {active ? toggle.activeLabel(player) : toggle.label(player)}
            </button>
          )
        })}
        {available.length === 0 && availableToggles.length === 0 && (
          <p className="text-muted text-sm">No permissions for this player</p>
        )}
      </div>

      {renderModal(modal, setModal, onToast, player)}
    </div>
  )
}

type ModalState =
  | { kind: 'reason'; action: 'kick' | 'warn' }
  | { kind: 'ban' }
  | { kind: 'slap' }
  | { kind: 'confirm'; action: 'bucket-join' | 'bucket-force' | 'spectate' | 'screenshot' }
  | null

function openModal(
  setModal: (s: ModalState) => void,
  actionId: string,
  _player: Player,
) {
  if (actionId === 'kick' || actionId === 'warn') {
    setModal({ kind: 'reason', action: actionId })
  } else if (actionId === 'ban') {
    setModal({ kind: 'ban' })
  } else if (actionId === 'slap') {
    setModal({ kind: 'slap' })
  } else {
    setModal({ kind: 'confirm', action: actionId as 'bucket-join' | 'bucket-force' | 'spectate' | 'screenshot' })
  }
}

function renderModal(
  modal: ModalState,
  setModal: (s: ModalState) => void,
  onToast: (text: string, type?: Notification['type']) => void,
  player: Player,
) {
  if (!modal) return null

  if (modal.kind === 'reason') {
    return (
      <InputPrompt
        title={`${modal.action === 'kick' ? 'Kick' : 'Warn'} player`}
        label={`Reason for ${modal.action === 'kick' ? 'kicking' : 'warning'}`}
        placeholder="No reason"
        onCancel={() => setModal(null)}
        onConfirm={async (reason) => {
          setModal(null)
          try {
            await callLua(modal.action === 'kick' ? 'kickPlayer' : 'warnPlayer', {
              id: player.id,
              name: player.name,
              reason: reason || 'No reason',
            })
            onToast(`${modal.action === 'kick' ? 'Kicked' : 'Warned'} ${player.name}`, 'success')
          } catch {
            onToast('Action failed', 'error')
          }
        }}
      />
    )
  }

  if (modal.kind === 'ban') {
    return (
      <BanFlowModal
        player={player}
        onClose={() => setModal(null)}
        onToast={onToast}
      />
    )
  }

  if (modal.kind === 'slap') {
    return (
      <SliderInput
        label="Slap player"
        min={1}
        max={20}
        initialValue={5}
        formatValue={(n) => `${n * 10} damage`}
        onCancel={() => setModal(null)}
        onConfirm={async (n) => {
          setModal(null)
          try {
            await callLua('slapPlayer', { id: player.id, name: player.name, amount: n * 10 })
            onToast('Slapped', 'success')
          } catch {
            onToast('Action failed', 'error')
          }
        }}
      />
    )
  }

  if (modal.kind === 'confirm') {
    const labels: Record<typeof modal.action, { title: string; msg: string; cb: string }> = {
      spectate: { title: 'Spectate', msg: `Start spectating ${player.name}?`, cb: 'spectatePlayer' },
      screenshot: { title: 'Screenshot', msg: `Take a screenshot of ${player.name}?`, cb: 'screenshotPlayer' },
      'bucket-join': { title: 'Join bucket', msg: `Join ${player.name}'s routing bucket?`, cb: 'joinPlayerBucket' },
      'bucket-force': { title: 'Force bucket', msg: `Force ${player.name} into your routing bucket?`, cb: 'forcePlayerBucket' },
    }
    const meta = labels[modal.action]
    return (
      <ConfirmDialog
        title={meta.title}
        message={meta.msg}
        variant={modal.action === 'bucket-force' ? 'danger' : 'default'}
        confirmLabel={meta.title}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          setModal(null)
          try {
            await callLua(meta.cb, { id: player.id, name: player.name })
            onToast(`${meta.title} executed`, 'success')
          } catch {
            onToast('Action failed', 'error')
          }
        }}
      />
    )
  }

  return null
}

function BanFlowModal({
  player,
  onClose,
  onToast,
}: {
  player: Player
  onClose: () => void
  onToast: (text: string, type?: Notification['type']) => void
}) {
  const [reason, setReason] = useState<null | string>(null)
  const [duration, setDuration] = useState<number | null>(null)

  // Two-step flow: ask for reason first, then for duration.
  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${player.name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={onClose}
        onConfirm={(v) => setReason(v || 'No reason')}
      />
    )
  }
  if (duration === null) {
    return (
      <BanDurationFlow
        onBack={() => setReason(null)}
        onCancel={onClose}
        onConfirm={async (seconds) => {
          setDuration(seconds)
          try {
            await callLua('banPlayer', {
              id: player.id,
              name: player.name,
              reason,
              duration: seconds ?? 0,
            })
            onToast(`Banned ${player.name}`, 'success')
            onClose()
          } catch {
            onToast('Ban failed', 'error')
            onClose()
          }
        }}
      />
    )
  }
  return null
}

function BanDurationFlow({
  onBack,
  onCancel,
  onConfirm,
}: {
  onBack: () => void
  onCancel: () => void
  onConfirm: (seconds: number | null) => void
}) {
  const [duration, setDuration] = useState<number | null>(null)
  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ban-flow-title">
        <h2 id="ban-flow-title" className="dialog-title">Ban duration</h2>
        <p className="dialog-description">Choose how long the ban should last.</p>
        <BanDurationPicker value={duration} onChange={setDuration} />
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={duration === null || duration === -1}
            onClick={() => onConfirm(duration)}
          >
            Confirm ban
          </button>
        </div>
      </div>
    </div>
  )
}
