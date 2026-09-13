import { Icon } from '../../components/icons'
import { useTranslation } from '../../lib/i18n'

interface MapTeleportPopupProps {
  x: number
  y: number
  onTeleport: () => void
}

/**
 * Content for the teleport-to-location popup. GtaVMap renders this into a
 * Leaflet popup at the clicked map position through its own React root,
 * wrapped in I18nProvider so translations apply.
 */
export function MapTeleportPopup({ x, y, onTeleport }: MapTeleportPopupProps) {
  const { t } = useTranslation()

  return (
    <div className="ea-map-popup">
      <div className="ea-map-popup-header">
        <span className="ea-map-popup-title">{t('Teleport here')}</span>
      </div>
      <div className="ea-map-popup-meta">
        {Math.round(x)}, {Math.round(y)}
      </div>
      <div className="ea-map-popup-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={onTeleport}>
          <Icon name="log-out" size="xs" />
          {t('Teleport')}
        </button>
      </div>
    </div>
  )
}
