import type { Permissions } from '../../types'
import { ServerAnnouncements } from './ServerAnnouncements'
import { ServerInfo } from './ServerInfo'
import { ServerConvars } from './ServerConvars'
import { ServerCleanup } from './ServerCleanup'

interface ServerPageProps {
  permissions: Permissions
  isRedm: boolean
}

export function ServerPage({ permissions, isRedm }: ServerPageProps) {
  return (
    <div className="page-container">
      {permissions['server.announce'] && <ServerAnnouncements />}
      {permissions['server.convars'] && <ServerInfo />}
      {permissions['server.convars'] && <ServerConvars />}
      {!isRedm && <ServerCleanup permissions={permissions} />}
    </div>
  )
}
