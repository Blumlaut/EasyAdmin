interface NavigationProps {
  currentView: string
  onNavigate: (view: 'players') => void
  playerCount: number
}

export function Navigation({ currentView, onNavigate, playerCount }: NavigationProps) {
  const isActive = (view: string) => currentView === view || currentView === 'player-detail'

  return (
    <nav style={{
      flex: 1,
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <NavItem
        icon="👥"
        label="Players"
        badge={playerCount > 0 ? playerCount.toString() : undefined}
        active={isActive('players')}
        onClick={() => onNavigate('players')}
      />
      <NavItem
        icon="⚙️"
        label="Server"
        active={false}
        disabled
      />
      <NavItem
        icon="🔧"
        label="Settings"
        active={false}
        disabled
      />
    </nav>
  )
}

interface NavItemProps {
  icon: string
  label: string
  badge?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, badge, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      className={disabled ? 'btn' : undefined}
      onClick={!disabled ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderRadius: 6,
        background: active ? 'var(--bg-active)' : 'transparent',
        color: disabled ? 'var(--text-muted)' : active ? 'var(--accent-blue)' : 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 150ms',
        borderLeft: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
        paddingLeft: active ? 10 : 12,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          background: active ? 'var(--accent-blue)' : 'var(--bg-hover)',
          color: active ? '#0d1117' : 'var(--text-secondary)',
          padding: '1px 7px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          minWidth: 20,
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
