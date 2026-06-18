import type { Notification } from '../../types'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { createTextInputModal, getStringValue, runModalAction } from '../../modals/helpers'

interface ServerAnnouncementsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerAnnouncements({ onToast }: ServerAnnouncementsProps) {
  const { openModal, closeModal } = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Announcements</p>
      <p className="text-sm text-secondary mb-3">
        Send a message to all players on the server.
      </p>
      <button
        className="btn btn-primary btn-full"
        onClick={() => openModal(createTextInputModal({
          title: 'Server Announcement',
          label: 'Message to broadcast',
          placeholder: 'Server restart in 5 minutes',
          maxLength: 200,
          required: true,
          onSubmit: async (values) => {
            const message = getStringValue(values, 'value')
            await runModalAction({
              action: () => callLua('announce', { message }),
              onToast,
              closeModal,
              successMessage: 'Announcement sent',
              errorMessage: 'Failed to send announcement',
            })
          },
        }))}
      >
        <Icon name="message-square" size="xs" />
        Send announcement
      </button>
    </div>
  )
}
