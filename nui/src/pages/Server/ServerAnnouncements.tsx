import type { Notification } from '../../types'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

interface ServerAnnouncementsProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerAnnouncements({ onToast: _onToast }: ServerAnnouncementsProps) {
  const modal = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Announcements</p>
      <p className="text-sm text-secondary mb-3">
        Send a message to all players on the server.
      </p>
      <button
        className="btn btn-primary btn-full"
        onClick={() => modal.openAnnouncement()}
      >
        <Icon name="message-square" size="xs" />
        Send announcement
      </button>
    </div>
  )
}
