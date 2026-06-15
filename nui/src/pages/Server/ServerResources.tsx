import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerResources() {
  const modal = useModalContext()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">Resources</h3>
      <div className="flex flex-col gap-2">
        <button
          className="btn btn-primary"
          onClick={() => modal.openResourceStart()}
        >
          <Icon name="plus" size="xs" />
          Start resource
        </button>
        <button
          className="btn btn-warning"
          onClick={() => modal.openResourceStop()}
        >
          <Icon name="x" size="xs" />
          Stop resource
        </button>
      </div>
    </div>
  )
}
