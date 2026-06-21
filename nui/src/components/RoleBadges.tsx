import type { Player } from '../types'
import { Icon } from './icons'
import { Tooltip } from './Tooltip'

export const ROLE_BADGES = [
  { key: 'admin' as const, label: 'Admin', icon: 'shield', className: 'badge-admin', tooltip: 'Admin on this server' },
  { key: 'developer' as const, label: 'Developer', icon: 'code', className: 'badge-dev', tooltip: 'This user is an EasyAdmin Developer' },
  { key: 'contributor' as const, label: 'Contributor', icon: 'git-branch', className: 'badge-contributor', tooltip: 'This user is an EasyAdmin Contributor' },
] as const

export function RoleBadges({ player }: { player: Player }) {
  return (
    <>
      {ROLE_BADGES.map(({ key, label, icon, className, tooltip }) =>
        player[key] ? (
          <Tooltip key={key} content={tooltip}>
            <span className={`badge ${className} badge-role`}>
              <Icon name={icon} size="xs" />
              {label}
            </span>
          </Tooltip>
        ) : null
      )}
    </>
  )
}
