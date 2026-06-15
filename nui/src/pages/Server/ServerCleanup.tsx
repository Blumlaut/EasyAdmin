import { useState } from 'react'
import { callLua } from '../../fivem'
import type { CleanupRadius, CleanupType, Notification, Permissions } from '../../types'
import { CleanupModal } from '../../components/CleanupModal'
import { Icon } from '../../components/icons'

interface ServerCleanupProps {
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerCleanup({ permissions, onToast }: ServerCleanupProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const availableTypes: CleanupType[] = []
  if (permissions['server.cleanup.cars']) availableTypes.push('cars')
  if (permissions['server.cleanup.peds']) availableTypes.push('peds')
  if (permissions['server.cleanup.props']) availableTypes.push('props')

  if (availableTypes.length === 0) return null

  async function run(type: CleanupType, radius: CleanupRadius, deep: boolean) {
    setBusy(true)
    try {
      await callLua('requestCleanup', { type, radius, deep })
      onToast('Cleanup requested', 'success')
      setOpen(false)
    } catch {
      onToast('Cleanup failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Cleanup</h3>
      <p className="text-sm text-muted mb-3">
        Remove cars, peds, or props from an area around you.
      </p>
      <button
        className="btn btn-warning"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        <Icon name="trash" size="xs" />
        Clean area
      </button>
      {open && (
        <CleanupModal
          availableTypes={availableTypes}
          onConfirm={run}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
