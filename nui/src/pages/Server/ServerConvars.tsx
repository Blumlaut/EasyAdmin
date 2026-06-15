import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

export function ServerConvars() {
  const modal = useModalContext()

  return (
    <div className="card">
      <p className="section-label">ConVars</p>
      <p className="text-sm text-secondary mb-3">
        Set a convar by name and value.
      </p>
      <button
        className="btn btn-secondary btn-full"
        onClick={() => modal.openConvar()}
      >
        <Icon name="settings" size="xs" />
        Set convar
      </button>
    </div>
  )
}
