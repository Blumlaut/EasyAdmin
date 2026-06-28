import { CopyButton } from '../../components/CopyButton'
import { Icon } from '../../components/icons'
import { notify } from '../../lib/notify'
import { useTranslation } from '../../lib/i18n'

const GITHUB_URL = 'https://github.com/Blumlaut/EasyAdmin'
const DISCORD_URL = 'https://discord.gg/snaily'

interface LinkRowProps {
  icon: 'github' | 'discord'
  label: string
  url: string
}

function LinkRow({ icon, label, url }: LinkRowProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size="sm" className="shrink-0 text-fg-muted" />
      <span className="text-fg-secondary flex-1 text-sm">{label}</span>
      <CopyButton
        value={url}
        label={t("Copy")}
        onCopy={() => notify(t("{label} URL copied", { label }), 'success')}
        ariaLabel={t("Copy {label} URL", { label })}
      />
    </div>
  )
}

export function SettingsLinks() {
  const { t } = useTranslation()
  return (
    <div className="card">
      <p className="section-label">{t("Links")}</p>
      <div className="flex flex-col gap-2">
        <LinkRow icon="github" label={t("GitHub Repository")} url={GITHUB_URL} />
        <LinkRow icon="discord" label={t("Discord Server")} url={DISCORD_URL} />
      </div>
    </div>
  )
}
