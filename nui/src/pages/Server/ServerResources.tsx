import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'

export function ServerResources() {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  return (
    <div className="card">
      <p className="section-label">{t("Resources")}</p>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-primary btn-full"
          onClick={() => openModal(createTextInputModal({
            title: t('Start Resource'),
            label: t('Resource name'),
            placeholder: t('my-resource'),
            required: true,
            onSubmit: async (values) => {
              const name = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('startResource', { name }),
                closeModal,
                successMessage: t("Starting {name}", { name }),
                errorMessage: t('Failed to start resource'),
              })
            },
          }))}
        >
          <Icon name="plus" size="xs" />
          {t("Start resource")}
        </button>
        <button
          className="btn btn-warning btn-full"
          onClick={() => openModal(createTextInputModal({
            title: t('Stop Resource'),
            label: t('Resource name'),
            placeholder: t('my-resource'),
            required: true,
            submitVariant: 'warning',
            onSubmit: async (values) => {
              const name = getStringValue(values, 'value')
              await runModalAction({
                action: () => callLua('stopResource', { name }),
                closeModal,
                successMessage: t("Stopping {name}", { name }),
                errorMessage: t('Failed to stop resource'),
              })
            },
          }))}
        >
          <Icon name="x" size="xs" />
          {t("Stop resource")}
        </button>
      </div>
    </div>
  )
}
