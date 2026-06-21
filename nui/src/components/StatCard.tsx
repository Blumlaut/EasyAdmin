import { Icon, type IconName } from './icons'

// ============================================================
// StatCard
// Reusable metric card with two layout variants:
//   "inline"  — icon on the left, text stacked on the right (Dashboard)
//   "overlay" — icon absolute top-right, text stacked below (Statistics)
// ============================================================

export interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: IconName
  iconColor: string
  bgColor: string
  variant?: 'inline' | 'overlay'
  className?: string
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  iconColor,
  bgColor,
  variant = 'inline',
  className = '',
}: StatCardProps) {
  if (variant === 'overlay') {
    return (
      <div className={`card statistics-card ${className}`}>
        <p className="statistics-label text-xs text-fg-muted">{label}</p>
        <p className="statistics-value mt-1 text-2xl font-bold">{value}</p>
        {subValue && <p className="mt-0.5 text-xs text-fg-muted">{subValue}</p>}
        <div
          className="statistics-icon statistics-icon--absolute"
          // eslint-disable-next-line nui/no-inline-styles -- dynamic background color from design token prop
          style={{ background: bgColor }}
        >
          <Icon name={icon} size="md"
            // eslint-disable-next-line nui/no-inline-styles -- dynamic icon color from design token prop
            style={{ color: iconColor }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`card dashboard-card-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div
          className="dashboard-stat-icon"
          // eslint-disable-next-line nui/no-inline-styles -- dynamic background color from design token prop
          style={{ background: bgColor }}
        >
          <Icon name={icon} size="sm"
            // eslint-disable-next-line nui/no-inline-styles -- dynamic icon color from design token prop
            style={{ color: iconColor }}
          />
        </div>
        <div className="min-w-0">
          <p className="dashboard-stat-label text-xs text-fg-muted">{label}</p>
          <p className="dashboard-stat-value text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
