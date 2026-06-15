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
      {/* Welcome card with gradient accent */}
      <div className="card" style={{
        borderTop: '2px solid',
        borderColor: 'var(--brand-blue)',
      }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="shield" size="lg" style={{ color: '#fff' }} />
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Welcome to EasyAdmin</h3>
            <p className="text-sm text-secondary mt-1">
              Select an option from the sidebar to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions section */}
      <div>
        <p className="section-label">Quick Actions</p>
        <div className="flex flex-col gap-1">
          {visible.map((action) => (
            <button
              key={action.id}
              className="dashboard-action-btn"
              onClick={() => onNavigate(action.id)}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius)',
                background: 'var(--bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={action.icon} size="sm" className="text-secondary" />
              </div>
              <span className="flex-1 text-left font-medium">{action.label}</span>
              {action.id === 'players' && playerCount > 0 && (
                <span className="badge badge-online">{playerCount} online</span>
              )}
              <Icon name="chevron-right" size="xs" className="text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
