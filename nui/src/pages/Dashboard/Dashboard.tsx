import type { View } from '../../types'
import { Icon, type IconName } from '../../components/icons'

interface QuickAction {
  id: View
  label: string
  icon: IconName
  badge?: string | number
}

interface DashboardProps {
  onNavigate: (view: View) => void
  playerCount: number
  availableViews: View[]
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'players', label: 'Player Management', icon: 'users' },
  { id: 'bans', label: 'Ban List', icon: 'ban' },
  { id: 'reports', label: 'Reports', icon: 'flag' },
  { id: 'cached-players', label: 'Cached Players', icon: 'archive' },
  { id: 'server', label: 'Server Management', icon: 'server' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

export function Dashboard({ onNavigate, playerCount, availableViews }: DashboardProps) {
  const visible = QUICK_ACTIONS.filter((a) => availableViews.includes(a.id))

  return (
    <div className="page-container max-w-lg">
      <div className="card">
        <div className="flex items-center gap-3">
          <Icon name="shield" size="lg" className="text-accent-blue" />
          <div>
            <h3 className="text-xl font-semibold">Welcome to EasyAdmin</h3>
            <p className="text-sm text-secondary mt-1">
              Select an option from the sidebar to get started.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-col gap-2">
          {visible.map((action) => (
            <button
              key={action.id}
              className="btn btn-secondary justify-start"
              onClick={() => onNavigate(action.id)}
            >
              <Icon name={action.icon} size="sm" />
              <span className="flex-1 text-left">{action.label}</span>
              {action.id === 'players' && playerCount > 0 && (
                <span className="badge badge-online">{playerCount} online</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
