import type { Permissions } from '../../types'
import { ServerAnnouncements } from './ServerAnnouncements'
import { ServerCleanup } from './ServerCleanup'
import { ServerConvars } from './ServerConvars'
import { ServerEmergencyMode } from './ServerEmergencyMode'
import { ServerInfo } from './ServerInfo'

interface ServerPageProps {
  permissions: Permissions
  isRedm: boolean
}

export function ServerPage({ permissions, isRedm }: ServerPageProps) {
  const hasAnnounce = permissions['server.announce']
  const hasCleanup = !isRedm

  return (
    <div className="page-container">
      <ServerEmergencyMode permissions={permissions} />
      {permissions['server.convars'] && <ServerInfo permissions={permissions} />}
      {hasAnnounce && hasCleanup && (
        <div className="grid grid-cols-2 gap-3">
          <ServerAnnouncements permissions={permissions} />
          <ServerCleanup permissions={permissions} />
        </div>
      )}
      {hasAnnounce && !hasCleanup && <ServerAnnouncements permissions={permissions} />}
      {!hasAnnounce && hasCleanup && <ServerCleanup permissions={permissions} />}
      {permissions['server.convars'] && <ServerConvars permissions={permissions} />}
    </div>
  )
}
