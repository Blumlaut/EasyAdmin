import { useState } from 'react'
import type { Player } from '../types'
import { callLua } from '../fivem'
import { InputPrompt } from '../components/InputPrompt'
import { BanDurationPicker } from '../components/BanDurationPicker'
import { DialogWrapper } from '../components/DialogWrapper'

interface BanFlowModalProps {
  player: Player
  onCancel: () => void
  onComplete: () => void
  onToast: (text: string, type?: 'info' | 'success' | 'error') => void
}

export function BanFlowModal({ player, onCancel, onComplete, onToast }: BanFlowModalProps) {
  const [reason, setReason] = useState<string | null>(null)

  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${player.name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={onCancel}
        onConfirm={(value) => setReason(value || 'No reason')}
      />
    )
  }

  return (
    <BanDurationStep
      title="Ban duration"
      onBack={() => setReason(null)}
      onCancel={onCancel}
      onConfirm={async (duration) => {
        try {
          await callLua('banPlayer', {
            id: player.id,
            name: player.name,
            reason,
            duration,
          })
          onToast(`Banned ${player.name}`, 'success')
        } catch {
          onToast('Failed to ban player', 'error')
        }
        onComplete()
      }}
    />
  )
}

interface OfflineBanFlowModalProps {
  id: number
  name: string
  onCancel: () => void
  onComplete: () => void
  onToast: (text: string, type?: 'info' | 'success' | 'error') => void
}

export function OfflineBanFlowModal({ id, name, onCancel, onComplete, onToast }: OfflineBanFlowModalProps) {
  const [reason, setReason] = useState<string | null>(null)

  if (reason === null) {
    return (
      <InputPrompt
        title={`Ban ${name}`}
        label="Ban reason"
        placeholder="No reason"
        onCancel={onCancel}
        onConfirm={(value) => setReason(value || 'No reason')}
      />
    )
  }

  return (
    <BanDurationStep
      title="Ban duration"
      onCancel={onCancel}
      onConfirm={async (duration) => {
        try {
          await callLua('offlineBanPlayer', { id, name, reason, duration })
          onToast(`Banned ${name}`, 'success')
        } catch {
          onToast('Failed to ban player', 'error')
        }
        onComplete()
      }}
    />
  )
}

function BanDurationStep({
  title,
  onBack,
  onCancel,
  onConfirm,
}: {
  title: string
  onBack?: () => void
  onCancel: () => void
  onConfirm: (duration: number) => void
}) {
  const [duration, setDuration] = useState<number | null>(null)

  return (
    <DialogWrapper
      title={title}
      description="Choose how long the ban should last."
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          {onBack && (
            <button className="btn btn-secondary" onClick={onBack}>Back</button>
          )}
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={duration === null || duration === -1}
            onClick={() => {
              if (duration !== null && duration !== -1) onConfirm(duration)
            }}
          >
            Confirm ban
          </button>
        </div>
      }
    >
      <BanDurationPicker value={duration} onChange={setDuration} />
    </DialogWrapper>
  )
}
