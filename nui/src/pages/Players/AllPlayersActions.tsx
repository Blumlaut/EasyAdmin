import { useEffect, useState } from 'react'
import { callLua, on } from '../../fivem'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { createConfirmModal, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

/**
 * "All Players" actions: teleport everyone to me, global mute toggle.
 * Lives on the player list page.
 */
export function AllPlayersActions({ permissions }: { permissions: Permissions }) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()
  const [globalMuteEnabled, setGlobalMuteEnabled] = useState(false)

  useEffect(() => {
    const unsub = on<{ enabled: boolean }>('globalMuteState', (data) => {
      setGlobalMuteEnabled(data.enabled)
    })
    return unsub
  }, [])

  const canTeleportAll = !!permissions['player.teleport.everyone']
  const canGlobalMute = !!permissions['server.mute.global']

  return (
    <div className="card">
      <p className="section-label">{t("All Players")}</p>

      {canGlobalMute && (
        <button
          className={`btn btn-full ${globalMuteEnabled ? 'btn-success' : 'btn-danger'}`}
          onClick={() =>
            openModal(
              globalMuteEnabled
                ? createConfirmModal({
                    title: t('Disable Emergency Mode'),
                    description:
                      t('This will restore chat for all players. Continue?'),
                    submitVariant: 'primary',
                    onSubmit: async () => {
                      await runModalAction({
                        action: () => callLua('toggleGlobalMute'),
                        closeModal,
                        successMessage: t('Emergency mode disabled'),
                        errorMessage: t('Action failed'),
                      })
                    },
                  })
                : createConfirmModal({
                    title: t('Enable Emergency Mode'),
                    description:
                      t('This will mute ALL player chat server-wide. Only admins will be able to type. Continue?'),
                    submitVariant: 'danger',
                    onSubmit: async () => {
                      await runModalAction({
                        action: () => callLua('toggleGlobalMute'),
                        closeModal,
                        successMessage: t('Emergency mode enabled — all players muted'),
                        errorMessage: t('Action failed'),
                      })
                    },
                  })
            )
          }
        >
          <Icon name={globalMuteEnabled ? 'volume-2' : 'volume-x'} size="xs" />
          {globalMuteEnabled ? t('Disable Emergency Mode') : t('Enable Emergency Mode')}
        </button>
      )}

      {canTeleportAll && (
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
      )}
    </div>
  )
}
