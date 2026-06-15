import type { CleanupType, Notification, Permissions } from '../../types'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'

interface ServerCleanupProps {
  permissions: Permissions
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerCleanup({ permissions, onToast: _onToast }: ServerCleanupProps) {
  const modal = useModalContext()

  const availableTypes: CleanupType[] = []
  if (permissions['server.cleanup.cars']) availableTypes.push('cars')
  if (permissions['server.cleanup.peds']) availableTypes.push('peds')
  if (permissions['server.cleanup.props']) availableTypes.push('props')

  if (availableTypes.length === 0) return null

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">Cleanup</h3>
      <p className="text-sm text-muted mb-3">
        Remove cars, peds, or props from an area around you.
      </p>
      <button
        className="btn btn-warning"
        onClick={() => modal.openCleanup(availableTypes)}
      >
        <Icon name="trash" size="xs" />
        Clean area
      </button>
    </div>
  )
}
