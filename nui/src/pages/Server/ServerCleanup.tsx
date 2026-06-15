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
    <div className="card" style={{ borderTop: '2px solid', borderColor: 'rgba(210, 153, 34, 0.3)' }}>
      <p className="section-label">Cleanup</p>
      <p className="text-sm text-secondary mb-3">
        Remove cars, peds, or props from an area around you.
      </p>
      <button
        className="btn btn-warning btn-full"
        onClick={() => modal.openCleanup(availableTypes)}
      >
        <Icon name="trash" size="xs" />
        Clean area
      </button>
    </div>
  )
}
