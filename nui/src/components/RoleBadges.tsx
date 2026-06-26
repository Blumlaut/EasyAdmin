import type { Player } from '../types'
import { Icon } from './icons'
import { Tooltip } from './Tooltip'
import { useTranslation } from '../lib/i18n'

const ROLE_BADGES = [
  { key: 'admin' as const, labelKey: 'Admin', icon: 'shield', className: 'badge-admin', tooltipKey: 'Admin on this server' },
  { key: 'developer' as const, labelKey: 'Developer', icon: 'code', className: 'badge-dev', tooltipKey: 'This user is an EasyAdmin Developer' },
  { key: 'contributor' as const, labelKey: 'Contributor', icon: 'git-branch', className: 'badge-contributor', tooltipKey: 'This user is an EasyAdmin Contributor' },
] as const

export function RoleBadges({ player }: { player: Player }) {
  const { t } = useTranslation()
  return (
    <>
      {ROLE_BADGES.map(({ key, labelKey, icon, className, tooltipKey }) =>
        player[key] ? (
          <Tooltip key={key} content={t(tooltipKey)}>
            <span className={`badge ${className} badge-role`}>
              <Icon name={icon} size="xs" />
              {t(labelKey)}
            </span>
          </Tooltip>
        ) : null
      )}
    </>
  )
}
