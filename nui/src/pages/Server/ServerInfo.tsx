import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerInfo() {
  const modal = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Server Info</p>
      <div className="flex flex-col gap-1">
        <button
          className="server-action-btn"
          onClick={() => modal.openGametype()}
        >
          <Icon name="server" size="xs" className="text-muted" />
          <span className="flex-1 text-left">Set gametype</span>
          <Icon name="chevron-right" size="xs" className="text-muted" style={{ opacity: 0.4 }} />
        </button>
        <button
          className="server-action-btn"
          onClick={() => modal.openSessionName()}
        >
          <Icon name="map-pin" size="xs" className="text-muted" />
          <span className="flex-1 text-left">Set map name</span>
          <Icon name="chevron-right" size="xs" className="text-muted" style={{ opacity: 0.4 }} />
        </button>
      </div>
    </div>
  )
}
