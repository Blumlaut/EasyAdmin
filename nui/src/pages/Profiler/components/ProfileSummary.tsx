import type { ParsedProfile } from '../../../types'
import { Icon } from '../../../components/icons'

interface ProfileSummaryProps {
  profile: ParsedProfile
  onNewProfile: () => void
}

export function ProfileSummary({ profile, onNewProfile }: ProfileSummaryProps) {
  const { summary } = profile
  const capturedDate = new Date(profile.capturedAt)
  const capturedTime = capturedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const stats = [
    {
      label: 'Frames',
      value: summary.framesCaptured.toString(),
      icon: 'layers' as const,
      iconColor: 'var(--accent-blue)',
      bgColor: 'var(--bg-blue)',
    },
    {
      label: 'Avg Frame',
      value: `${summary.frameTimes.avgMs.toFixed(1)}ms`,
      icon: 'clock' as const,
      iconColor: 'var(--accent-green)',
      bgColor: 'var(--bg-green)',
    },
    {
      label: 'FPS',
      value: summary.frameTimes.fps.toFixed(1),
      icon: 'activity' as const,
      iconColor: 'var(--accent-purple)',
      bgColor: 'var(--bg-purple)',
    },
    {
      label: 'Total Tick',
      value: `${summary.totalTickTime.avgUs.toFixed(0)}μs`,
      icon: 'gauge' as const,
      iconColor: 'var(--accent-orange)',
      bgColor: 'var(--bg-orange)',
    },
  ]

  return (
    <div className="card profiler-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Profile Summary</h3>
          <p className="text-xs text-muted mt-1">
            Captured at {capturedTime}
          </p>
        </div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onNewProfile}
          title="Capture a new profile"
        >
          <Icon name="refresh" size="xs" />
          New Profile
        </button>
      </div>

      <div className="profiler-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="profiler-stat-card">
            <div
              className="profiler-stat-icon"
              // eslint-disable-next-line nui/no-inline-styles
              style={{ background: stat.bgColor, color: stat.iconColor }}
            >
              <Icon name={stat.icon} size="sm" />
            </div>
            <div className="profiler-stat-content">
              <span className="profiler-stat-label">{stat.label}</span>
              <span className="profiler-stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
