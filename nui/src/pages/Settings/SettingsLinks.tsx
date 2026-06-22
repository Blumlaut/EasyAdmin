import { CopyButton } from '../../components/CopyButton'
import { Icon } from '../../components/icons'
import { notify } from '../../lib/notify'

const GITHUB_URL = 'https://github.com/Blumlaut/EasyAdmin'
const DISCORD_URL = 'https://discord.gg/snaily'

interface LinkRowProps {
  icon: 'github' | 'discord'
  label: string
  url: string
}

function LinkRow({ icon, label, url }: LinkRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size="sm" className="shrink-0 text-fg-muted" />
      <span className="flex-1 text-sm text-fg-secondary">{label}</span>
      <CopyButton
        value={url}
        label="Copy"
        onCopy={() => notify(`${label} URL copied`, 'success')}
        ariaLabel={`Copy ${label} URL`}
      />
    </div>
  )
}

export function SettingsLinks() {
  return (
    <div className="card">
      <p className="section-label">Links</p>
      <div className="flex flex-col gap-2">
        <LinkRow icon="github" label="GitHub Repository" url={GITHUB_URL} />
        <LinkRow icon="discord" label="Discord Server" url={DISCORD_URL} />
      </div>
    </div>
  )
}
