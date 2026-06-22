import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'

export function ServerInfo() {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  return (
    <div className="card">
      <p className="section-label">{t("Server Info")}</p>
      <div className="flex flex-col gap-1">
        <button
          className="server-action-btn"
          onClick={() => openModal(createTextInputModal({
            title: t('Set Gametype'),
            label: t('Gametype'),
            placeholder: t('Roleplay'),
            required: true,
            onSubmit: async (values) => {
              const value = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('setGametype', { value }),
                closeModal,
                successMessage: t('Gametype updated'),
                errorMessage: t('Failed to set gametype'),
              })
            },
          }))}
        >
          <Icon name="server" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">{t("Set gametype")}</span>
          <Icon name="chevron-right" size="xs" className="opacity-subtle text-fg-muted" />
        </button>
        <button
          className="server-action-btn"
          onClick={() => openModal(createTextInputModal({
            title: t('Set Map Name'),
            label: t('Map name'),
            placeholder: t('Chaos Island'),
            required: true,
            onSubmit: async (values) => {
              const value = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('setMapName', { value }),
                closeModal,
                successMessage: t('Map name updated'),
                errorMessage: t('Failed to set map name'),
              })
            },
          }))}
        >
          <Icon name="map-pin" size="xs" className="text-fg-muted" />
          <span className="flex-1 text-left">{t("Set map name")}</span>
          <Icon name="chevron-right" size="xs" className="opacity-subtle text-fg-muted" />
        </button>
      </div>
    </div>
  )
}
