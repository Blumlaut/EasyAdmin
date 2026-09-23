import { Icon } from './icons'
import { Tooltip } from './Tooltip'
import { useTranslation } from '../lib/i18n'

interface VersionBadgeProps {
  /** Currently installed EasyAdmin version (e.g. "8.0"); nothing renders while null */
  version: string | null
  /** Latest available version, only used when `updateAvailable` is true */
  latestVersion?: string | null
  /** Highlight the badge and show an update tooltip on hover */
  updateAvailable?: boolean
}

// Release tags may carry a leading "v" (e.g. "v8.0") while the badge adds its own
function stripV(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version
}

/** Sidebar footer badge showing the installed EasyAdmin version. */
export function VersionBadge({ version, latestVersion, updateAvailable = false }: VersionBadgeProps) {
  const { t } = useTranslation()

  if (!version) return null

  const showUpdate = updateAvailable && !!latestVersion
  const updateLabel = showUpdate
    ? t('Update available: v{version}', { version: stripV(latestVersion) })
    : undefined

  const badge = (
    <span
      className={`version-badge${showUpdate ? ' version-badge--update' : ''}`}
      aria-label={updateLabel ?? t('EasyAdmin version {version}', { version: stripV(version) })}
    >
      {showUpdate && <Icon name="download" size="xs" />}
      <span className="version-badge-text">v{stripV(version)}</span>
    </span>
  )

  if (!updateLabel) return badge

  return <Tooltip content={updateLabel}>{badge}</Tooltip>
}
