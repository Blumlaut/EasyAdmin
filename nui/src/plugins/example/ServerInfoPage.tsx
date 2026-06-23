/**
 * EasyInfo example plugin — Server Info page.
 *
 * Demonstrates calling a Lua handler via the plugin API and rendering
 * the result using standard EasyAdmin components.
 */

import { useEffect, useState } from 'react'
import { usePluginApi } from '../index'
import type { PluginPageProps } from '../index'
import { Skeleton } from '../../components/Skeleton'
import { Icon, type IconName } from '../../components/icons'

interface ServerInfo {
  resourceName: string
  uptimeMs: number
  playerCount: number
  frameRate: number
  gameName: string
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function ServerInfoPage({ pluginId }: PluginPageProps) {
  const api = usePluginApi(pluginId)
  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serverPlayerCount, setServerPlayerCount] = useState<number | null>(null)

  const fetchInfo = () => {
    setLoading(true)
    setError(null)
    api.callLua<ServerInfo>('getServerInfo')
      .then((data) => setInfo(data))
      .catch(() => setError('Failed to load server info from the Lua backend.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading state while fetching plugin data
    setLoading(true)
    fetchInfo()
    // Also demonstrate a server-side handler call (server = true)
    api.callLua<{ count: number }>('getPlayerCount', undefined, true)
      .then((res) => setServerPlayerCount(res.count))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchInfo is stable per api instance
  }, [api])

  if (loading) {
    return (
      <div className="page-container">
        <div className="card flex flex-col gap-2 p-4">
          <Skeleton height={20} width="40%" />
          <Skeleton height={16} width="70%" />
          <Skeleton height={16} width="55%" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <Icon name="alert-triangle" size="md" className="text-fg-warning" />
          <p className="text-sm text-fg-muted">{api.t(error)}</p>
          <button className="btn btn-sm btn-primary" onClick={fetchInfo}>
            <Icon name="refresh" size="xs" />
            {api.t('Retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!info) return null

  const rows: Array<{ label: string; value: string; icon: IconName }> = [
    { label: 'Resource', value: info.resourceName, icon: 'box' },
    { label: 'Game', value: info.gameName, icon: 'globe' },
    { label: 'Uptime', value: formatUptime(info.uptimeMs), icon: 'clock' },
    { label: 'Players Online', value: serverPlayerCount !== null ? String(serverPlayerCount) : '—', icon: 'users' },
    { label: 'Frame Rate', value: `${info.frameRate} FPS`, icon: 'activity' },
  ]

  return (
    <div className="page-container">
      <div className="mb-4">
        <h3 className="text-xl font-bold">{api.t('Server Info')}</h3>
        <p className="text-sm text-fg-muted">
          {api.t('Live server metrics provided by the EasyInfo example plugin.')}
        </p>
      </div>

      <div className="card flex flex-col gap-1 p-2">
        {rows.map((row) => (
          <div key={row.label} className="easyinfo-row flex items-center gap-3 px-3 py-2">
            <Icon name={row.icon} size="sm" className="text-fg-muted" />
            <span className="flex-1 text-sm text-fg-muted">{api.t(row.label)}</span>
            <span className="text-mono text-sm font-semibold">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="btn btn-sm btn-ghost" onClick={fetchInfo}>
          <Icon name="refresh" size="xs" />
          {api.t('Refresh')}
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => api.notify(api.t('Server info copied to clipboard'), 'success')}
        >
          <Icon name="info" size="xs" />
          {api.t('Notify')}
        </button>
        <span className="badge badge-default ml-auto text-xs">
          {api.hasPermission('server.resources.monitor')
            ? api.t('Monitor access')
            : api.t('Read-only')}
        </span>
      </div>
    </div>
  )
}
