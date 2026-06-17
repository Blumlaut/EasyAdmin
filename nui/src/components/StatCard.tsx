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
        <p className="text-xs text-muted statistics-label">{label}</p>
        <p className="text-2xl font-bold statistics-value mt-1">{value}</p>
        {subValue && <p className="text-xs text-muted mt-0.5">{subValue}</p>}
        <div
          className="statistics-icon"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ background: bgColor, position: 'absolute', top: '0.875rem', right: '1rem' }}
        >
          <Icon name={icon} size="md" style={{ color: iconColor }} />
        </div>
      </div>
    )
  }

  return (
    <div className={`card dashboard-card-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div
          className="dashboard-stat-icon"
          // eslint-disable-next-line nui/no-inline-styles
          style={{ background: bgColor }}
        >
          <Icon name={icon} size="sm" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted dashboard-stat-label">{label}</p>
          <p className="text-xl font-bold dashboard-stat-value">{value}</p>
        </div>
      </div>
    </div>
  )
}
