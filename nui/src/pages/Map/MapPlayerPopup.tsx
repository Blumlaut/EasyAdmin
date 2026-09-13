import { Icon } from '../../components/icons'
import { useTranslation } from '../../lib/i18n'
import type { Permissions } from '../../types'
import type { MapPlayer } from './MapPage'

interface MapPlayerPopupProps {
  player: MapPlayer
  permissions: Permissions
  onSpectate: (player: MapPlayer) => void
  onTeleport: (player: MapPlayer) => void
  onDetails: (player: MapPlayer) => void
}

/**
 * Content for the player marker popup. GtaVMap renders this into the Leaflet
 * popup through its own React root (popups live outside the app tree), wrapped
 * in I18nProvider so translations apply.
 */
export function MapPlayerPopup({ player, permissions, onSpectate, onTeleport, onDetails }: MapPlayerPopupProps) {
  const { t } = useTranslation()
  const canSpectate = !!permissions['player.spectate']
  const canTeleport = !!permissions['player.teleport.single']

  return (
    <div className="ea-map-popup">
      <div className="ea-map-popup-header">
        <span className="ea-map-popup-title">{player.player.name}</span>
        {player.isSelf && <span className="ea-map-popup-badge">{t('you')}</span>}
      </div>
      <div className="ea-map-popup-meta">
        ID {player.player.id} · {Math.round(player.pos.x)}, {Math.round(player.pos.y)}
      </div>
      <div className="ea-map-popup-actions">
        {canSpectate && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => onSpectate(player)}>
            <Icon name="eye" size="xs" />
            {t('Spectate')}
          </button>
        )}
        {canTeleport && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => onTeleport(player)}>
            <Icon name="log-out" size="xs" />
            {t('Teleport')}
          </button>
        )}
        <button type="button" className="btn btn-sm btn-primary" onClick={() => onDetails(player)}>
          <Icon name="user" size="xs" />
          {t('Details')}
        </button>
      </div>
    </div>
  )
}
