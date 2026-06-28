import type { CleanupRadius, CleanupType, Permissions } from '../../types'
import { notify } from '../../lib/notify'
import { useModalContext } from '../../ModalContext'
import { Icon } from '../../components/icons'
import { callLua } from '../../fivem'
import { useTranslation } from '../../lib/i18n'

interface ServerCleanupProps {
  permissions: Permissions
}

const RADII: CleanupRadius[] = [10, 20, 50, 100, 'global']

export function ServerCleanup({ permissions }: ServerCleanupProps) {
  const { openModal, closeModal } = useModalContext()
  const { t } = useTranslation()

  const availableTypes: CleanupType[] = []
  if (permissions['server.cleanup.cars']) availableTypes.push('cars')
  if (permissions['server.cleanup.peds']) availableTypes.push('peds')
  if (permissions['server.cleanup.props']) availableTypes.push('props')

  if (availableTypes.length === 0) return null

  return (
    <div className="card flex flex-col">
      <p className="section-label">{t("Cleanup")}</p>
      <p className="mb-3 flex-1 text-sm text-fg-subtle">
        {t("Remove cars, peds, or props from an area around you.")}
      </p>
      <button
        className="btn btn-danger btn-full"
        onClick={() => openModal({
          title: t('Clean Area'),
          description: t('Choose what to clean and how far from your position.'),
          submitLabel: t('Clean'),
          submitVariant: 'danger',
          fields: [
            {
              key: 'type',
              type: 'select',
              label: t('Type'),
              initialValue: availableTypes[0],
              options: availableTypes.map((type) => ({
                value: type,
                label: type === 'cars' ? t('Cars') : type === 'peds' ? t('Peds') : t('Props'),
              })),
              required: true,
            },
            {
              key: 'radius',
              type: 'select',
              label: t('Radius'),
              initialValue: '20',
              options: RADII.map((radius) => ({
                value: String(radius),
                label: radius === 'global' ? t('Global') : `${radius}m`,
              })),
              required: true,
            },
            {
              key: 'deep',
              type: 'checkbox',
              label: t('Deep clean'),
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
              notify(t('Cleanup executed'), 'success')
            } catch {
              notify(t('Cleanup failed'), 'error')
            }
            closeModal()
          },
        })}
      >
        <Icon name="trash-2" size="xs" />
        {t("Clean area")}
      </button>
    </div>
  )
}
