import { callLua } from '../../fivem'
import type { Notification } from '../../types'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { createConfirmModal, runModalAction } from '../../modals/helpers'

interface AllPlayersActionsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

/**
 * "All Players" actions: teleport everyone to me. Lives on the player list page.
 */
export function AllPlayersActions({ onToast }: AllPlayersActionsProps) {
  const { openModal, closeModal } = useModalContext()

  return (
    <div className="card">
      <p className="section-label">All Players</p>
      <button
        className="btn btn-secondary btn-full"
        onClick={() =>
          openModal(createConfirmModal({
            title: 'Teleport everyone',
            description: 'This will teleport every player on the server to your position. Continue?',
            submitVariant: 'danger',
            onSubmit: async () => {
              await runModalAction({
                action: () => callLua('teleportPlayerToMe', { id: -1 }),
                onToast,
                closeModal,
                successMessage: 'All players teleported to you',
                errorMessage: 'Action failed',
              })
            },
          }))
        }
      >
        <Icon name="map-pin" size="xs" />
        Teleport everyone to me
      </button>
    </div>
  )
}
