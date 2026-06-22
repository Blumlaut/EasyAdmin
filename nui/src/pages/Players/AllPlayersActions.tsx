import { callLua } from '../../fivem'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { createConfirmModal, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

/**
 * "All Players" actions: teleport everyone to me.
 * Lives on the player list page.
 * (Emergency mode moved to Server Management)
 */
export function AllPlayersActions({ permissions }: { permissions: Permissions }) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  const canTeleportAll = !!permissions['player.teleport.everyone']

  if (!canTeleportAll) return null

  return (
    <div className="card">
      <p className="section-label">{t("All Players")}</p>

      <button
        className="btn btn-secondary btn-full"
        onClick={() =>
          openModal(createConfirmModal({
            title: t('Teleport everyone'),
            description: t('This will teleport every player on the server to your position. Continue?'),
            submitVariant: 'danger',
            onSubmit: async () => {
              await runModalAction({
                action: () => callLua('teleportPlayerToMe', { id: -1 }),
                closeModal,
                successMessage: t('All players teleported to you'),
                errorMessage: t('Action failed'),
              })
            },
          }))
        }
      >
        <Icon name="map-pin" size="xs" />
        {t("Teleport everyone to me")}
      </button>
    </div>
  )
}
