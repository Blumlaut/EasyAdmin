import type { Notification, Permissions } from '../../types'
import { ServerAnnouncements } from './ServerAnnouncements'
import { ServerInfo } from './ServerInfo'
import { ServerConvars } from './ServerConvars'
import { ServerCleanup } from './ServerCleanup'

interface ServerPageProps {
  permissions: Permissions
  isRedm: boolean
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerPage({ permissions, isRedm, onToast }: ServerPageProps) {
  return (
    <div className="page-container">
      {permissions['server.announce'] && <ServerAnnouncements onToast={onToast} />}
      {permissions['server.convars'] && <ServerInfo onToast={onToast} />}
      {permissions['server.convars'] && <ServerConvars onToast={onToast} />}
      {!isRedm && <ServerCleanup permissions={permissions} onToast={onToast} />}
    </div>
  )
}
