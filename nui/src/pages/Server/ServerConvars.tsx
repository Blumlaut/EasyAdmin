import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'

export function ServerConvars() {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  return (
    <div className="card">
      <p className="section-label">{t("ConVars")}</p>
      <p className="mb-3 text-sm text-fg-subtle">
        {t("Set a convar by name and value.")}
      </p>
      <button
        className="btn btn-secondary btn-full"
        onClick={() => openModal({
          title: t('Set Convar'),
          fields: [
            {
              key: 'name',
              type: 'text',
              label: t('Convar name'),
              placeholder: t('sv_hostname'),
              required: true,
            },
            {
              key: 'value',
              type: 'text',
              label: t('Value'),
              placeholder: t('My Server'),
              required: true,
            },
          ],
          onSubmit: async (values) => {
            const name = typeof values.name === 'string' ? values.name.trim() : ''
            const value = typeof values.value === 'string' ? values.value.trim() : ''
            await runModalAction({
              action: () => callLua('setConvar', { name, value }),
              closeModal,
              successMessage: t('Convar set'),
              errorMessage: t('Failed to set convar'),
            })
          },
        })}
      >
        <Icon name="settings" size="xs" />
        {t("Set convar")}
      </button>
    </div>
  )
}
