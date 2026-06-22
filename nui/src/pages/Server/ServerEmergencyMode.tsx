import { useEffect, useState } from 'react'
import { callLua, on } from '../../fivem'
import { Icon } from '../../components/icons'
import { useModalContext } from '../../ModalContext'
import { createConfirmModal, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'

interface ServerEmergencyModeProps {
  permissions: Permissions
}

export function ServerEmergencyMode({ permissions }: ServerEmergencyModeProps) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    return on<{ enabled: boolean }>('globalMuteState', (data) => {
      setEnabled(data.enabled)
    })
  }, [])

  const canToggle = !!permissions['server.mute.global']
  if (!canToggle) return null

  function handleToggle() {
    openModal(
      enabled
        ? createConfirmModal({
            title: t('Disable Emergency Mode'),
            description: t('This will restore chat for all players. Continue?'),
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
            description: t('This will mute ALL player chat server-wide. Only admins will be able to type. Continue?'),
            submitVariant: 'danger',
            onSubmit: async () => {
              await runModalAction({
                action: () => callLua('toggleGlobalMute'),
                closeModal,
                successMessage: t('Emergency mode enabled — all players muted'),
                errorMessage: t('Action failed'),
              })
            },
          }),
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`emergency-mode-indicator ${enabled ? 'emergency-mode-indicator--active' : ''}`}>
            <Icon name={enabled ? 'volume-x' : 'volume-2'} size="sm" />
          </div>
          <div>
            <p className="section-label mb-0">{t("Emergency Mode")}</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {enabled
                ? t("All player chat is muted. Only admins can type.")
                : t("Mute all player chat server-wide. Only admins can type.")}
            </p>
          </div>
        </div>
        <button
          className={`btn btn-sm ${enabled ? 'btn-success' : 'btn-danger'}`}
          onClick={handleToggle}
        >
          <Icon name={enabled ? 'volume-2' : 'volume-x'} size="xs" />
          {enabled ? t('Disable') : t('Enable')}
        </button>
      </div>
    </div>
  )
}
