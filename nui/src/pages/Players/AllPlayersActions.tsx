import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'

interface AllPlayersActionsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

/**
 * "All Players" actions: teleport everyone to me. Lives on the player list page.
 */
export function AllPlayersActions({ onToast }: AllPlayersActionsProps) {
  const modal = useModalContext()

  return (
    <div className="card">
      <p className="section-label">All Players</p>
      <button
        className="btn btn-secondary btn-full"
        onClick={() =>
          modal.openConfirm(
            'Teleport everyone',
            'This will teleport every player on the server to your position. Continue?',
            async () => {
              try {
                await callLua('teleportPlayerToMe', { id: -1 })
                onToast('All players teleported to you', 'success')
              } catch {
                onToast('Action failed', 'error')
              }
            },
            'danger'
          )
        }
      >
        <Icon name="map-pin" size="xs" />
        Teleport everyone to me
      </button>
    </div>
  )
}
