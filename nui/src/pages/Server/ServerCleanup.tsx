import type { CleanupRadius, CleanupType, Permissions } from '../../types'
import { notify } from '../../lib/notify'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'

interface ServerCleanupProps {
  permissions: Permissions
}

const RADII: CleanupRadius[] = [10, 20, 50, 100, 'global']

export function ServerCleanup({ permissions }: ServerCleanupProps) {
  const { openModal, closeModal } = useModalContext()

  const availableTypes: CleanupType[] = []
  if (permissions['server.cleanup.cars']) availableTypes.push('cars')
  if (permissions['server.cleanup.peds']) availableTypes.push('peds')
  if (permissions['server.cleanup.props']) availableTypes.push('props')

  if (availableTypes.length === 0) return null

  return (
    <div className="card card-warning-border">
      <p className="section-label">Cleanup</p>
      <p className="mb-3 text-sm text-fg-subtle">
        Remove cars, peds, or props from an area around you.
      </p>
      <button
        className="btn btn-warning btn-full"
        onClick={() => openModal({
          title: 'Clean Area',
          description: 'Choose what to clean and how far from your position.',
          submitLabel: 'Clean',
          submitVariant: 'warning',
          fields: [
            {
              key: 'type',
              type: 'select',
              label: 'Type',
              initialValue: availableTypes[0],
              options: availableTypes.map((type) => ({
                value: type,
                label: type === 'cars' ? 'Cars' : type === 'peds' ? 'Peds' : 'Props',
              })),
              required: true,
            },
            {
              key: 'radius',
              type: 'select',
              label: 'Radius',
              initialValue: '20',
              options: RADII.map((radius) => ({
                value: String(radius),
                label: radius === 'global' ? 'Global' : `${radius}m`,
              })),
              required: true,
            },
            {
              key: 'deep',
              type: 'checkbox',
              label: 'Deep clean',
              initialValue: true,
            },
          ],
          onSubmit: async (values) => {
            try {
              const type = values.type
              const radiusValue = values.radius
              const deep = values.deep === true
              const radius = radiusValue === 'global' ? 'global' : Number(radiusValue)
              await callLua('requestCleanup', {
                type,
                radius,
                deep,
              })
              notify('Cleanup executed', 'success')
            } catch {
              notify('Cleanup failed', 'error')
            }
            closeModal()
          },
        })}
      >
        <Icon name="trash" size="xs" />
        Clean area
      </button>
    </div>
  )
}
