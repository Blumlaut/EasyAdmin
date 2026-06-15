import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerInfo() {
  const modal = useModalContext()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Server Info</h3>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => modal.openGametype()}
        >
          <Icon name="server" size="xs" />
          Set gametype
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => modal.openSessionName()}
        >
          <Icon name="map-pin" size="xs" />
          Set map name
        </button>
      </div>
    </div>
  )
}
