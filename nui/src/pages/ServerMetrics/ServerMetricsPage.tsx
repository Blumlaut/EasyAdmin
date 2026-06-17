import type { Notification } from '../../types'
import { Icon } from '../../components/icons'

interface ServerMetricsPageProps {
  onToast: (text: string, type?: Notification['type']) => void
}

export function ServerMetricsPage({ onToast: _onToast }: ServerMetricsPageProps) {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Server Metrics</h3>
          <p className="text-xs text-muted mt-0.5">Entity tracking and server performance</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16">
        <div className="empty-state-icon empty-state-icon-blue mb-4">
          <Icon name="activity" size="lg" className="text-blue" />
        </div>
        <p className="text-sm text-muted font-medium">Coming Soon</p>
        <p className="text-xs text-muted mt-1">Server metrics will be tracked here</p>
      </div>
    </div>
  )
}
