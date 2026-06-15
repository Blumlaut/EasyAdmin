import { useState } from 'react'
import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Icon } from '../../components/icons'

interface AllPlayersActionsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

/**
 * "All Players" actions: teleport everyone to me. Lives on the player list page.
 */
export function AllPlayersActions({ onToast }: AllPlayersActionsProps) {
  const [confirmTeleport, setConfirmTeleport] = useState(false)
  const [busy, setBusy] = useState(false)

  async function teleportAll() {
    setBusy(true)
    try {
      await callLua('teleportPlayerToMe', { id: -1 })
      onToast('All players teleported to you', 'success')
    } catch {
      onToast('Action failed', 'error')
    } finally {
      setBusy(false)
      setConfirmTeleport(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">All Players</h3>
      <button
        className="btn btn-secondary"
        onClick={() => setConfirmTeleport(true)}
        disabled={busy}
      >
        <Icon name="map-pin" size="xs" />
        Teleport everyone to me
      </button>

      {confirmTeleport && (
        <ConfirmDialog
          title="Teleport everyone"
          message="This will teleport every player on the server to your position. Continue?"
          variant="danger"
          confirmLabel="Teleport all"
          onConfirm={teleportAll}
          onCancel={() => setConfirmTeleport(false)}
        />
      )}
    </div>
  )
}
