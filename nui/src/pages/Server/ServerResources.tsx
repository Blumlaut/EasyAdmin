import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerResources() {
  const modal = useModalContext()

  return (
    <div className="card">
      <p className="section-label">Resources</p>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-primary btn-full"
          onClick={() => modal.openResourceStart()}
        >
          <Icon name="plus" size="xs" />
          Start resource
        </button>
        <button
          className="btn btn-warning btn-full"
          onClick={() => modal.openResourceStop()}
        >
          <Icon name="x" size="xs" />
          Stop resource
        </button>
      </div>
    </div>
  )
}
