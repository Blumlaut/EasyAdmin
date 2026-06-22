import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'
import { useTranslation } from '../../lib/i18n'

export function ServerAnnouncements() {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  return (
    <div className="card">
      <p className="section-label">{t("Announcements")}</p>
      <p className="mb-3 text-sm text-fg-subtle">
        {t("Send a message to all players on the server.")}
      </p>
      <button
        className="btn btn-primary btn-full"
        onClick={() => openModal(createTextInputModal({
          title: t('Server Announcement'),
          label: t('Message to broadcast'),
          placeholder: t('Server restart in 5 minutes'),
          maxLength: 200,
          required: true,
          onSubmit: async (values) => {
            const message = getStringValue(values, 'value')
            await runModalAction({
              action: () => callLua('announce', { message }),
              closeModal,
              successMessage: t('Announcement sent'),
              errorMessage: t('Failed to send announcement'),
            })
          },
        }))}
      >
        <Icon name="message-square" size="xs" />
        {t("Send announcement")}
      </button>
    </div>
  )
}
