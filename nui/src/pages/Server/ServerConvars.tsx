import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerConvars() {
  const modal = useModalContext()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">ConVars</h3>
      <p className="text-sm text-muted mb-3">
        Set a convar by name and value.
      </p>
      <button
        className="btn btn-secondary"
        onClick={() => modal.openConvar()}
      >
        <Icon name="settings" size="xs" />
        Set convar
      </button>
    </div>
  )
}
