/**
 * EasyInfo example plugin — Dashboard widget.
 *
 * A small status card injected into the dashboard. Demonstrates the
 * dashboard widget contribution type and the `order` field for sorting.
 */

import { useEffect, useState } from 'react'
import { usePluginApi } from '../index'
import type { DashboardWidgetProps } from '../index'
import { Skeleton } from '../../components/Skeleton'
import { Icon } from '../../components/icons'

interface WidgetStatus {
  online: boolean
  latencyMs: number
}

export function PluginStatusWidget({ pluginId }: DashboardWidgetProps) {
  const api = usePluginApi(pluginId)
  const [status, setStatus] = useState<WidgetStatus | null>(null)

  useEffect(() => {
    api.callLua<WidgetStatus>('getStatus')
      .then(setStatus)
      .catch(() => setStatus({ online: false, latencyMs: 0 }))
     
  }, [api])

  if (!status) {
    return (
      <div className="card dashboard-card-sm p-3">
        <Skeleton height={16} width="50%" />
      </div>
    )
  }

  return (
    <div className="card dashboard-card-sm easyinfo-widget p-3">
      <div className="flex items-center gap-2">
        <span
          className={`badge ${status.online ? 'badge-online' : 'badge-offline'}`}
        >
          {status.online ? api.t('Online') : api.t('Offline')}
        </span>
        <Icon name="activity" size="xs" className="text-fg-muted" />
      </div>
      <p className="mt-2 text-xs text-fg-muted">{api.t('EasyInfo Plugin')}</p>
      {status.online && (
        <p className="text-mono text-sm font-semibold">{status.latencyMs} ms</p>
      )}
    </div>
  )
}
